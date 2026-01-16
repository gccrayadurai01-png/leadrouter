/**
 * Lead Round Robin System
 * Assigns leads to sales reps based on conversation history
 * Prioritizes reps who have had previous conversations with the lead
 */

class LeadRoundRobin {
  constructor() {
    // Track assignment order for round robin
    this.assignmentOrder = [];
    this.currentIndex = 0;
    
    // Store conversation history: { leadId: [repId1, repId2, ...] }
    this.conversationHistory = new Map();
    
    // Store rep assignment counts for balancing
    this.repAssignmentCounts = new Map();
  }

  /**
   * Record a conversation between a lead and a rep
   * @param {string} leadId - The ID of the lead
   * @param {string} repId - The ID of the sales rep
   */
  recordConversation(leadId, repId) {
    if (!this.conversationHistory.has(leadId)) {
      this.conversationHistory.set(leadId, []);
    }
    
    const conversations = this.conversationHistory.get(leadId);
    if (!conversations.includes(repId)) {
      conversations.push(repId);
    }
  }

  /**
   * Get all reps who have had conversations with a lead
   * @param {string} leadId - The ID of the lead
   * @returns {string[]} Array of rep IDs
   */
  getConversationReps(leadId) {
    return this.conversationHistory.get(leadId) || [];
  }

  /**
   * Assign a lead to a rep based on conversation history and round robin
   * @param {string} leadId - The ID of the lead to assign
   * @param {string[]} availableReps - Array of available rep IDs
   * @returns {string|null} The assigned rep ID, or null if no reps available
   */
  assignLead(leadId, availableReps) {
    if (!availableReps || availableReps.length === 0) {
      return null;
    }

    // Get reps who have had conversations with this lead
    const conversationReps = this.getConversationReps(leadId);
    
    // Filter to only include available reps
    const availableConversationReps = conversationReps.filter(repId => 
      availableReps.includes(repId)
    );

    let assignedRep = null;

    // Priority 1: Assign to a rep who has had a conversation with this lead
    if (availableConversationReps.length > 0) {
      // Use round robin among conversation reps
      assignedRep = this.roundRobinFromList(availableConversationReps);
    } else {
      // Priority 2: Round robin from all available reps
      assignedRep = this.roundRobinFromList(availableReps);
    }

    // Update assignment count
    if (assignedRep) {
      this.repAssignmentCounts.set(
        assignedRep, 
        (this.repAssignmentCounts.get(assignedRep) || 0) + 1
      );
    }

    return assignedRep;
  }

  /**
   * Round robin assignment from a list of reps
   * @param {string[]} repList - List of rep IDs to choose from
   * @returns {string} The selected rep ID
   */
  roundRobinFromList(repList) {
    if (repList.length === 0) {
      return null;
    }

    if (repList.length === 1) {
      return repList[0];
    }

    // Find the next rep in round robin order
    // Start from current index and find the next available rep
    let attempts = 0;
    while (attempts < repList.length) {
      const repId = repList[this.currentIndex % repList.length];
      this.currentIndex = (this.currentIndex + 1) % repList.length;
      attempts++;
      
      // Return the rep (we could add additional logic here for balancing)
      return repId;
    }

    // Fallback: return first rep
    return repList[0];
  }

  /**
   * Get assignment statistics
   * @returns {Object} Statistics about assignments
   */
  getStats() {
    return {
      totalAssignments: Array.from(this.repAssignmentCounts.values())
        .reduce((sum, count) => sum + count, 0),
      repCounts: Object.fromEntries(this.repAssignmentCounts),
      conversationHistorySize: this.conversationHistory.size,
      currentIndex: this.currentIndex
    };
  }

  /**
   * Reset assignment counts (useful for testing or periodic resets)
   */
  resetAssignmentCounts() {
    this.repAssignmentCounts.clear();
    this.currentIndex = 0;
  }

  /**
   * Get conversation history for a specific lead
   * @param {string} leadId - The ID of the lead
   * @returns {string[]} Array of rep IDs who have had conversations
   */
  getLeadConversationHistory(leadId) {
    return this.getConversationReps(leadId);
  }
}

module.exports = LeadRoundRobin;

