/**
 * RepScore Model
 * Current weighted scores for round robin algorithm
 */

const mongoose = require('mongoose');

const repScoreSchema = new mongoose.Schema({
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
  current_score: {
    type: Number,
    required: true,
    default: 0.0
  },
  last_updated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Unique compound index
repScoreSchema.index({ rep_id: 1, queue: 1 }, { unique: true });
repScoreSchema.index({ queue: 1, current_score: -1 });

module.exports = mongoose.model('RepScore', repScoreSchema);
