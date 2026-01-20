/**
 * Audit Log Routes
 * Admin-only access to audit logs
 */

const express = require('express');
const AuditLog = require('../db/models/AuditLog');
const User = require('../db/models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/audit
 * Get audit logs
 */
router.get('/', async (req, res) => {
  try {
    const { entity_type, entity_id, action, limit = 100, offset = 0 } = req.query;
    
    const query = {};
    if (entity_type) query.entity_type = entity_type;
    if (entity_id) query.entity_id = entity_id;
    if (action) query.action = action;
    
    const logs = await AuditLog.find(query)
      .populate('user_id', 'name email')
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();
    
    res.json({
      logs: logs.map(log => ({
        id: log._id,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        userId: log.user_id?._id || log.user_id,
        userName: log.user_id?.name || null,
        userEmail: log.user_id?.email || null,
        changes: log.changes,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        createdAt: log.created_at
      })),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
