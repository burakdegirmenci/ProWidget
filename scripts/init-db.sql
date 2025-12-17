-- ================================
-- ProWidget Database Initialization
-- ================================
-- This script runs on first database creation
-- Note: Tables are created by Prisma migrations

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'ProWidget database extensions initialized successfully';
END $$;
