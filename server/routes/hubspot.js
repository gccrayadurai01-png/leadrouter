/**
 * HubSpot Integration Routes
 * OAuth and API integration for HubSpot
 */

const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const HubSpotSync = require('../db/models/HubSpotSync');
const { Client } = require('@hubspot/api-client');

const router = express.Router();

// OAuth callback (public)
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET,
        redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
        code: code,
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      return res.status(400).json({ error: tokens.error_description || 'OAuth error' });
    }

    // Store tokens in database (upsert by hubspot_account_id)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    
    await HubSpotSync.findOneAndUpdate(
      { hubspot_account_id: tokens.hub_id || null },
      {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        hubspot_account_id: tokens.hub_id || null
      },
      { upsert: true, new: true }
    );

    res.redirect('/admin?hubspot=connected');
  } catch (error) {
    console.error('HubSpot OAuth error:', error);
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

// Get OAuth URL (Admin only)
router.get('/auth-url', authenticate, requireAdmin, (req, res) => {
  const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${process.env.HUBSPOT_CLIENT_ID}&scope=contacts%20deals&redirect_uri=${encodeURIComponent(process.env.HUBSPOT_REDIRECT_URI)}`;
  res.json({ authUrl });
});

// Get HubSpot connection status (Admin only)
router.get('/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const sync = await HubSpotSync.findOne({
      access_token: { $ne: null }
    })
    .sort({ createdAt: -1 })
    .lean();

    if (!sync) {
      return res.json({ connected: false });
    }

    res.json({
      connected: !!sync.access_token,
      expiresAt: sync.expires_at,
      lastSyncAt: sync.last_sync_at,
      syncStatus: sync.sync_status
    });
  } catch (error) {
    console.error('HubSpot status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Sync assignment to HubSpot
async function syncAssignmentToHubSpot(assignment, rep) {
  try {
    const sync = await HubSpotSync.findOne({
      access_token: { $ne: null }
    })
    .sort({ createdAt: -1 })
    .lean();

    if (!sync || !sync.access_token) {
      console.log('HubSpot not connected');
      return { success: false, error: 'HubSpot not connected' };
    }

    const { access_token, expires_at } = sync;

    // Check if token is expired
    if (new Date(expires_at) < new Date()) {
      // TODO: Refresh token
      return { success: false, error: 'HubSpot token expired' };
    }

    if (!rep.hubspot_owner_id) {
      return { success: false, error: 'Rep has no HubSpot owner ID' };
    }

    const hubspotClient = new Client({ accessToken: access_token });

    // Update contact if contact ID provided
    if (assignment.hubspotContactId) {
      await hubspotClient.crm.contacts.basicApi.update(assignment.hubspotContactId, {
        properties: {
          hubspot_owner_id: rep.hubspot_owner_id
        }
      });
    }

    // Update deal if deal ID provided
    if (assignment.hubspotDealId) {
      await hubspotClient.crm.deals.basicApi.update(assignment.hubspotDealId, {
        properties: {
          hubspot_owner_id: rep.hubspot_owner_id
        }
      });
    }

    // Update sync status
    await HubSpotSync.findByIdAndUpdate(sync._id, {
      last_sync_at: new Date(),
      sync_status: 'success'
    });

    return { success: true };
  } catch (error) {
    console.error('HubSpot sync error:', error);
    
    // Update sync status
    const sync = await HubSpotSync.findOne({
      access_token: { $ne: null }
    })
    .sort({ createdAt: -1 });
    
    if (sync) {
      await HubSpotSync.findByIdAndUpdate(sync._id, {
        sync_status: 'error'
      });
    }

    return { success: false, error: error.message };
  }
}

module.exports = { router, syncAssignmentToHubSpot };
