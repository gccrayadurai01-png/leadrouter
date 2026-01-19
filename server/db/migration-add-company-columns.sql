-- Migration: Add missing columns to assignments table
-- Run this to fix: column "company_name" does not exist error

-- Add missing columns to assignments table
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_domain VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_company_match BOOLEAN NOT NULL DEFAULT false;

-- Add indexes for company matching queries
CREATE INDEX IF NOT EXISTS idx_assignments_company_domain ON assignments(company_domain);
CREATE INDEX IF NOT EXISTS idx_assignments_company_name ON assignments(company_name);
