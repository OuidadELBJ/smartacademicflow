-- SmartAcademicFlow - Database Initialization
-- This script runs on first container start

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas for logical separation
CREATE SCHEMA IF NOT EXISTS academic;
CREATE SCHEMA IF NOT EXISTS audit;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA academic TO saf_admin;
GRANT ALL PRIVILEGES ON SCHEMA audit TO saf_admin;
