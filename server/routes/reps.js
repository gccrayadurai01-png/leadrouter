/**
 * Reps Routes
 * Admin-only endpoints for managing sales reps
 */

const express = require('express');
const pool = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/reps
 * Get all reps (with optional queue filter)
 */
router.get('/', async (req, res) => {
  try {
    const { queue } = req.query;
    
    let query = `
      SELECT 
        r.id,
        r.name,
        r.email,
        r.hubspot_owner_id,
        r.queue,
        r.weight,
        r.active,
        r.created_at,
        r.updated_at,
        COALESCE(rs.current_score, 0.0) as current_score,
        COUNT(a.id) as assignment_count
      FROM reps r
      LEFT JOIN rep_scores rs ON r.id = rs.rep_id AND rs.queue = r.queue
      LEFT JOIN assignments a ON r.id = a.rep_id
    `;
    
    const params = [];
    if (queue) {
      query += ' WHERE r.queue = $1';
      params.push(queue);
    }
    
    query += ' GROUP BY r.id, rs.current_score ORDER BY r.queue, r.name';
    
    const result = await pool.query(query, params);
    
    res.json({
      reps: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        hubspot_owner_id: row.hubspot_owner_id,
        queue: row.queue,
        weight: parseFloat(row.weight),
        active: row.active,
        currentScore: parseFloat(row.current_score),
        assignmentCount: parseInt(row.assignment_count),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  } catch (error) {
    console.error('Get reps error:', error);
    res.status(500).json({ error: 'Failed to fetch reps' });
  }
});

/**
 * GET /api/reps/:id
 * Get single rep
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.*,
        COALESCE(rs.current_score, 0.0) as current_score
      FROM reps r
      LEFT JOIN rep_scores rs ON r.id = rs.rep_id AND rs.queue = r.queue
      WHERE r.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rep not found' });
    }
    
    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      email: row.email,
      hubspot_owner_id: row.hubspot_owner_id,
      queue: row.queue,
      weight: parseFloat(row.weight),
      active: row.active,
      currentScore: parseFloat(row.current_score),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('Get rep error:', error);
    res.status(500).json({ error: 'Failed to fetch rep' });
  }
});

/**
 * POST /api/reps
 * Create new rep (Admin only)
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, email, hubspot_owner_id, queue, weight, active } = req.body;
    
    if (!name || !email || !queue || !weight) {
      return res.status(400).json({ error: 'Name, email, queue, and weight are required' });
    }
    
    if (!['SMB', 'ENT'].includes(queue)) {
      return res.status(400).json({ error: 'Queue must be SMB or ENT' });
    }
    
    if (weight <= 0) {
      return res.status(400).json({ error: 'Weight must be greater than 0' });
    }
    
    const result = await pool.query(`
      INSERT INTO reps (name, email, hubspot_owner_id, queue, weight, active, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, hubspot_owner_id, queue, weight, active, created_at
    `, [name, email, hubspot_owner_id || null, queue, weight, active !== false, req.user.id]);
    
    // Audit log
    await pool.query(`
      INSERT INTO audit_logs (action, entity_type, entity_id, user_id, changes)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'CREATE_REP',
      'rep',
      result.rows[0].id,
      req.user.id,
      JSON.stringify({ name, email, queue, weight, active })
    ]);
    
    res.status(201).json({ rep: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Email or HubSpot owner ID already exists' });
    }
    console.error('Create rep error:', error);
    res.status(500).json({ error: 'Failed to create rep' });
  }
});

/**
 * PUT /api/reps/:id
 * Update rep (Admin only)
 */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, email, hubspot_owner_id, queue, weight, active } = req.body;
    
    // Get current rep data
    const currentResult = await pool.query('SELECT * FROM reps WHERE id = $1', [req.params.id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Rep not found' });
    }
    
    const current = currentResult.rows[0];
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (hubspot_owner_id !== undefined) {
      updates.push(`hubspot_owner_id = $${paramCount++}`);
      values.push(hubspot_owner_id);
    }
    if (queue !== undefined) {
      if (!['SMB', 'ENT'].includes(queue)) {
        return res.status(400).json({ error: 'Queue must be SMB or ENT' });
      }
      updates.push(`queue = $${paramCount++}`);
      values.push(queue);
    }
    if (weight !== undefined) {
      if (weight <= 0) {
        return res.status(400).json({ error: 'Weight must be greater than 0' });
      }
      updates.push(`weight = $${paramCount++}`);
      values.push(weight);
    }
    if (active !== undefined) {
      updates.push(`active = $${paramCount++}`);
      values.push(active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_by = $${paramCount++}`);
    values.push(req.user.id);
    
    values.push(req.params.id);
    
    const result = await pool.query(`
      UPDATE reps
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
    
    // Audit log
    await pool.query(`
      INSERT INTO audit_logs (action, entity_type, entity_id, user_id, changes)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'UPDATE_REP',
      'rep',
      req.params.id,
      req.user.id,
      JSON.stringify({ before: current, after: result.rows[0] })
    ]);
    
    res.json({ rep: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email or HubSpot owner ID already exists' });
    }
    console.error('Update rep error:', error);
    res.status(500).json({ error: 'Failed to update rep' });
  }
});

/**
 * DELETE /api/reps/:id
 * Delete rep (Admin only)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reps WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rep not found' });
    }
    
    // Audit log
    await pool.query(`
      INSERT INTO audit_logs (action, entity_type, entity_id, user_id, changes)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'DELETE_REP',
      'rep',
      req.params.id,
      req.user.id,
      JSON.stringify({ rep: result.rows[0] })
    ]);
    
    res.json({ message: 'Rep deleted successfully' });
  } catch (error) {
    console.error('Delete rep error:', error);
    res.status(500).json({ error: 'Failed to delete rep' });
  }
});

/**
 * PUT /api/reps/:id/assignment-count
 * Update assignment count for a rep (Admin only)
 */
router.put('/:id/assignment-count', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { queue, count } = req.body;
    
    if (!queue || count === undefined) {
      return res.status(400).json({ error: 'queue and count are required' });
    }
    
    if (!['SMB', 'ENT'].includes(queue)) {
      return res.status(400).json({ error: 'Queue must be SMB or ENT' });
    }
    
    const countNum = parseInt(count);
    if (isNaN(countNum) || countNum < 0) {
      return res.status(400).json({ error: 'count must be a non-negative number' });
    }
    
    const pool = require('../db');
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verify rep exists
      const repCheck = await client.query(
        'SELECT id, name FROM reps WHERE id = $1 AND queue = $2',
        [id, queue]
      );
      
      if (repCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Rep not found in this queue' });
      }
      
      // Get current assignment count
      const currentCount = await client.query(
        'SELECT COUNT(*) as count FROM assignments WHERE rep_id = $1 AND queue = $2',
        [id, queue]
      );
      
      const current = parseInt(currentCount.rows[0].count);
      const difference = countNum - current;
      
      if (difference > 0) {
        // Add manual assignments
        for (let i = 0; i < difference; i++) {
          await client.query(`
            INSERT INTO assignments (rep_id, queue, assigned_by, is_manual, is_company_match)
            VALUES ($1, $2, $3, $4, $5)
          `, [id, queue, req.user.id, true, false]);
        }
      } else if (difference < 0) {
        // Remove oldest manual assignments
        await client.query(`
          DELETE FROM assignments
          WHERE id IN (
            SELECT id FROM assignments
            WHERE rep_id = $1 AND queue = $2 AND is_manual = true
            ORDER BY assigned_at ASC
            LIMIT $3
          )
        `, [id, queue, Math.abs(difference)]);
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `Assignment count updated to ${countNum}`,
        previousCount: current,
        newCount: countNum
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update assignment count error:', error);
    res.status(500).json({ error: error.message || 'Failed to update assignment count' });
  }
});

module.exports = router;

