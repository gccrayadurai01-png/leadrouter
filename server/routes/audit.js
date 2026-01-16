/**
 * Audit Log Routes
 * Admin-only access to audit logs
 */

const express = require('express');
const pool = require('../db');
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
    
    let query = `
      SELECT 
        a.id,
        a.action,
        a.entity_type,
        a.entity_id,
        a.user_id,
        u.name as user_name,
        u.email as user_email,
        a.changes,
        a.ip_address,
        a.user_agent,
        a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (entity_type) {
      query += ` AND a.entity_type = $${paramCount++}`;
      params.push(entity_type);
    }
    
    if (entity_id) {
      query += ` AND a.entity_id = $${paramCount++}`;
      params.push(entity_id);
    }
    
    if (action) {
      query += ` AND a.action = $${paramCount++}`;
      params.push(action);
    }
    
    query += ` ORDER BY a.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    res.json({
      logs: result.rows.map(row => ({
        id: row.id,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        changes: row.changes,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at
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

