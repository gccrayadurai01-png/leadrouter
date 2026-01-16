/**
 * Weighted Smooth Round Robin Engine
 * 
 * Deterministic algorithm for fair lead distribution:
 * 1. For every active rep: current_score += weight
 * 2. Pick rep with highest current_score
 * 3. Assign lead to that rep
 * 4. current_score -= total_active_weight
 * 5. Persist state
 * 
 * This guarantees:
 * - Fairness over time
 * - No starvation
 * - No double assignment
 * - Perfect proportional distribution
 */

const pool = require('../db');

class WeightedRoundRobin {
  /**
   * Assign next lead in queue
   * @param {string} queue - 'SMB' or 'ENT'
   * @param {Object} options - Assignment options
   * @returns {Promise<Object>} Assignment result
   */
  async assignNextLead(queue, options = {}) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check for company match first (if company info provided)
      let companyRepId = null;
      if (options.companyDomain || options.companyName) {
        const companyMatch = await client.query(`
          SELECT rep_id 
          FROM assignments 
          WHERE (company_domain = $1 OR company_name = $2)
          AND is_company_match = false
          AND queue = $3
          ORDER BY assigned_at DESC 
          LIMIT 1
        `, [options.companyDomain || null, options.companyName || null, queue]);
        
        if (companyMatch.rows.length > 0) {
          companyRepId = companyMatch.rows[0].rep_id;
        }
      }
      
      // Step 1: Get all active reps for this queue with their weights and scores
      const repsResult = await client.query(`
        SELECT 
          r.id,
          r.name,
          r.hubspot_owner_id,
          r.weight,
          COALESCE(rs.current_score, 0.0) as current_score
        FROM reps r
        LEFT JOIN rep_scores rs ON r.id = rs.rep_id AND rs.queue = r.queue
        WHERE r.queue = $1 AND r.active = true
        ORDER BY r.id
      `, [queue]);
      
      if (repsResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error(`No active reps found for queue: ${queue}`);
      }
      
      const reps = repsResult.rows;
      
      // Step 2: Calculate total active weight
      const totalActiveWeight = reps.reduce((sum, rep) => sum + parseFloat(rep.weight), 0);
      
      if (totalActiveWeight <= 0) {
        await client.query('ROLLBACK');
        throw new Error(`Invalid total weight for queue: ${queue}`);
      }
      
      // Step 3: Update scores: current_score += weight
      const updatedScores = [];
      for (const rep of reps) {
        const newScore = parseFloat(rep.current_score) + parseFloat(rep.weight);
        updatedScores.push({
          ...rep,
          newScore: newScore
        });
        
        // Update score in database
        await client.query(`
          INSERT INTO rep_scores (rep_id, queue, current_score)
          VALUES ($1, $2, $3)
          ON CONFLICT (rep_id, queue)
          DO UPDATE SET 
            current_score = $3,
            last_updated = CURRENT_TIMESTAMP
        `, [rep.id, queue, newScore]);
      }
      
      // Step 4: Pick rep with highest score (or use company match if found)
      let selectedRep;
      let isCompanyMatch = false;
      
      if (companyRepId) {
        // Use company match - find the rep
        selectedRep = updatedScores.find(r => r.id === companyRepId);
        if (selectedRep) {
          isCompanyMatch = true;
          // Don't update score for company matches (they don't count in round robin)
        }
      }
      
      // If no company match or company rep not found, use round robin
      if (!selectedRep) {
        selectedRep = updatedScores.reduce((max, rep) => 
          rep.newScore > max.newScore ? rep : max
        );
      }
      
      // Step 5: Deduct total weight from selected rep's score (only if not company match)
      if (!isCompanyMatch) {
        const finalScore = selectedRep.newScore - totalActiveWeight;
        
        await client.query(`
          UPDATE rep_scores
          SET current_score = $1, last_updated = CURRENT_TIMESTAMP
          WHERE rep_id = $2 AND queue = $3
        `, [finalScore, selectedRep.id, queue]);
      }
      
      // Step 6: Create assignment record
      const assignmentResult = await client.query(`
        INSERT INTO assignments (
          rep_id, queue, hubspot_contact_id, hubspot_deal_id,
          score_at_assignment, weight_at_assignment, assigned_by, metadata,
          company_name, company_domain, is_manual, is_company_match
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, assigned_at
      `, [
        selectedRep.id,
        queue,
        options.hubspotContactId || null,
        options.hubspotDealId || null,
        isCompanyMatch ? null : selectedRep.newScore, // No score for company matches
        selectedRep.weight,
        options.assignedBy || null,
        options.metadata ? JSON.stringify(options.metadata) : null,
        options.companyName || null,
        options.companyDomain || null,
        options.isManual || false,
        isCompanyMatch
      ]);
      
      // Step 7: Create audit log
      await client.query(`
        INSERT INTO audit_logs (action, entity_type, entity_id, user_id, changes)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'ASSIGN_LEAD',
        'assignment',
        assignmentResult.rows[0].id,
        options.assignedBy || null,
        JSON.stringify({
          queue,
          rep_id: selectedRep.id,
          rep_name: selectedRep.name,
          score: selectedRep.newScore,
          weight: selectedRep.weight
        })
      ]);
      
      await client.query('COMMIT');
      
      const assignment = {
        success: true,
        assignmentId: assignmentResult.rows[0].id,
        rep: {
          id: selectedRep.id,
          name: selectedRep.name,
          hubspot_owner_id: selectedRep.hubspot_owner_id,
          weight: parseFloat(selectedRep.weight)
        },
        queue,
        scoreAtAssignment: isCompanyMatch ? null : selectedRep.newScore,
        assignedAt: assignmentResult.rows[0].assigned_at,
        hubspotContactId: options.hubspotContactId,
        hubspotDealId: options.hubspotDealId,
        isCompanyMatch,
        isManual: options.isManual || false
      };

      // Sync to HubSpot if configured (async, don't block)
      if (options.hubspotContactId || options.hubspotDealId) {
        const { syncAssignmentToHubSpot } = require('../routes/hubspot');
        syncAssignmentToHubSpot(assignment, selectedRep).catch(err => {
          console.error('HubSpot sync failed (non-blocking):', err);
        });
      }
      
      return assignment;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Assignment error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get next rep who would receive a lead (without assigning)
   * @param {string} queue - 'SMB' or 'ENT'
   * @returns {Promise<Object>} Next rep info
   */
  async getNextRep(queue) {
    const client = await pool.connect();
    
    try {
      // Get all active reps with their current scores
      const repsResult = await client.query(`
        SELECT 
          r.id,
          r.name,
          r.hubspot_owner_id,
          r.weight,
          COALESCE(rs.current_score, 0.0) as current_score
        FROM reps r
        LEFT JOIN rep_scores rs ON r.id = rs.rep_id AND rs.queue = r.queue
        WHERE r.queue = $1 AND r.active = true
        ORDER BY r.id
      `, [queue]);
      
      if (repsResult.rows.length === 0) {
        return { success: false, message: `No active reps found for queue: ${queue}` };
      }
      
      const reps = repsResult.rows;
      const totalActiveWeight = reps.reduce((sum, rep) => sum + parseFloat(rep.weight), 0);
      
      // Calculate what scores would be after adding weights
      const projectedScores = reps.map(rep => ({
        ...rep,
        projectedScore: parseFloat(rep.current_score) + parseFloat(rep.weight)
      }));
      
      // Find rep with highest projected score
      const nextRep = projectedScores.reduce((max, rep) => 
        rep.projectedScore > max.projectedScore ? rep : max
      );
      
      return {
        success: true,
        rep: {
          id: nextRep.id,
          name: nextRep.name,
          hubspot_owner_id: nextRep.hubspot_owner_id,
          weight: parseFloat(nextRep.weight),
          currentScore: parseFloat(nextRep.current_score),
          projectedScore: nextRep.projectedScore
        },
        queue,
        totalActiveReps: reps.length,
        totalActiveWeight
      };
      
    } catch (error) {
      console.error('Get next rep error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get queue statistics
   * @param {string} queue - 'SMB' or 'ENT'
   * @returns {Promise<Object>} Queue stats
   */
  async getQueueStats(queue) {
    const client = await pool.connect();
    
    try {
      const statsResult = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE active = true) as active_reps,
          COUNT(*) FILTER (WHERE active = false) as inactive_reps,
          SUM(weight) FILTER (WHERE active = true) as total_weight,
          AVG(weight) FILTER (WHERE active = true) as avg_weight
        FROM reps
        WHERE queue = $1
      `, [queue]);
      
      const assignmentStats = await client.query(`
        SELECT 
          COUNT(*) as total_assignments,
          COUNT(*) FILTER (WHERE assigned_at > NOW() - INTERVAL '24 hours') as assignments_today,
          COUNT(*) FILTER (WHERE assigned_at > NOW() - INTERVAL '7 days') as assignments_week
        FROM assignments
        WHERE queue = $1
      `, [queue]);
      
      const repScores = await client.query(`
        SELECT 
          r.id,
          r.name,
          r.weight,
          COALESCE(rs.current_score, 0.0) as current_score,
          COUNT(a.id) as assignment_count
        FROM reps r
        LEFT JOIN rep_scores rs ON r.id = rs.rep_id AND rs.queue = r.queue
        LEFT JOIN assignments a ON r.id = a.rep_id AND a.queue = $1
        WHERE r.queue = $1
        GROUP BY r.id, r.name, r.weight, rs.current_score
        ORDER BY r.name
      `, [queue]);
      
      return {
        queue,
        reps: {
          active: parseInt(statsResult.rows[0].active_reps),
          inactive: parseInt(statsResult.rows[0].inactive_reps),
          totalWeight: parseFloat(statsResult.rows[0].total_weight || 0),
          avgWeight: parseFloat(statsResult.rows[0].avg_weight || 0)
        },
        assignments: {
          total: parseInt(assignmentStats.rows[0].total_assignments),
          today: parseInt(assignmentStats.rows[0].assignments_today),
          week: parseInt(assignmentStats.rows[0].assignments_week)
        },
        repDetails: repScores.rows.map(row => ({
          id: row.id,
          name: row.name,
          weight: parseFloat(row.weight),
          currentScore: parseFloat(row.current_score),
          assignmentCount: parseInt(row.assignment_count)
        }))
      };
      
    } catch (error) {
      console.error('Get queue stats error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Reset scores for a queue (use with caution)
   * @param {string} queue - 'SMB' or 'ENT'
   * @param {string} userId - User performing reset
   */
  async resetQueueScores(queue, userId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      await client.query(`
        UPDATE rep_scores
        SET current_score = 0.0, last_updated = CURRENT_TIMESTAMP
        WHERE queue = $1
      `, [queue]);
      
      await client.query(`
        INSERT INTO audit_logs (action, entity_type, user_id, changes)
        VALUES ($1, $2, $3, $4)
      `, [
        'RESET_SCORES',
        'queue',
        userId,
        JSON.stringify({ queue })
      ]);
      
      await client.query('COMMIT');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new WeightedRoundRobin();

