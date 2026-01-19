-- LeadRouter Database Schema
-- Production-grade schema for weighted round robin lead assignment

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing functions if they exist (for clean reinstall)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS initialize_rep_score() CASCADE;
DROP FUNCTION IF EXISTS handle_queue_change() CASCADE;

-- Reps table: Sales representatives
CREATE TABLE IF NOT EXISTS reps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hubspot_owner_id VARCHAR(255) UNIQUE,
    queue VARCHAR(10) NOT NULL CHECK (queue IN ('SMB', 'ENT')),
    weight DECIMAL(5,2) NOT NULL DEFAULT 1.0 CHECK (weight > 0),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Rep scores: Current weighted scores for round robin
CREATE TABLE IF NOT EXISTS rep_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
    queue VARCHAR(10) NOT NULL CHECK (queue IN ('SMB', 'ENT')),
    current_score DECIMAL(10,4) NOT NULL DEFAULT 0.0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rep_id, queue)
);

-- Assignments: Lead assignment history
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE RESTRICT,
    queue VARCHAR(10) NOT NULL CHECK (queue IN ('SMB', 'ENT')),
    hubspot_contact_id VARCHAR(255),
    hubspot_deal_id VARCHAR(255),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID,
    score_at_assignment DECIMAL(10,4),
    weight_at_assignment DECIMAL(5,2),
    metadata JSONB,
    company_name VARCHAR(255),
    company_domain VARCHAR(255),
    is_manual BOOLEAN NOT NULL DEFAULT false,
    is_company_match BOOLEAN NOT NULL DEFAULT false
);

-- Audit logs: All system changes
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    user_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users: Authentication and authorization
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'bdr')),
    name VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- HubSpot sync: Track sync status
CREATE TABLE IF NOT EXISTS hubspot_sync (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    hubspot_account_id VARCHAR(255) UNIQUE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reps_queue_active ON reps(queue, active);
CREATE INDEX IF NOT EXISTS idx_reps_hubspot_owner_id ON reps(hubspot_owner_id);
CREATE INDEX IF NOT EXISTS idx_rep_scores_queue_score ON rep_scores(queue, current_score DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_rep_id ON assignments(rep_id);
CREATE INDEX IF NOT EXISTS idx_assignments_queue ON assignments(queue);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_at ON assignments(assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_company_domain ON assignments(company_domain);
CREATE INDEX IF NOT EXISTS idx_assignments_company_name ON assignments(company_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_reps_updated_at ON reps;
CREATE TRIGGER update_reps_updated_at BEFORE UPDATE ON reps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hubspot_sync_updated_at ON hubspot_sync;
CREATE TRIGGER update_hubspot_sync_updated_at BEFORE UPDATE ON hubspot_sync
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize rep scores when rep is created
CREATE OR REPLACE FUNCTION initialize_rep_score()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO rep_scores (rep_id, queue, current_score)
    VALUES (NEW.id, NEW.queue, 0.0)
    ON CONFLICT (rep_id, queue) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS initialize_rep_score_trigger ON reps;
CREATE TRIGGER initialize_rep_score_trigger AFTER INSERT ON reps
    FOR EACH ROW EXECUTE FUNCTION initialize_rep_score();

-- Function to handle queue changes
CREATE OR REPLACE FUNCTION handle_queue_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.queue IS DISTINCT FROM NEW.queue THEN
        -- Reset score for old queue
        UPDATE rep_scores SET current_score = 0.0 
        WHERE rep_id = NEW.id AND queue = OLD.queue;
        
        -- Initialize score for new queue
        INSERT INTO rep_scores (rep_id, queue, current_score)
        VALUES (NEW.id, NEW.queue, 0.0)
        ON CONFLICT (rep_id, queue) DO UPDATE SET current_score = 0.0;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS handle_queue_change_trigger ON reps;
CREATE TRIGGER handle_queue_change_trigger AFTER UPDATE ON reps
    FOR EACH ROW EXECUTE FUNCTION handle_queue_change();

