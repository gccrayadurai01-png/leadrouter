/**
 * Rep Model
 * Sales representatives with weights and queue assignments
 */

const mongoose = require('mongoose');

const repSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  hubspot_owner_id: {
    type: String,
    unique: true,
    sparse: true
  },
  queue: {
    type: String,
    required: true,
    enum: ['SMB', 'ENT']
  },
  weight: {
    type: Number,
    required: true,
    default: 1.0,
    min: 0.01
  },
  active: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes (email and hubspot_owner_id already have unique indexes from schema)
repSchema.index({ queue: 1, active: 1 });

module.exports = mongoose.model('Rep', repSchema);
