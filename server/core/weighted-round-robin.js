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

const mongoose = require('../db');
const Rep = require('../db/models/Rep');
const RepScore = require('../db/models/RepScore');
const Assignment = require('../db/models/Assignment');
const AuditLog = require('../db/models/AuditLog');

class WeightedRoundRobin {
  /**
   * Assign next lead in queue
   * @param {string} queue - 'SMB' or 'ENT'
   * @param {Object} options - Assignment options
   * @returns {Promise<Object>} Assignment result
   */
  async assignNextLead(queue, options = {}) {
    const session = await mongoose.startSession();
    let assignmentData;
    
    try {
      await session.withTransaction(async () => {
        // Check for company match first (if company info provided)
        let companyRepId = null;
        if (options.companyDomain || options.companyName) {
          const companyMatch = await Assignment.findOne({
            $or: [
              { company_domain: options.companyDomain || null },
              { company_name: options.companyName || null }
            ],
            is_company_match: false,
            queue: queue
          })
          .sort({ assigned_at: -1 })
          .session(session);
          
          if (companyMatch) {
            companyRepId = companyMatch.rep_id;
          }
        }
        
        // Step 1: Get all active reps for this queue with their weights and scores
        const reps = await Rep.find({ queue, active: true })
          .sort({ _id: 1 })
          .session(session)
          .lean();
        
        if (reps.length === 0) {
          throw new Error(`No active reps found for queue: ${queue}`);
        }
        
        // Get scores for all reps
        const repIds = reps.map(r => r._id);
        const scores = await RepScore.find({
          rep_id: { $in: repIds },
          queue: queue
        })
        .session(session)
        .lean();
        
        // Create a map of scores
        const scoreMap = {};
        scores.forEach(s => {
          scoreMap[s.rep_id.toString()] = s.current_score || 0;
        });
        
        // Step 2: Calculate total active weight
        const totalActiveWeight = reps.reduce((sum, rep) => sum + parseFloat(rep.weight), 0);
        
        if (totalActiveWeight <= 0) {
          throw new Error(`Invalid total weight for queue: ${queue}`);
        }
        
        // Step 3: Update scores: current_score += weight
        const updatedScores = [];
        for (const rep of reps) {
          const currentScore = scoreMap[rep._id.toString()] || 0;
          const newScore = currentScore + parseFloat(rep.weight);
          
          updatedScores.push({
            id: rep._id,
            name: rep.name,
            hubspot_owner_id: rep.hubspot_owner_id,
            weight: parseFloat(rep.weight),
            newScore: newScore
          });
          
          // Update score in database
          await RepScore.findOneAndUpdate(
            { rep_id: rep._id, queue: queue },
            {
              rep_id: rep._id,
              queue: queue,
              current_score: newScore,
              last_updated: new Date()
            },
            { upsert: true, session }
          );
        }
        
        // Step 4: Pick rep with highest score (or use company match if found)
        let selectedRep;
        let isCompanyMatch = false;
        
        if (companyRepId) {
          // Use company match - find the rep
          selectedRep = updatedScores.find(r => r.id.toString() === companyRepId.toString());
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
          
          await RepScore.findOneAndUpdate(
            { rep_id: selectedRep.id, queue: queue },
            {
              current_score: finalScore,
              last_updated: new Date()
            },
            { session }
          );
        }
        
        // Step 6: Create assignment record
        const assignment = new Assignment({
          rep_id: selectedRep.id,
          queue: queue,
          hubspot_contact_id: options.hubspotContactId || null,
          hubspot_deal_id: options.hubspotDealId || null,
          score_at_assignment: isCompanyMatch ? null : selectedRep.newScore,
          weight_at_assignment: selectedRep.weight,
          assigned_by: options.assignedBy || null,
          metadata: options.metadata || null,
          company_name: options.companyName || null,
          company_domain: options.companyDomain || null,
          is_manual: options.isManual || false,
          is_company_match: isCompanyMatch
        });
        
        await assignment.save({ session });
        
        // Step 7: Create audit log
        const auditLog = new AuditLog({
          action: 'ASSIGN_LEAD',
          entity_type: 'assignment',
          entity_id: assignment._id,
          user_id: options.assignedBy || null,
          changes: {
            queue,
            rep_id: selectedRep.id,
            rep_name: selectedRep.name,
            score: selectedRep.newScore,
            weight: selectedRep.weight
          }
        });
        
        await auditLog.save({ session });
        
        // Store assignment data for return
        assignmentData = {
          success: true,
          assignmentId: assignment._id,
          rep: {
            id: selectedRep.id,
            name: selectedRep.name,
            hubspot_owner_id: selectedRep.hubspot_owner_id,
            weight: selectedRep.weight
          },
          queue,
          scoreAtAssignment: isCompanyMatch ? null : selectedRep.newScore,
          assignedAt: assignment.assigned_at,
          hubspotContactId: options.hubspotContactId,
          hubspotDealId: options.hubspotDealId,
          isCompanyMatch,
          isManual: options.isManual || false
        };
      });
      
      // Sync to HubSpot if configured (async, don't block)
      if (options.hubspotContactId || options.hubspotDealId) {
        const { syncAssignmentToHubSpot } = require('../routes/hubspot');
        syncAssignmentToHubSpot(assignmentData, assignmentData.rep).catch(err => {
          console.error('HubSpot sync failed (non-blocking):', err);
        });
      }
      
      return assignmentData;
      
    } catch (error) {
      console.error('Assignment error:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }
  
  /**
   * Get next rep who would receive a lead (without assigning)
   * @param {string} queue - 'SMB' or 'ENT'
   * @returns {Promise<Object>} Next rep info
   */
  async getNextRep(queue) {
    try {
      // Get all active reps with their current scores
      const reps = await Rep.find({ queue, active: true })
        .sort({ _id: 1 })
        .lean();
      
      if (reps.length === 0) {
        return { success: false, message: `No active reps found for queue: ${queue}` };
      }
      
      const repIds = reps.map(r => r._id);
      const scores = await RepScore.find({
        rep_id: { $in: repIds },
        queue: queue
      }).lean();
      
      const scoreMap = {};
      scores.forEach(s => {
        scoreMap[s.rep_id.toString()] = s.current_score || 0;
      });
      
      const totalActiveWeight = reps.reduce((sum, rep) => sum + parseFloat(rep.weight), 0);
      
      // Calculate what scores would be after adding weights
      const projectedScores = reps.map(rep => ({
        id: rep._id,
        name: rep.name,
        hubspot_owner_id: rep.hubspot_owner_id,
        weight: parseFloat(rep.weight),
        current_score: scoreMap[rep._id.toString()] || 0,
        projectedScore: (scoreMap[rep._id.toString()] || 0) + parseFloat(rep.weight)
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
          weight: nextRep.weight,
          currentScore: nextRep.current_score,
          projectedScore: nextRep.projectedScore
        },
        queue,
        totalActiveReps: reps.length,
        totalActiveWeight
      };
      
    } catch (error) {
      console.error('Get next rep error:', error);
      throw error;
    }
  }
  
  /**
   * Get queue statistics
   * @param {string} queue - 'SMB' or 'ENT'
   * @returns {Promise<Object>} Queue stats
   */
  async getQueueStats(queue) {
    try {
      // Get rep stats
      const allReps = await Rep.find({ queue }).lean();
      const activeReps = allReps.filter(r => r.active);
      const inactiveReps = allReps.filter(r => !r.active);
      
      const totalWeight = activeReps.reduce((sum, rep) => sum + parseFloat(rep.weight), 0);
      const avgWeight = activeReps.length > 0 ? totalWeight / activeReps.length : 0;
      
      // Get assignment stats
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const totalAssignments = await Assignment.countDocuments({ queue });
      const assignmentsToday = await Assignment.countDocuments({
        queue,
        assigned_at: { $gte: oneDayAgo }
      });
      const assignmentsWeek = await Assignment.countDocuments({
        queue,
        assigned_at: { $gte: oneWeekAgo }
      });
      
      // Get rep details with scores and assignment counts
      const repIds = allReps.map(r => r._id);
      const scores = await RepScore.find({
        rep_id: { $in: repIds },
        queue: queue
      }).lean();
      
      const scoreMap = {};
      scores.forEach(s => {
        scoreMap[s.rep_id.toString()] = s.current_score || 0;
      });
      
      const assignmentCounts = await Assignment.aggregate([
        { $match: { queue, rep_id: { $in: repIds } } },
        { $group: { _id: '$rep_id', count: { $sum: 1 } } }
      ]);
      
      const assignmentCountMap = {};
      assignmentCounts.forEach(a => {
        assignmentCountMap[a._id.toString()] = a.count;
      });
      
      const repDetails = allReps.map(rep => ({
        id: rep._id,
        name: rep.name,
        weight: parseFloat(rep.weight),
        currentScore: scoreMap[rep._id.toString()] || 0,
        assignmentCount: assignmentCountMap[rep._id.toString()] || 0
      }));
      
      return {
        queue,
        reps: {
          active: activeReps.length,
          inactive: inactiveReps.length,
          totalWeight: totalWeight,
          avgWeight: avgWeight
        },
        assignments: {
          total: totalAssignments,
          today: assignmentsToday,
          week: assignmentsWeek
        },
        repDetails: repDetails.sort((a, b) => a.name.localeCompare(b.name))
      };
      
    } catch (error) {
      console.error('Get queue stats error:', error);
      throw error;
    }
  }
  
  /**
   * Reset scores for a queue (use with caution)
   * @param {string} queue - 'SMB' or 'ENT'
   * @param {string} userId - User performing reset
   */
  async resetQueueScores(queue, userId) {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        await RepScore.updateMany(
          { queue: queue },
          {
            current_score: 0.0,
            last_updated: new Date()
          },
          { session }
        );
        
        const auditLog = new AuditLog({
          action: 'RESET_SCORES',
          entity_type: 'queue',
          user_id: userId,
          changes: { queue }
        });
        
        await auditLog.save({ session });
      });
      
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

module.exports = new WeightedRoundRobin();
