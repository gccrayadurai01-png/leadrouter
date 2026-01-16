/**
 * Example usage of Lead Round Robin System
 * Demonstrates how to use the conversation-based lead assignment
 */

const LeadRoundRobinService = require('./lead-round-robin-service');

// Create a new service instance
const service = new LeadRoundRobinService();

// Register sales reps
service.registerRep('rep1', { name: 'John Doe', email: 'john@example.com' });
service.registerRep('rep2', { name: 'Jane Smith', email: 'jane@example.com' });
service.registerRep('rep3', { name: 'Bob Johnson', email: 'bob@example.com' });

// Register leads
service.registerLead('lead1', { name: 'Acme Corp', email: 'contact@acme.com' });
service.registerLead('lead2', { name: 'TechStart Inc', email: 'hello@techstart.com' });
service.registerLead('lead3', { name: 'Global Solutions', email: 'info@globalsolutions.com' });

console.log('=== Lead Round Robin System Demo ===\n');

// Scenario 1: Record some conversations first
console.log('1. Recording conversations...');
service.recordConversation('lead1', 'rep1', { type: 'phone', duration: 15 });
service.recordConversation('lead1', 'rep2', { type: 'email', duration: 5 });
service.recordConversation('lead2', 'rep1', { type: 'meeting', duration: 30 });

console.log('   - Lead1 had conversations with Rep1 and Rep2');
console.log('   - Lead2 had a conversation with Rep1\n');

// Scenario 2: Assign leads (should prioritize reps with conversation history)
console.log('2. Assigning leads...\n');

const assignment1 = service.assignLead('lead1');
console.log(`   Lead1 assigned to: ${assignment1.rep.name} (${assignment1.assignedRepId})`);
console.log(`   Had previous conversation: ${assignment1.hadPreviousConversation}\n`);

const assignment2 = service.assignLead('lead2');
console.log(`   Lead2 assigned to: ${assignment2.rep.name} (${assignment2.assignedRepId})`);
console.log(`   Had previous conversation: ${assignment2.hadPreviousConversation}\n`);

const assignment3 = service.assignLead('lead3');
console.log(`   Lead3 assigned to: ${assignment3.rep.name} (${assignment3.assignedRepId})`);
console.log(`   Had previous conversation: ${assignment3.hadPreviousConversation}\n`);

// Scenario 3: Check conversation history
console.log('3. Conversation history for Lead1:');
const lead1Conversations = service.getLeadConversationReps('lead1');
lead1Conversations.forEach(rep => {
  console.log(`   - ${rep.name} (${rep.id})`);
});
console.log();

// Scenario 4: View statistics
console.log('4. Assignment Statistics:');
const stats = service.getStats();
console.log(`   Total Leads: ${stats.totalLeads}`);
console.log(`   Total Reps: ${stats.totalReps}`);
console.log(`   Active Reps: ${stats.activeReps}`);
console.log(`   Total Assignments: ${stats.totalAssignments}`);
console.log(`   Rep Assignment Counts:`, stats.repCounts);
console.log();

// Scenario 5: Multiple assignments to demonstrate round robin
console.log('5. Round robin demonstration (assigning lead3 multiple times):');
for (let i = 0; i < 5; i++) {
  const assignment = service.assignLead('lead3');
  console.log(`   Assignment ${i + 1}: ${assignment.rep.name}`);
}
console.log();

// Scenario 6: Assign lead with conversation history (should get rep with history)
console.log('6. Re-assigning Lead1 (has conversation history with Rep1 and Rep2):');
const reassignment = service.assignLead('lead1');
console.log(`   Assigned to: ${reassignment.rep.name}`);
console.log(`   This rep had previous conversation: ${reassignment.hadPreviousConversation}`);

