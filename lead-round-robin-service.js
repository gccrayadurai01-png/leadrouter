/**
 * Lead Round Robin Service
 * Higher-level service that manages leads, reps, and assignments
 */

const LeadRoundRobin = require('./lead-round-robin');

class LeadRoundRobinService {
  constructor() {
    this.roundRobin = new LeadRoundRobin();
    this.leads = new Map(); // { leadId: { id, name, email, ... } }
    this.reps = new Map(); // { repId: { id, name, email, isActive, ... } }
  }

  /**
   * Register a sales rep
   * @param {string} repId - Unique rep identifier
   * @param {Object} repData - Rep information
   */
  registerRep(repId, repData) {
    this.reps.set(repId, {
      id: repId,
      isActive: true,
      ...repData
    });
  }

  /**
   * Register a lead
   * @param {string} leadId - Unique lead identifier
   * @param {Object} leadData - Lead information
   */
  registerLead(leadId, leadData) {
    this.leads.set(leadId, {
      id: leadId,
      ...leadData
    });
  }

  /**
   * Record a conversation between a lead and rep
   * @param {string} leadId - The lead ID
   * @param {string} repId - The rep ID
   * @param {Object} conversationData - Optional conversation metadata
   */
  recordConversation(leadId, repId, conversationData = {}) {
    // Validate that lead and rep exist
    if (!this.leads.has(leadId)) {
      throw new Error(`Lead ${leadId} not found`);
    }
    if (!this.reps.has(repId)) {
      throw new Error(`Rep ${repId} not found`);
    }

    this.roundRobin.recordConversation(leadId, repId);
    
    // You could store additional conversation data here
    return {
      leadId,
      repId,
      timestamp: new Date().toISOString(),
      ...conversationData
    };
  }

  /**
   * Assign a lead to a rep
   * @param {string} leadId - The lead to assign
   * @param {Object} options - Assignment options
   * @returns {Object} Assignment result
   */
  assignLead(leadId, options = {}) {
    if (!this.leads.has(leadId)) {
      throw new Error(`Lead ${leadId} not found`);
    }

    // Get available reps (filter by active status if needed)
    let availableReps = Array.from(this.reps.values())
      .filter(rep => rep.isActive !== false)
      .map(rep => rep.id);

    // Filter by custom criteria if provided
    if (options.filterReps) {
      availableReps = availableReps.filter(options.filterReps);
    }

    if (availableReps.length === 0) {
      return {
        success: false,
        leadId,
        error: 'No available reps found'
      };
    }

    const assignedRepId = this.roundRobin.assignLead(leadId, availableReps);

    if (!assignedRepId) {
      return {
        success: false,
        leadId,
        error: 'Failed to assign lead'
      };
    }

    const lead = this.leads.get(leadId);
    const rep = this.reps.get(assignedRepId);

    return {
      success: true,
      leadId,
      assignedRepId,
      lead,
      rep,
      hadPreviousConversation: this.roundRobin.getConversationReps(leadId).includes(assignedRepId),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get all reps who have had conversations with a lead
   * @param {string} leadId - The lead ID
   * @returns {Array} Array of rep objects
   */
  getLeadConversationReps(leadId) {
    const repIds = this.roundRobin.getConversationReps(leadId);
    return repIds
      .map(repId => this.reps.get(repId))
      .filter(rep => rep !== undefined);
  }

  /**
   * Get assignment statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.roundRobin.getStats(),
      totalLeads: this.leads.size,
      totalReps: this.reps.size,
      activeReps: Array.from(this.reps.values()).filter(rep => rep.isActive !== false).length
    };
  }

  /**
   * Get all leads
   * @returns {Array} Array of lead objects
   */
  getAllLeads() {
    return Array.from(this.leads.values());
  }

  /**
   * Get all reps
   * @returns {Array} Array of rep objects
   */
  getAllReps() {
    return Array.from(this.reps.values());
  }
}

module.exports = LeadRoundRobinService;

