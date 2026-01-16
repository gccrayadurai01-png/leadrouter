-- SQL script to reset PostgreSQL password
-- Run this in pgAdmin Query Tool

-- Reset postgres user password to 1573
ALTER USER postgres WITH PASSWORD '1573';

-- Verify the change
SELECT usename FROM pg_user WHERE usename = 'postgres';

