/**
 * Assignment Routes
 * Handle lead assignments and queue management
 */

const express = require('express');
const weightedRoundRobin = require('../core/weighted-round-robin');
const { authenticate, requireBDR, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/assignments/next/:queue
 * Get next rep who would receive a lead (BDR or Admin)
 */
router.get('/next/:queue', requireBDR, async (req, res) => {
  try {
    const { queue } = req.params;
    
    if (!['SMB', 'ENT'].includes(queue)) {
      return res.status(400).json({ error: 'Queue must be SMB or ENT' });
    }
    
    const nextRep = await weightedRoundRobin.getNextRep(queue);
    res.json(nextRep);
  } catch (error) {
    console.error('Get next rep error:', error);
    res.status(500).json({ error: 'Failed to get next rep' });
  }
});

/**
 * POST /api/assignments/assign/:queue
 * Assign next lead in queue (BDR or Admin)
 */
router.post('/assign/:queue', requireBDR, async (req, res) => {
  try {
    const { queue } = req.params;
    const { hubspotContactId, hubspotDealId, metadata, companyName, companyDomain } = req.body;
    
    if (!['SMB', 'ENT'].includes(queue)) {
      return res.status(400).json({ error: 'Queue must be SMB or ENT' });
    }
    
    const assignment = await weightedRoundRobin.assignNextLead(queue, {
      hubspotContactId,
      hubspotDealId,
      assignedBy: req.user.id,
      metadata,
      companyName,
      companyDomain
    });
    
    res.json(assignment);
  } catch (error) {
    console.error('Assign lead error:', error);
    res.status(500).json({ error: error.message || 'Failed to assign lead' });
  }
});

/**
 * POST /api/assignments/manual
 * Manually assign a lead to a specific rep (Admin only)
 */
router.post('/manual', requireAdmin, async (req, res) => {
  try {
    const { repId, queue, hubspotContactId, hubspotDealId, companyName, companyDomain, metadata } = req.body;
    
    if (!repId || !queue) {
      return res.status(400).json({ error: 'repId and queue are required' });
    }
    
    if (!['SMB', 'ENT'].includes(queue)) {
      return res.status(400).json({ error: 'Queue must be SMB or ENT' });
    }
    
    const pool = require('../db');
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verify rep exists and is in correct queue
      const repCheck = await client.query(
        'SELECT id, name, hubspot_owner_id FROM reps WHERE id = $1 AND queue = $2',
        [repId, queue]
      );
      
      if (repCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Rep not found in this queue' });
      }
      
      const rep = repCheck.rows[0];
      
      // Create manual assignment (doesn't affect round robin scores)
      const assignmentResult = await client.query(`
        INSERT INTO assignments (
          rep_id, queue, hubspot_contact_id, hubspot_deal_id,
          assigned_by, metadata, company_name, company_domain, is_manual, is_company_match
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, assigned_at
      `, [
        repId,
        queue,
        hubspotContactId || null,
        hubspotDealId || null,
        req.user.id,
        metadata ? JSON.stringify(metadata) : null,
        companyName || null,
        companyDomain || null,
        true, // is_manual
        false // is_company_match
      ]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        assignmentId: assignmentResult.rows[0].id,
        rep: {
          id: rep.id,
          name: rep.name,
          hubspot_owner_id: rep.hubspot_owner_id
        },
        queue,
        assignedAt: assignmentResult.rows[0].assigned_at,
        isManual: true
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Manual assignment error:', error);
    res.status(500).json({ error: error.message || 'Failed to manually assign lead' });
  }
});

/**
 * POST /api/assignments/record-manual
 * BDR records a manual assignment (already done in HubSpot)
 * Just increments the count, doesn't affect round robin
 */
router.post('/record-manual', requireBDR, async (req, res) => {
  try {
    const { queue, repName, count } = req.body;
    
    if (!queue || !repName || !count) {
      return res.status(400).json({ error: 'queue, repName, and count are required' });
    }
    
    if (!['SMB', 'ENT'].includes(queue)) {
      return res.status(400).json({ error: 'Queue must be SMB or ENT' });
    }
    
    const countNum = parseInt(count);
    if (isNaN(countNum) || countNum < 1) {
      return res.status(400).json({ error: 'count must be a positive number' });
    }
    
    const pool = require('../db');
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Find rep by name (case-insensitive)
      const repCheck = await client.query(
        'SELECT id, name, hubspot_owner_id FROM reps WHERE LOWER(name) = LOWER($1) AND queue = $2',
        [repName.trim(), queue]
      );
      
      if (repCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Rep "${repName}" not found in ${queue} queue` });
      }
      
      const rep = repCheck.rows[0];
      
      // Create multiple manual assignment records
      const assignmentIds = [];
      for (let i = 0; i < countNum; i++) {
        const assignmentResult = await client.query(`
          INSERT INTO assignments (
            rep_id, queue, assigned_by, is_manual, is_company_match
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, assigned_at
        `, [
          rep.id,
          queue,
          req.user.id,
          true, // is_manual
          false // is_company_match
        ]);
        assignmentIds.push(assignmentResult.rows[0].id);
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        assignmentIds,
        rep: {
          id: rep.id,
          name: rep.name,
          hubspot_owner_id: rep.hubspot_owner_id
        },
        queue,
        count: countNum,
        message: `Successfully recorded ${countNum} manual assignment(s) for ${rep.name}`
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Record manual assignment error:', error);
    res.status(500).json({ error: error.message || 'Failed to record manual assignment' });
  }
});

/**
 * GET /api/assignments/dashboard-stats
 * Get dashboard statistics for BDR (assignment counts by team)
 */
router.get('/dashboard-stats', requireBDR, async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const pool = require('../db');
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (fromDate && !dateRegex.test(fromDate)) {
      return res.status(400).json({ error: 'Invalid fromDate format. Use YYYY-MM-DD' });
    }
    if (toDate && !dateRegex.test(toDate)) {
      return res.status(400).json({ error: 'Invalid toDate format. Use YYYY-MM-DD' });
    }
    
    // Build date filter with parameterized queries
    let dateFilterClause = '';
    const dateParams = [];
    let paramCount = 1;
    
    if (fromDate && toDate) {
      dateFilterClause = `AND assigned_at >= $${paramCount}::date AND assigned_at <= $${paramCount + 1}::date + INTERVAL '1 day'`;
      dateParams.push(fromDate, toDate);
      paramCount += 2;
    } else if (fromDate) {
      dateFilterClause = `AND assigned_at >= $${paramCount}::date`;
      dateParams.push(fromDate);
      paramCount += 1;
    } else if (toDate) {
      dateFilterClause = `AND assigned_at <= $${paramCount}::date + INTERVAL '1 day'`;
      dateParams.push(toDate);
      paramCount += 1;
    }
    
    const smbStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_manual = false AND is_company_match = false) as round_robin,
        COUNT(*) FILTER (WHERE is_manual = true) as manual,
        COUNT(*) FILTER (WHERE is_company_match = true) as company_match,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE assigned_at > NOW() - INTERVAL '24 hours') as today,
        COUNT(*) FILTER (WHERE assigned_at > NOW() - INTERVAL '7 days') as week
      FROM assignments
      WHERE queue = 'SMB' ${dateFilterClause}
    `, dateParams);
    
    const entStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_manual = false AND is_company_match = false) as round_robin,
        COUNT(*) FILTER (WHERE is_manual = true) as manual,
        COUNT(*) FILTER (WHERE is_company_match = true) as company_match,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE assigned_at > NOW() - INTERVAL '24 hours') as today,
        COUNT(*) FILTER (WHERE assigned_at > NOW() - INTERVAL '7 days') as week
      FROM assignments
      WHERE queue = 'ENT' ${dateFilterClause}
    `, dateParams);
    
    // Get rep breakdown for charts (include inactive reps) - using parameterized queries
    let repDateFilter = '';
    const repDateParams = [];
    let repParamCount = 1;
    
    if (fromDate && toDate) {
      repDateFilter = `AND a.assigned_at >= $${repParamCount}::date AND a.assigned_at <= $${repParamCount + 1}::date + INTERVAL '1 day'`;
      repDateParams.push(fromDate, toDate);
      repParamCount += 2;
    } else if (fromDate) {
      repDateFilter = `AND a.assigned_at >= $${repParamCount}::date`;
      repDateParams.push(fromDate);
      repParamCount += 1;
    } else if (toDate) {
      repDateFilter = `AND a.assigned_at <= $${repParamCount}::date + INTERVAL '1 day'`;
      repDateParams.push(toDate);
      repParamCount += 1;
    }
    
    const smbRepBreakdown = await pool.query(`
      SELECT 
        r.name,
        r.active,
        COUNT(a.id) as count
      FROM reps r
      LEFT JOIN assignments a ON r.id = a.rep_id AND a.queue = 'SMB' ${repDateFilter}
      WHERE r.queue = 'SMB'
      GROUP BY r.id, r.name, r.active
      ORDER BY r.active DESC, count DESC, r.name
    `, repDateParams);
    
    const entRepBreakdown = await pool.query(`
      SELECT 
        r.name,
        r.active,
        COUNT(a.id) as count
      FROM reps r
      LEFT JOIN assignments a ON r.id = a.rep_id AND a.queue = 'ENT' ${repDateFilter}
      WHERE r.queue = 'ENT'
      GROUP BY r.id, r.name, r.active
      ORDER BY r.active DESC, count DESC, r.name
    `, repDateParams);
    
    res.json({
      smb: {
        ...smbStats.rows[0],
        repBreakdown: smbRepBreakdown.rows.map(r => ({
          name: r.name,
          count: parseInt(r.count || 0),
          active: r.active
        }))
      },
      ent: {
        ...entStats.rows[0],
        repBreakdown: entRepBreakdown.rows.map(r => ({
          name: r.name,
          count: parseInt(r.count || 0),
          active: r.active
        }))
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

/**
 * GET /api/assignments/queue/:queue/stats
 * Get queue statistics (BDR or Admin)
 */
router.get('/queue/:queue/stats', requireBDR, async (req, res) => {
  try {
    const { queue } = req.params;
    
    if (!['SMB', 'ENT'].includes(queue)) {
      return res.status(400).json({ error: 'Queue must be SMB or ENT' });
    }
    
    const stats = await weightedRoundRobin.getQueueStats(queue);
    res.json(stats);
  } catch (error) {
    console.error('Get queue stats error:', error);
    res.status(500).json({ error: 'Failed to get queue stats' });
  }
});

/**
 * GET /api/assignments
 * Get assignment history (Admin only)
 */
router.get('/', async (req, res) => {
  try {
    const { queue, rep_id, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        a.id,
        a.rep_id,
        r.name as rep_name,
        a.queue,
        a.hubspot_contact_id,
        a.hubspot_deal_id,
        a.assigned_at,
        a.score_at_assignment,
        a.weight_at_assignment,
        a.metadata,
        u.name as assigned_by_name
      FROM assignments a
      JOIN reps r ON a.rep_id = r.id
      LEFT JOIN users u ON a.assigned_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (queue) {
      query += ` AND a.queue = $${paramCount++}`;
      params.push(queue);
    }
    
    if (rep_id) {
      query += ` AND a.rep_id = $${paramCount++}`;
      params.push(rep_id);
    }
    
    query += ` ORDER BY a.assigned_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const pool = require('../db');
    const result = await pool.query(query, params);
    
    res.json({
      assignments: result.rows.map(row => ({
        id: row.id,
        repId: row.rep_id,
        repName: row.rep_name,
        queue: row.queue,
        hubspotContactId: row.hubspot_contact_id,
        hubspotDealId: row.hubspot_deal_id,
        assignedAt: row.assigned_at,
        scoreAtAssignment: parseFloat(row.score_at_assignment),
        weightAtAssignment: parseFloat(row.weight_at_assignment),
        metadata: row.metadata,
        assignedByName: row.assigned_by_name
      })),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

module.exports = router;

