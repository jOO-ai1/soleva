-- Database initialization script for local development
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist (this is handled by POSTGRES_DB env var)
-- But we can add any additional setup here

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create any additional users or permissions if needed
-- (The main user is created by POSTGRES_USER env var)

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Soleva Store database initialized successfully!';
END $$;
