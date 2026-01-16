/**
 * Authentication Middleware
 * Role-based access control for Admin and BDR
 */

const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Authenticate user and attach to request
 */
async function authenticate(req, res, next) {
  try {
    // Bypass auth in development mode
    if (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true') {
      // Get admin user from database for mock authentication
      try {
        const adminUser = await pool.query(
          'SELECT id, email, role, active FROM users WHERE role = $1 LIMIT 1',
          ['admin']
        );
        
        if (adminUser.rows.length > 0) {
          req.user = adminUser.rows[0];
          return next();
        } else {
          // If no admin user exists, create a mock one
          req.user = {
            id: '00000000-0000-0000-0000-000000000000',
            email: 'admin@leadrouter.com',
            role: 'admin',
            active: true
          };
          return next();
        }
      } catch (dbError) {
        // If database query fails, use mock user
        req.user = {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'admin@leadrouter.com',
          role: 'admin',
          active: true
        };
        return next();
      }
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify user still exists and is active
    const userResult = await pool.query(
      'SELECT id, email, role, active FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].active) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }
    
    req.user = userResult.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Require admin role
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Require BDR or Admin role
 */
function requireBDR(req, res, next) {
  if (req.user.role !== 'bdr' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'BDR or Admin access required' });
  }
  next();
}

/**
 * Generate JWT token
 */
function generateToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

module.exports = {
  authenticate,
  requireAdmin,
  requireBDR,
  generateToken,
  JWT_SECRET
};

