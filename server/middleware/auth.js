/**
 * Authentication Middleware
 * Role-based access control for Admin and BDR
 */

const jwt = require('jsonwebtoken');
const User = require('../db/models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Authenticate user and attach to request
 */
async function authenticate(req, res, next) {
  try {
    // Bypass auth ONLY in development mode AND when explicitly enabled
    // SECURITY: Never bypass auth in production!
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      // Get admin user from database for mock authentication
      try {
        const adminUser = await User.findOne({ role: 'admin' });
        
        if (adminUser) {
          req.user = {
            id: adminUser._id.toString(),
            email: adminUser.email,
            role: adminUser.role,
            active: adminUser.active
          };
          return next();
        } else {
          // If no admin user exists, create a mock one
          req.user = {
            id: '000000000000000000000000',
            email: 'admin@leadrouter.com',
            role: 'admin',
            active: true
          };
          return next();
        }
      } catch (dbError) {
        // If database query fails, use mock user
        req.user = {
          id: '000000000000000000000000',
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
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }
    
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      active: user.active
    };
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
  if (!JWT_SECRET || JWT_SECRET === 'change-this-secret-in-production') {
    console.error('WARNING: JWT_SECRET is not set or using default value!');
  }
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

module.exports = {
  authenticate,
  requireAdmin,
  requireBDR,
  generateToken,
  JWT_SECRET
};
