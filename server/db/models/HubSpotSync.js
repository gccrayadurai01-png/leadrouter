/**
 * HubSpotSync Model
 * Track HubSpot OAuth tokens and sync status
 */

const mongoose = require('mongoose');

const hubspotSyncSchema = new mongoose.Schema({
  access_token: String,
  refresh_token: String,
  expires_at: Date,
  hubspot_account_id: {
    type: String,
    unique: true,
    sparse: true
  },
  last_sync_at: Date,
  sync_status: String
}, {
  timestamps: true
});

module.exports = mongoose.model('HubSpotSync', hubspotSyncSchema);
