/**
 * Assignment Model
 * Lead assignment history
 */

const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  rep_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rep',
    required: true
  },
  queue: {
    type: String,
    required: true,
    enum: ['SMB', 'ENT']
  },
  hubspot_contact_id: String,
  hubspot_deal_id: String,
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  score_at_assignment: Number,
  weight_at_assignment: Number,
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  company_name: String,
  company_domain: String,
  is_manual: {
    type: Boolean,
    default: false
  },
  is_company_match: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'assigned_at', updatedAt: false }
});

// Indexes
assignmentSchema.index({ rep_id: 1 });
assignmentSchema.index({ queue: 1 });
assignmentSchema.index({ assigned_at: -1 });
assignmentSchema.index({ company_domain: 1 });
assignmentSchema.index({ company_name: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
