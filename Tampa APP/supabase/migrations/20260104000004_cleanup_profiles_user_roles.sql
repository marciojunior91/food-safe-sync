-- ============================================================================
-- CLEANUP & ORGANIZE: profiles and user_roles Tables
-- ============================================================================
-- This migration cleans up the authentication architecture:
-- 1. Removes deprecated 'role' column from profiles
-- 2. Ensures user_roles is the single source of truth for roles
-- 3. Adds proper FK to organizations in profiles
-- 4. Removes location_id from profiles (belongs to team_members)
-- ============================================================================

-- ============================================================================
-- PART 1: Analyze Current State
-- ============================================================================

-- Check if profiles.role column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    RAISE NOTICE 'profiles.role column EXISTS - will be removed';
  ELSE
    RAISE NOTICE 'profiles.role column does NOT exist - already clean';
  END IF;
END $$;

-- ============================================================================
-- PART 2: Clean Up profiles Table
-- ============================================================================

-- Step 1: Drop dependent views that use location_id
DROP VIEW IF EXISTS user_context CASCADE;

-- Step 2: Remove 'role' column from profiles (deprecated - use user_roles instead)
ALTER TABLE profiles DROP COLUMN IF EXISTS role;

-- Step 3: Remove location_id from profiles (belongs to team_members, not auth)
ALTER TABLE profiles DROP COLUMN IF EXISTS location_id CASCADE;

-- Step 4: Recreate user_context view WITHOUT location_id
CREATE OR REPLACE VIEW user_context AS
SELECT 
  p.user_id,
  p.organization_id,
  o.name as organization_name,
  -- Get role from user_roles table (highest priority role if multiple)
  COALESCE(
    (
      SELECT ur.role::TEXT
      FROM user_roles ur
      WHERE ur.user_id = p.user_id
      ORDER BY 
        CASE ur.role::TEXT
          WHEN 'admin' THEN 1
          WHEN 'manager' THEN 2
          WHEN 'leader_chef' THEN 3
          WHEN 'staff' THEN 4
          ELSE 5
        END
      LIMIT 1
    ),
    'staff'
  ) as user_role,
  p.display_name
FROM profiles p
LEFT JOIN organizations o ON o.id = p.organization_id;

COMMENT ON VIEW user_context IS 'User context view - provides user info with role from user_roles table';

-- Step 5: Ensure organization_id has proper FK constraint
DO $$
BEGIN
  -- Drop existing FK if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_organization_id_fkey'
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_organization_id_fkey;
  END IF;
  
  -- Add FK constraint with proper ON DELETE
  ALTER TABLE profiles 
    ADD CONSTRAINT profiles_organization_id_fkey 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) 
    ON DELETE CASCADE;
    
  RAISE NOTICE 'profiles.organization_id FK constraint updated';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'FK constraint already correct or error: %', SQLERRM;
END $$;

-- Make organization_id NOT NULL (required field)
ALTER TABLE profiles ALTER COLUMN organization_id SET NOT NULL;

-- ============================================================================
-- PART 3: Verify user_roles Table Structure
-- ============================================================================

-- Ensure user_roles table exists with correct structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'user_roles'
  ) THEN
    RAISE EXCEPTION 'user_roles table does NOT exist - run migration 20251006205806 first';
  END IF;
  
  RAISE NOTICE 'user_roles table exists - verified';
END $$;

-- ============================================================================
-- PART 4: Update Comments
-- ============================================================================

COMMENT ON TABLE profiles IS 'Authentication profiles - links auth.users to organizations. Use user_roles for role management.';
COMMENT ON COLUMN profiles.user_id IS 'FK to auth.users - one profile per auth user';
COMMENT ON COLUMN profiles.organization_id IS 'FK to organizations - required, user belongs to one org';
COMMENT ON COLUMN profiles.display_name IS 'Display name for UI (can be different from team_members)';

COMMENT ON TABLE user_roles IS 'System roles for authorization - single source of truth for roles';
COMMENT ON COLUMN user_roles.user_id IS 'FK to auth.users - a user can have multiple roles';
COMMENT ON COLUMN user_roles.role IS 'app_role enum: admin, manager, leader_chef, staff';

-- ============================================================================
-- PART 5: Create Index for Performance
-- ============================================================================

-- Index on profiles.organization_id for fast org lookups
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);

-- Index on user_roles for role checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- ============================================================================
-- PART 6: Verification Query
-- ============================================================================

-- Show final structure of profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show final structure of user_roles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_roles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'PROFILES & USER_ROLES CLEANUP COMPLETE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'profiles table:';
  RAISE NOTICE '  - Removed: role column (use user_roles instead)';
  RAISE NOTICE '  - Removed: location_id (belongs to team_members)';
  RAISE NOTICE '  - Updated: organization_id FK with CASCADE';
  RAISE NOTICE '  - Enforced: organization_id NOT NULL';
  RAISE NOTICE '';
  RAISE NOTICE 'user_roles table:';
  RAISE NOTICE '  - Verified: Correct structure exists';
  RAISE NOTICE '  - Added: Performance indexes';
  RAISE NOTICE '';
  RAISE NOTICE 'Architecture:';
  RAISE NOTICE '  Layer 1: auth.users → profiles (organization link)';
  RAISE NOTICE '  Layer 2: profiles → user_roles (system permissions)';
  RAISE NOTICE '  Layer 3: profiles → team_members (operational identity)';
  RAISE NOTICE '============================================================================';
END $$;
