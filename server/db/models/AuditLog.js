/**
 * AuditLog Model
 * System change audit trail
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  entity_type: {
    type: String,
    required: true
  },
  entity_id: mongoose.Schema.Types.ObjectId,
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  changes: {
    type: mongoose.Schema.Types.Mixed
  },
  ip_address: String,
  user_agent: String
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Indexes
auditLogSchema.index({ entity_type: 1, entity_id: 1 });
auditLogSchema.index({ created_at: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
