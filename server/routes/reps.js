/**
 * Reps Routes
 * Admin-only endpoints for managing sales reps
 */

const express = require('express');
const Rep = require('../db/models/Rep');
const RepScore = require('../db/models/RepScore');
const Assignment = require('../db/models/Assignment');
const AuditLog = require('../db/models/AuditLog');
const { authenticate, requireAdmin } = require('../middleware/auth');
const mongoose = require('../db');

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
    
    const query = queue ? { queue } : {};
    const reps = await Rep.find(query).sort({ queue: 1, name: 1 }).lean();
    
    // Get scores and assignment counts
    const repIds = reps.map(r => r._id);
    const scores = await RepScore.find({
      rep_id: { $in: repIds }
    }).lean();
    
    const scoreMap = {};
    scores.forEach(s => {
      const key = `${s.rep_id.toString()}_${s.queue}`;
      scoreMap[key] = s.current_score || 0;
    });
    
    const assignmentCounts = await Assignment.aggregate([
      { $match: { rep_id: { $in: repIds } } },
      { $group: { _id: '$rep_id', count: { $sum: 1 } } }
    ]);
    
    const assignmentCountMap = {};
    assignmentCounts.forEach(a => {
      assignmentCountMap[a._id.toString()] = a.count;
    });
    
    res.json({
      reps: reps.map(rep => ({
        id: rep._id,
        name: rep.name,
        email: rep.email,
        hubspot_owner_id: rep.hubspot_owner_id,
        queue: rep.queue,
        weight: parseFloat(rep.weight),
        active: rep.active,
        currentScore: scoreMap[`${rep._id.toString()}_${rep.queue}`] || 0,
        assignmentCount: assignmentCountMap[rep._id.toString()] || 0,
        createdAt: rep.createdAt,
        updatedAt: rep.updatedAt
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
    const rep = await Rep.findById(req.params.id).lean();
    
    if (!rep) {
      return res.status(404).json({ error: 'Rep not found' });
    }
    
    const score = await RepScore.findOne({
      rep_id: rep._id,
      queue: rep.queue
    }).lean();
    
    res.json({
      id: rep._id,
      name: rep.name,
      email: rep.email,
      hubspot_owner_id: rep.hubspot_owner_id,
      queue: rep.queue,
      weight: parseFloat(rep.weight),
      active: rep.active,
      currentScore: score ? parseFloat(score.current_score) : 0,
      createdAt: rep.createdAt,
      updatedAt: rep.updatedAt
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
    
    const rep = new Rep({
      name,
      email,
      hubspot_owner_id: hubspot_owner_id || null,
      queue,
      weight,
      active: active !== false,
      created_by: req.user.id
    });
    
    await rep.save();
    
    // Initialize score
    const repScore = new RepScore({
      rep_id: rep._id,
      queue: rep.queue,
      current_score: 0.0
    });
    await repScore.save();
    
    // Audit log
    const auditLog = new AuditLog({
      action: 'CREATE_REP',
      entity_type: 'rep',
      entity_id: rep._id,
      user_id: req.user.id,
      changes: { name, email, queue, weight, active }
    });
    await auditLog.save();
    
    res.status(201).json({
      rep: {
        id: rep._id,
        name: rep.name,
        email: rep.email,
        hubspot_owner_id: rep.hubspot_owner_id,
        queue: rep.queue,
        weight: rep.weight,
        active: rep.active,
        createdAt: rep.createdAt
      }
    });
  } catch (error) {
    if (error.code === 11000) { // MongoDB duplicate key
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
    
    const rep = await Rep.findById(req.params.id);
    if (!rep) {
      return res.status(404).json({ error: 'Rep not found' });
    }
    
    const current = { ...rep.toObject() };
    
    // Update fields
    if (name !== undefined) rep.name = name;
    if (email !== undefined) rep.email = email;
    if (hubspot_owner_id !== undefined) rep.hubspot_owner_id = hubspot_owner_id;
    if (queue !== undefined) {
      if (!['SMB', 'ENT'].includes(queue)) {
        return res.status(400).json({ error: 'Queue must be SMB or ENT' });
      }
      rep.queue = queue;
    }
    if (weight !== undefined) {
      if (weight <= 0) {
        return res.status(400).json({ error: 'Weight must be greater than 0' });
      }
      rep.weight = weight;
    }
    if (active !== undefined) rep.active = active;
    
    rep.updated_by = req.user.id;
    
    await rep.save();
    
    // If queue changed, update score
    if (queue && queue !== current.queue) {
      // Reset old queue score
      await RepScore.updateOne(
        { rep_id: rep._id, queue: current.queue },
        { current_score: 0.0 }
      );
      
      // Initialize new queue score
      await RepScore.findOneAndUpdate(
        { rep_id: rep._id, queue: queue },
        {
          rep_id: rep._id,
          queue: queue,
          current_score: 0.0
        },
        { upsert: true }
      );
    }
    
    // Audit log
    const auditLog = new AuditLog({
      action: 'UPDATE_REP',
      entity_type: 'rep',
      entity_id: rep._id,
      user_id: req.user.id,
      changes: { before: current, after: rep.toObject() }
    });
    await auditLog.save();
    
    res.json({ rep: rep.toObject() });
  } catch (error) {
    if (error.code === 11000) {
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
    const rep = await Rep.findByIdAndDelete(req.params.id);
    
    if (!rep) {
      return res.status(404).json({ error: 'Rep not found' });
    }
    
    // Delete associated scores (MongoDB will handle this with schema if we add it)
    await RepScore.deleteMany({ rep_id: rep._id });
    
    // Audit log
    const auditLog = new AuditLog({
      action: 'DELETE_REP',
      entity_type: 'rep',
      entity_id: rep._id,
      user_id: req.user.id,
      changes: { rep: rep.toObject() }
    });
    await auditLog.save();
    
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
    
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Verify rep exists
        const rep = await Rep.findOne({ _id: id, queue }).session(session);
        
        if (!rep) {
          throw new Error('Rep not found in this queue');
        }
        
        // Get current assignment count
        const current = await Assignment.countDocuments({
          rep_id: id,
          queue
        }).session(session);
        
        const difference = countNum - current;
        
        if (difference > 0) {
          // Add manual assignments
          const assignments = [];
          for (let i = 0; i < difference; i++) {
            assignments.push({
              rep_id: id,
              queue,
              assigned_by: req.user.id,
              is_manual: true,
              is_company_match: false
            });
          }
          await Assignment.insertMany(assignments, { session });
        } else if (difference < 0) {
          // Remove oldest manual assignments
          const toDelete = await Assignment.find({
            rep_id: id,
            queue,
            is_manual: true
          })
          .sort({ assigned_at: 1 })
          .limit(Math.abs(difference))
          .session(session);
          
          const idsToDelete = toDelete.map(a => a._id);
          await Assignment.deleteMany({ _id: { $in: idsToDelete } }).session(session);
        }
      });
      
      const currentCount = await Assignment.countDocuments({ rep_id: id, queue });
      
      res.json({
        success: true,
        message: `Assignment count updated to ${countNum}`,
        previousCount: currentCount,
        newCount: countNum
      });
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Update assignment count error:', error);
    res.status(500).json({ error: error.message || 'Failed to update assignment count' });
  }
});

module.exports = router;
