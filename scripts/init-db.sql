-- ================================
-- ProWidget Database Initialization
-- ================================
-- This script runs on first database creation

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create default admin user (password: admin123)
-- Note: Change this password immediately in production!
-- Password hash is bcrypt of 'admin123'
INSERT INTO "User" (id, email, "passwordHash", name, role, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'admin@prowidget.com',
    '$2b$10$8KzaNdKIMyOkASORZQILyO8Y5X5B7.2EYC5Z8ZBFn5iIH0z3WXQRW',
    'Admin User',
    'SUPER_ADMIN',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'ProWidget database initialized successfully';
END $$;
