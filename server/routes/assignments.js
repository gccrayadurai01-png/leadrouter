/**
 * Assignment Routes
 * Handle lead assignments and queue management
 */

const express = require('express');
const weightedRoundRobin = require('../core/weighted-round-robin');
const { authenticate, requireBDR, requireAdmin } = require('../middleware/auth');
const Assignment = require('../db/models/Assignment');
const Rep = require('../db/models/Rep');
const User = require('../db/models/User');
const mongoose = require('../db');

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
    
    const session = await mongoose.startSession();
    let result;
    
    try {
      await session.withTransaction(async () => {
        // Verify rep exists and is in correct queue
        const rep = await Rep.findOne({ _id: repId, queue }).session(session);
        
        if (!rep) {
          throw new Error('Rep not found in this queue');
        }
        
        // Create manual assignment (doesn't affect round robin scores)
        const assignment = new Assignment({
          rep_id: rep._id,
          queue,
          hubspot_contact_id: hubspotContactId || null,
          hubspot_deal_id: hubspotDealId || null,
          assigned_by: req.user.id,
          metadata: metadata || null,
          company_name: companyName || null,
          company_domain: companyDomain || null,
          is_manual: true,
          is_company_match: false
        });
        
        await assignment.save({ session });
        
        result = {
          success: true,
          assignmentId: assignment._id,
          rep: {
            id: rep._id,
            name: rep.name,
            hubspot_owner_id: rep.hubspot_owner_id
          },
          queue,
          assignedAt: assignment.assigned_at,
          isManual: true
        };
      });
      
      res.json(result);
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
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
    
    const session = await mongoose.startSession();
    let result;
    
    try {
      await session.withTransaction(async () => {
        // Find rep by name (case-insensitive)
        const rep = await Rep.findOne({
          name: { $regex: new RegExp(`^${repName.trim()}$`, 'i') },
          queue
        }).session(session);
        
        if (!rep) {
          throw new Error(`Rep "${repName}" not found in ${queue} queue`);
        }
        
        // Create multiple manual assignment records
        const assignments = [];
        for (let i = 0; i < countNum; i++) {
          assignments.push({
            rep_id: rep._id,
            queue,
            assigned_by: req.user.id,
            is_manual: true,
            is_company_match: false
          });
        }
        
        const created = await Assignment.insertMany(assignments, { session });
        
        result = {
          success: true,
          assignmentIds: created.map(a => a._id),
          rep: {
            id: rep._id,
            name: rep.name,
            hubspot_owner_id: rep.hubspot_owner_id
          },
          queue,
          count: countNum,
          message: `Successfully recorded ${countNum} manual assignment(s) for ${rep.name}`
        };
      });
      
      res.json(result);
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
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
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (fromDate && !dateRegex.test(fromDate)) {
      return res.status(400).json({ error: 'Invalid fromDate format. Use YYYY-MM-DD' });
    }
    if (toDate && !dateRegex.test(toDate)) {
      return res.status(400).json({ error: 'Invalid toDate format. Use YYYY-MM-DD' });
    }
    
    // Build date filter
    const dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.assigned_at = {};
      if (fromDate) {
        dateFilter.assigned_at.$gte = new Date(fromDate);
      }
      if (toDate) {
        const toDateEnd = new Date(toDate);
        toDateEnd.setHours(23, 59, 59, 999);
        dateFilter.assigned_at.$lte = toDateEnd;
      }
    }
    
    // Get SMB stats
    const smbFilter = { queue: 'SMB', ...dateFilter };
    const smbStats = await Assignment.aggregate([
      { $match: smbFilter },
      {
        $group: {
          _id: null,
          round_robin: {
            $sum: { $cond: [{ $and: [{ $eq: ['$is_manual', false] }, { $eq: ['$is_company_match', false] }] }, 1, 0] }
          },
          manual: { $sum: { $cond: [{ $eq: ['$is_manual', true] }, 1, 0] } },
          company_match: { $sum: { $cond: [{ $eq: ['$is_company_match', true] }, 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ]);
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const smbToday = await Assignment.countDocuments({ queue: 'SMB', assigned_at: { $gte: oneDayAgo }, ...dateFilter });
    const smbWeek = await Assignment.countDocuments({ queue: 'SMB', assigned_at: { $gte: oneWeekAgo }, ...dateFilter });
    
    // Get ENT stats
    const entFilter = { queue: 'ENT', ...dateFilter };
    const entStats = await Assignment.aggregate([
      { $match: entFilter },
      {
        $group: {
          _id: null,
          round_robin: {
            $sum: { $cond: [{ $and: [{ $eq: ['$is_manual', false] }, { $eq: ['$is_company_match', false] }] }, 1, 0] }
          },
          manual: { $sum: { $cond: [{ $eq: ['$is_manual', true] }, 1, 0] } },
          company_match: { $sum: { $cond: [{ $eq: ['$is_company_match', true] }, 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ]);
    
    const entToday = await Assignment.countDocuments({ queue: 'ENT', assigned_at: { $gte: oneDayAgo }, ...dateFilter });
    const entWeek = await Assignment.countDocuments({ queue: 'ENT', assigned_at: { $gte: oneWeekAgo }, ...dateFilter });
    
    // Get rep breakdown
    const smbReps = await Rep.find({ queue: 'SMB' }).lean();
    const entReps = await Rep.find({ queue: 'ENT' }).lean();
    
    const smbRepBreakdown = await Promise.all(smbReps.map(async (rep) => {
      const count = await Assignment.countDocuments({
        rep_id: rep._id,
        queue: 'SMB',
        ...dateFilter
      });
      return {
        name: rep.name,
        active: rep.active,
        count
      };
    }));
    
    const entRepBreakdown = await Promise.all(entReps.map(async (rep) => {
      const count = await Assignment.countDocuments({
        rep_id: rep._id,
        queue: 'ENT',
        ...dateFilter
      });
      return {
        name: rep.name,
        active: rep.active,
        count
      };
    }));
    
    res.json({
      smb: {
        round_robin: smbStats[0]?.round_robin || 0,
        manual: smbStats[0]?.manual || 0,
        company_match: smbStats[0]?.company_match || 0,
        total: smbStats[0]?.total || 0,
        today: smbToday,
        week: smbWeek,
        repBreakdown: smbRepBreakdown.sort((a, b) => {
          if (a.active !== b.active) return b.active - a.active;
          if (b.count !== a.count) return b.count - a.count;
          return a.name.localeCompare(b.name);
        })
      },
      ent: {
        round_robin: entStats[0]?.round_robin || 0,
        manual: entStats[0]?.manual || 0,
        company_match: entStats[0]?.company_match || 0,
        total: entStats[0]?.total || 0,
        today: entToday,
        week: entWeek,
        repBreakdown: entRepBreakdown.sort((a, b) => {
          if (a.active !== b.active) return b.active - a.active;
          if (b.count !== a.count) return b.count - a.count;
          return a.name.localeCompare(b.name);
        })
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
    
    const query = {};
    if (queue) query.queue = queue;
    if (rep_id) query.rep_id = rep_id;
    
    const assignments = await Assignment.find(query)
      .populate('rep_id', 'name')
      .populate('assigned_by', 'name')
      .sort({ assigned_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();
    
    res.json({
      assignments: assignments.map(a => ({
        id: a._id,
        repId: a.rep_id?._id || a.rep_id,
        repName: a.rep_id?.name || 'Unknown',
        queue: a.queue,
        hubspotContactId: a.hubspot_contact_id,
        hubspotDealId: a.hubspot_deal_id,
        assignedAt: a.assigned_at,
        scoreAtAssignment: a.score_at_assignment,
        weightAtAssignment: a.weight_at_assignment,
        metadata: a.metadata,
        assignedByName: a.assigned_by?.name || null
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
