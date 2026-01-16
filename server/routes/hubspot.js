/**
 * HubSpot Integration Routes
 * OAuth and API integration for HubSpot
 */

const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const pool = require('../db');
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

    // Store tokens in database
    await pool.query(`
      INSERT INTO hubspot_sync (access_token, refresh_token, expires_at, hubspot_account_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        access_token = $1,
        refresh_token = $2,
        expires_at = $3,
        updated_at = CURRENT_TIMESTAMP
    `, [
      tokens.access_token,
      tokens.refresh_token,
      new Date(Date.now() + tokens.expires_in * 1000),
      tokens.hub_id || null
    ]);

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
    const result = await pool.query(`
      SELECT 
        access_token IS NOT NULL as connected,
        expires_at,
        last_sync_at,
        sync_status
      FROM hubspot_sync
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.json({ connected: false });
    }

    res.json({
      connected: result.rows[0].connected,
      expiresAt: result.rows[0].expires_at,
      lastSyncAt: result.rows[0].last_sync_at,
      syncStatus: result.rows[0].sync_status
    });
  } catch (error) {
    console.error('HubSpot status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Sync assignment to HubSpot
async function syncAssignmentToHubSpot(assignment, rep) {
  try {
    const result = await pool.query(`
      SELECT access_token, expires_at
      FROM hubspot_sync
      WHERE access_token IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0 || !result.rows[0].access_token) {
      console.log('HubSpot not connected');
      return { success: false, error: 'HubSpot not connected' };
    }

    const { access_token, expires_at } = result.rows[0];

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
    await pool.query(`
      UPDATE hubspot_sync
      SET last_sync_at = CURRENT_TIMESTAMP, sync_status = 'success'
      WHERE access_token = $1
    `, [access_token]);

    return { success: true };
  } catch (error) {
    console.error('HubSpot sync error:', error);
    
    // Update sync status
    await pool.query(`
      UPDATE hubspot_sync
      SET sync_status = 'error'
      WHERE access_token = (
        SELECT access_token FROM hubspot_sync
        WHERE access_token IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
      )
    `);

    return { success: false, error: error.message };
  }
}

module.exports = { router, syncAssignmentToHubSpot };

