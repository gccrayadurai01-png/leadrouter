/**
 * User Model
 * Authentication and authorization
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'bdr']
  },
  name: String,
  active: {
    type: Boolean,
    default: true
  },
  last_login: Date
}, {
  timestamps: true
});

// Indexes (email already has unique index from schema)
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
