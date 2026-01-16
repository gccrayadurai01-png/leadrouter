/**
 * Application JavaScript for Lead Round Robin System
 */

// Initialize the service
const roundRobin = new LeadRoundRobin();
let leads = new Map();
let reps = new Map();
let assignments = [];

// Initialize with sample data
function initializeSampleData() {
    // Register sample reps
    registerRep('rep1', 'John Doe', 'john@example.com');
    registerRep('rep2', 'Jane Smith', 'jane@example.com');
    registerRep('rep3', 'Bob Johnson', 'bob@example.com');

    // Register sample leads
    registerLead('lead1', 'Acme Corp', 'contact@acme.com');
    registerLead('lead2', 'TechStart Inc', 'hello@techstart.com');
    registerLead('lead3', 'Global Solutions', 'info@globalsolutions.com');

    // Record some sample conversations
    recordConversation('lead1', 'rep1', 'phone');
    recordConversation('lead1', 'rep2', 'email');
    recordConversation('lead2', 'rep1', 'meeting');

    addLog('System initialized with sample data', 'info');
    updateUI();
}

// Register a sales rep
function registerRep(repId, name, email) {
    if (reps.has(repId)) {
        addLog(`Rep ${repId} already exists`, 'warning');
        return;
    }

    reps.set(repId, {
        id: repId,
        name: name,
        email: email,
        isActive: true
    });

    addLog(`Registered rep: ${name} (${repId})`, 'success');
    updateUI();
}

// Register a lead
function registerLead(leadId, name, email) {
    if (leads.has(leadId)) {
        addLog(`Lead ${leadId} already exists`, 'warning');
        return;
    }

    leads.set(leadId, {
        id: leadId,
        name: name,
        email: email
    });

    addLog(`Registered lead: ${name} (${leadId})`, 'success');
    updateUI();
}

// Record a conversation
function recordConversation(leadId, repId, type = 'phone') {
    if (!leads.has(leadId)) {
        addLog(`Lead ${leadId} not found`, 'warning');
        return;
    }
    if (!reps.has(repId)) {
        addLog(`Rep ${repId} not found`, 'warning');
        return;
    }

    roundRobin.recordConversation(leadId, repId);
    const lead = leads.get(leadId);
    const rep = reps.get(repId);
    
    addLog(`Recorded ${type} conversation: ${lead.name} ↔ ${rep.name}`, 'info');
    updateUI();
}

// Assign a lead
function assignLead(leadId) {
    if (!leads.has(leadId)) {
        addLog(`Lead ${leadId} not found`, 'warning');
        return;
    }

    const availableReps = Array.from(reps.values())
        .filter(rep => rep.isActive !== false)
        .map(rep => rep.id);

    if (availableReps.length === 0) {
        addLog('No available reps found', 'warning');
        return;
    }

    const assignedRepId = roundRobin.assignLead(leadId, availableReps);
    
    if (!assignedRepId) {
        addLog('Failed to assign lead', 'warning');
        return;
    }

    const lead = leads.get(leadId);
    const rep = reps.get(assignedRepId);
    const hadPreviousConversation = roundRobin.getConversationReps(leadId).includes(assignedRepId);

    const assignment = {
        leadId: leadId,
        assignedRepId: assignedRepId,
        lead: lead,
        rep: rep,
        hadPreviousConversation: hadPreviousConversation,
        timestamp: new Date().toISOString()
    };

    assignments.unshift(assignment); // Add to beginning
    if (assignments.length > 10) {
        assignments = assignments.slice(0, 10); // Keep only last 10
    }

    const conversationText = hadPreviousConversation ? ' (had previous conversation)' : '';
    addLog(`Assigned: ${lead.name} → ${rep.name}${conversationText}`, 'success');
    updateUI();
}

// Assign all leads
function assignAllLeads() {
    const unassignedLeads = Array.from(leads.keys()).filter(leadId => {
        return !assignments.some(a => a.leadId === leadId && 
            new Date(a.timestamp) > new Date(Date.now() - 60000)); // Not assigned in last minute
    });

    if (unassignedLeads.length === 0) {
        addLog('All leads are already assigned', 'info');
        return;
    }

    unassignedLeads.forEach(leadId => {
        assignLead(leadId);
    });
}

// UI Update Functions
function updateUI() {
    updateStats();
    updateReps();
    updateLeads();
    updateAssignments();
    updateSelects();
}

function updateStats() {
    const stats = roundRobin.getStats();
    const statsGrid = document.getElementById('statsGrid');
    
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Total Leads</div>
            <div class="stat-value">${leads.size}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Total Reps</div>
            <div class="stat-value">${reps.size}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Total Assignments</div>
            <div class="stat-value">${stats.totalAssignments}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Conversations</div>
            <div class="stat-value">${stats.conversationHistorySize}</div>
        </div>
    `;
}

function updateReps() {
    const repsGrid = document.getElementById('repsGrid');
    
    if (reps.size === 0) {
        repsGrid.innerHTML = '<div class="empty-state">No reps registered yet</div>';
        return;
    }

    const stats = roundRobin.getStats();
    repsGrid.innerHTML = Array.from(reps.values()).map(rep => {
        const assignmentCount = stats.repCounts[rep.id] || 0;
        return `
            <div class="card rep-card">
                <div class="card-header">${rep.name}</div>
                <div><strong>ID:</strong> ${rep.id}</div>
                <div><strong>Email:</strong> ${rep.email}</div>
                <div style="margin-top: 10px;">
                    <strong>Assignments:</strong> <span class="highlight">${assignmentCount}</span>
                </div>
            </div>
        `;
    }).join('');
}

function updateLeads() {
    const leadsGrid = document.getElementById('leadsGrid');
    
    if (leads.size === 0) {
        leadsGrid.innerHTML = '<div class="empty-state">No leads registered yet</div>';
        return;
    }

    leadsGrid.innerHTML = Array.from(leads.values()).map(lead => {
        const conversationReps = roundRobin.getConversationReps(lead.id);
        const conversationRepNames = conversationReps
            .map(repId => reps.get(repId)?.name)
            .filter(Boolean);
        
        return `
            <div class="card lead-card">
                <div class="card-header">${lead.name}</div>
                <div><strong>ID:</strong> ${lead.id}</div>
                <div><strong>Email:</strong> ${lead.email}</div>
                ${conversationRepNames.length > 0 ? `
                    <div class="conversation-badge">
                        Conversations: ${conversationRepNames.join(', ')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function updateAssignments() {
    const assignmentsGrid = document.getElementById('assignmentsGrid');
    
    if (assignments.length === 0) {
        assignmentsGrid.innerHTML = '<div class="empty-state">No assignments yet</div>';
        return;
    }

    assignmentsGrid.innerHTML = assignments.map(assignment => {
        const badge = assignment.hadPreviousConversation 
            ? '<span class="conversation-badge">Previous Conversation</span>'
            : '<span class="conversation-badge" style="background: #6c757d;">New Assignment</span>';
        
        return `
            <div class="card assignment-card">
                <div class="card-header">${assignment.lead.name} → ${assignment.rep.name}</div>
                <div><strong>Lead:</strong> ${assignment.lead.name}</div>
                <div><strong>Assigned to:</strong> ${assignment.rep.name}</div>
                <div style="margin-top: 10px;">${badge}</div>
                <div style="margin-top: 10px; font-size: 0.85em; color: #666;">
                    ${new Date(assignment.timestamp).toLocaleString()}
                </div>
            </div>
        `;
    }).join('');
}

function updateSelects() {
    // Update conversation lead select
    const conversationLeadSelect = document.getElementById('conversationLeadId');
    conversationLeadSelect.innerHTML = '<option value="">Select Lead</option>' +
        Array.from(leads.values()).map(lead => 
            `<option value="${lead.id}">${lead.name} (${lead.id})</option>`
        ).join('');

    // Update conversation rep select
    const conversationRepSelect = document.getElementById('conversationRepId');
    conversationRepSelect.innerHTML = '<option value="">Select Rep</option>' +
        Array.from(reps.values()).map(rep => 
            `<option value="${rep.id}">${rep.name} (${rep.id})</option>`
        ).join('');

    // Update assign lead select
    const assignLeadSelect = document.getElementById('assignLeadId');
    assignLeadSelect.innerHTML = '<option value="">Select Lead</option>' +
        Array.from(leads.values()).map(lead => 
            `<option value="${lead.id}">${lead.name} (${lead.id})</option>`
        ).join('');
}

function addLog(message, type = 'info') {
    const log = document.getElementById('activityLog');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    log.insertBefore(entry, log.firstChild);
    
    // Keep only last 50 entries
    while (log.children.length > 50) {
        log.removeChild(log.lastChild);
    }
}

// Form handlers
window.registerRep = function() {
    const repId = document.getElementById('repId').value.trim();
    const name = document.getElementById('repName').value.trim();
    const email = document.getElementById('repEmail').value.trim();

    if (!repId || !name || !email) {
        addLog('Please fill in all rep fields', 'warning');
        return;
    }

    registerRep(repId, name, email);
    
    // Clear form
    document.getElementById('repId').value = '';
    document.getElementById('repName').value = '';
    document.getElementById('repEmail').value = '';
};

window.registerLead = function() {
    const leadId = document.getElementById('leadId').value.trim();
    const name = document.getElementById('leadName').value.trim();
    const email = document.getElementById('leadEmail').value.trim();

    if (!leadId || !name || !email) {
        addLog('Please fill in all lead fields', 'warning');
        return;
    }

    registerLead(leadId, name, email);
    
    // Clear form
    document.getElementById('leadId').value = '';
    document.getElementById('leadName').value = '';
    document.getElementById('leadEmail').value = '';
};

window.recordConversation = function() {
    const leadId = document.getElementById('conversationLeadId').value;
    const repId = document.getElementById('conversationRepId').value;
    const type = document.getElementById('conversationType').value;

    if (!leadId || !repId) {
        addLog('Please select both lead and rep', 'warning');
        return;
    }

    recordConversation(leadId, repId, type);
};

window.assignLead = function() {
    const leadId = document.getElementById('assignLeadId').value;

    if (!leadId) {
        addLog('Please select a lead to assign', 'warning');
        return;
    }

    assignLead(leadId);
};

window.assignAllLeads = function() {
    assignAllLeads();
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeSampleData();
});

