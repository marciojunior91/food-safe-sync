-- ============================================================================
-- FIX USER ROLES ENUM AND RELATIONSHIPS - PART 2: Update Functions & Data
-- Sprint 2 Module 1 - People & Authentication
-- Date: January 10, 2026
-- ============================================================================
-- 
-- PREREQUISITE: Part 1 must be run and committed FIRST!
-- This uses the 'cook' and 'barista' enum values added in Part 1.
--
-- RELATIONSHIP STRUCTURE:
-- auth.users (Supabase Auth) 
--   ↓ (1:1)
-- profiles (user_id FK → auth.users.id)
--   ↓ (1:1)
-- user_roles (user_id FK → auth.users.id, ONE role per user)
--   ↓ (1:N)
-- team_members (auth_role_id FK → profiles.user_id, multiple team members per auth account)
--
-- ============================================================================

-- STEP 1: Temporarily disable triggers that would block the migration
-- These triggers will be re-enabled at the end
DO $$
BEGIN
  -- Disable role validation trigger (blocks admin role assignments)
  BEGIN
    ALTER TABLE user_roles DISABLE TRIGGER validate_role_assignment_trigger;
    RAISE NOTICE 'Disabled role validation trigger';
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE 'Role validation trigger does not exist, skipping...';
  END;
  
  -- Disable updated_at trigger (user_roles doesn't have updated_at column)
  BEGIN
    ALTER TABLE user_roles DISABLE TRIGGER update_user_roles_updated_at;
    RAISE NOTICE 'Disabled updated_at trigger';
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE 'Updated_at trigger does not exist, skipping...';
  END;
END $$;

-- Step 2: Update role hierarchy function to include new roles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'leader_chef' THEN 3
      WHEN 'cook' THEN 4
      WHEN 'barista' THEN 5
      WHEN 'staff' THEN 6
    END
  LIMIT 1
$$;

COMMENT ON FUNCTION public.get_user_role IS 'Returns highest priority role for user. Hierarchy: admin > manager > leader_chef > cook > barista > staff';

-- Step 3: Ensure all team_member roles can be mapped to user_roles
-- This allows team members with cook/barista roles to have corresponding auth roles
-- NOTE: Each user should have ONLY ONE role (the highest priority role)
COMMENT ON TYPE app_role IS 'Application roles for authentication and authorization. Each user has ONE role. Maps to team_member_role for operational staff.';
COMMENT ON TYPE team_member_role IS 'Operational roles for team members. Can be linked to app_role via user_roles table.';

-- Step 3A: Ensure ONE role per user by adding UNIQUE constraint on user_id
-- First, remove the old UNIQUE constraint on (user_id, role) which allowed multiple roles
DO $$ 
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE user_roles DROP CONSTRAINT user_roles_user_id_role_key;
    RAISE NOTICE 'Dropped old constraint allowing multiple roles per user';
  END IF;
  
  -- Add new constraint: ONE role per user
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_unique'
  ) THEN
    -- First, remove duplicate roles keeping only highest priority
    DELETE FROM user_roles ur1
    WHERE EXISTS (
      SELECT 1 FROM user_roles ur2
      WHERE ur2.user_id = ur1.user_id
        AND ur2.id != ur1.id
        AND (
          CASE ur2.role
            WHEN 'admin' THEN 1
            WHEN 'manager' THEN 2
            WHEN 'leader_chef' THEN 3
            WHEN 'cook' THEN 4
            WHEN 'barista' THEN 5
            WHEN 'staff' THEN 6
          END
        ) < (
          CASE ur1.role
            WHEN 'admin' THEN 1
            WHEN 'manager' THEN 2
            WHEN 'leader_chef' THEN 3
            WHEN 'cook' THEN 4
            WHEN 'barista' THEN 5
            WHEN 'staff' THEN 6
          END
        )
    );
    
    ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
    RAISE NOTICE 'Added constraint: ONE role per user';
  END IF;
END $$;

COMMENT ON CONSTRAINT user_roles_user_id_unique ON user_roles IS 'Ensures each user has exactly ONE role (1:1 relationship)';

-- Step 4: Update helper function to sync team_member role to user_role (UPSERT for 1:1)
CREATE OR REPLACE FUNCTION public.sync_team_member_to_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- When a team_member is created/updated with an auth_role_id,
  -- ensure there's a corresponding user_role entry (UPSERT to maintain 1:1)
  IF NEW.auth_role_id IS NOT NULL THEN
    -- Insert or UPDATE user_role based on team_member role_type (1:1 relationship)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      NEW.auth_role_id,
      NEW.role_type::text::app_role -- Cast team_member_role to app_role
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = EXCLUDED.role,
      created_at = CASE 
        WHEN user_roles.role != EXCLUDED.role THEN now()
        ELSE user_roles.created_at
      END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.sync_team_member_to_user_role IS 'Syncs team_member role_type to user_roles (1:1 relationship). Updates existing role if changed.';

-- Step 5: Create trigger to auto-sync roles
DROP TRIGGER IF EXISTS sync_team_member_role_trigger ON team_members;
CREATE TRIGGER sync_team_member_role_trigger
  AFTER INSERT OR UPDATE OF auth_role_id, role_type
  ON team_members
  FOR EACH ROW
  WHEN (NEW.auth_role_id IS NOT NULL)
  EXECUTE FUNCTION public.sync_team_member_to_user_role();

COMMENT ON TRIGGER sync_team_member_role_trigger ON team_members IS 'Automatically syncs team_member role_type to user_roles table when auth_role_id is set (maintains 1:1 relationship)';

-- Step 6: Backfill existing team_members to user_roles (keeping only highest priority role per user)
-- First, create a temp table with the highest priority role per user
CREATE TEMP TABLE temp_highest_roles AS
SELECT DISTINCT ON (tm.auth_role_id)
  tm.auth_role_id as user_id,
  tm.role_type::text::app_role as role,
  tm.created_at
FROM team_members tm
WHERE tm.auth_role_id IS NOT NULL
ORDER BY 
  tm.auth_role_id,
  CASE tm.role_type
    WHEN 'admin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'leader_chef' THEN 3
    WHEN 'cook' THEN 4
    WHEN 'barista' THEN 5
  END;

-- Now insert/update with only the highest priority role
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT user_id, role, created_at FROM temp_highest_roles
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = EXCLUDED.role,
  created_at = CASE 
    WHEN user_roles.role != EXCLUDED.role THEN now()
    ELSE user_roles.created_at
  END;

DROP TABLE temp_highest_roles;

-- Step 7: Update get_current_user_context to handle all roles correctly
-- Drop existing function first (signature might be different)
DROP FUNCTION IF EXISTS public.get_current_user_context();

CREATE OR REPLACE FUNCTION public.get_current_user_context()
RETURNS TABLE (
  user_id uuid,
  organization_id uuid,
  role text,
  department_id uuid,
  location_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.organization_id,
    -- Get role from user_roles table (highest priority role if multiple)
    COALESCE(
      (
        SELECT ur.role::text
        FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        ORDER BY 
          CASE ur.role
            WHEN 'admin' THEN 1
            WHEN 'manager' THEN 2
            WHEN 'leader_chef' THEN 3
            WHEN 'cook' THEN 4
            WHEN 'barista' THEN 5
            WHEN 'staff' THEN 6
          END
        LIMIT 1
      ),
      'staff' -- Default fallback
    ) as role,
    p.department_id,
    o.location_id
  FROM profiles p
  LEFT JOIN organizations o ON p.organization_id = o.id
  WHERE p.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_current_user_context IS 'Returns current user context with role from user_roles table. Supports all roles: admin, manager, leader_chef, cook, barista, staff';

-- Step 8: Create view for easy role checking (updated for 1:1 relationship)
CREATE OR REPLACE VIEW public.user_roles_summary AS
SELECT 
  p.user_id,
  p.display_name,
  p.email,
  p.organization_id,
  ur.role::text as role,
  COUNT(tm.id) as team_member_count
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
LEFT JOIN team_members tm ON tm.auth_role_id = p.user_id
GROUP BY p.user_id, p.display_name, p.email, p.organization_id, ur.role;

GRANT SELECT ON public.user_roles_summary TO authenticated;

COMMENT ON VIEW public.user_roles_summary IS 'Summary view showing each user with their ONE role (1:1 relationship) and team member linkages';

-- Step 9: Add helpful comments on relationships (updated for 1:1)
COMMENT ON COLUMN profiles.user_id IS 'References auth.users(id). One profile per auth user (1:1).';
COMMENT ON COLUMN user_roles.user_id IS 'References auth.users(id). UNIQUE - Each user has ONE role (1:1).';
COMMENT ON COLUMN team_members.auth_role_id IS 'References profiles.user_id. Multiple team members can share one auth account (N:1).';

-- Step 10: Create validation function to check relationship integrity
CREATE OR REPLACE FUNCTION public.validate_user_relationships()
RETURNS TABLE (
  issue_type text,
  user_id uuid,
  details text
) AS $$
BEGIN
  -- Check for profiles without user_roles
  RETURN QUERY
  SELECT 
    'missing_user_role'::text,
    p.user_id,
    'Profile exists but has no user_roles entry'::text
  FROM profiles p
  WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id);
  
  -- Check for team_members with auth_role_id pointing to non-existent profile
  RETURN QUERY
  SELECT 
    'invalid_auth_role_id'::text,
    tm.auth_role_id,
    format('Team member %s references non-existent profile', tm.display_name)
  FROM team_members tm
  WHERE tm.auth_role_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = tm.auth_role_id);
    
  -- Check for orphaned user_roles
  RETURN QUERY
  SELECT 
    'orphaned_user_role'::text,
    ur.user_id,
    'user_roles entry exists but no profile found'::text
  FROM user_roles ur
  WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = ur.user_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.validate_user_relationships IS 'Validates relationship integrity between auth.users, profiles, user_roles, and team_members';

-- Step 11: Run validation and log results
DO $$
DECLARE
  issue_record RECORD;
  issue_count INT := 0;
BEGIN
  RAISE NOTICE 'Running relationship validation...';
  
  FOR issue_record IN SELECT * FROM public.validate_user_relationships() LOOP
    issue_count := issue_count + 1;
    RAISE NOTICE 'Issue found - Type: %, User: %, Details: %', 
      issue_record.issue_type, 
      issue_record.user_id, 
      issue_record.details;
  END LOOP;
  
  IF issue_count = 0 THEN
    RAISE NOTICE '✓ All relationships are valid!';
  ELSE
    RAISE NOTICE '⚠ Found % relationship issues', issue_count;
  END IF;
END $$;

-- Step 12: Re-enable all triggers
DO $$
BEGIN
  -- Re-enable role validation trigger
  BEGIN
    ALTER TABLE user_roles ENABLE TRIGGER validate_role_assignment_trigger;
    RAISE NOTICE 'Re-enabled role validation trigger';
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE 'Role validation trigger does not exist, skipping...';
  END;
  
  -- Re-enable updated_at trigger
  BEGIN
    ALTER TABLE user_roles ENABLE TRIGGER update_user_roles_updated_at;
    RAISE NOTICE 'Re-enabled updated_at trigger';
  EXCEPTION
    WHEN undefined_object THEN
      RAISE NOTICE 'Updated_at trigger does not exist, skipping...';
  END;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This migration (Part 2):
-- 1. ✅ Temporarily disabled triggers (role validation + updated_at)
-- 2. ✅ Updated role hierarchy to include all 6 roles (uses cook & barista from Part 1)
-- 3. ✅ Enforced 1:1 relationship: ONE role per user (UNIQUE constraint)
-- 4. ✅ Created auto-sync trigger for team_members → user_roles (UPSERT)
-- 5. ✅ Backfilled existing team_members into user_roles (keeping highest priority role)
-- 6. ✅ Updated get_current_user_context for all roles
-- 7. ✅ Created user_roles_summary view (updated for 1:1)
-- 8. ✅ Added relationship documentation (1:1 enforced)
-- 9. ✅ Created validation function to check integrity
-- 10. ✅ Validated existing relationships
-- 11. ✅ Re-enabled all triggers
--
-- RELATIONSHIP STRUCTURE (FINAL):
-- auth.users
--   ↓ (1:1)
-- profiles (user_id → auth.users.id)
--   ↓ (1:1) ⚠️ UNIQUE CONSTRAINT
-- user_roles (user_id → auth.users.id, ONE role per user)
--   ↓ (1:N)
-- team_members (auth_role_id → profiles.user_id, multiple team members per auth account)
-- ============================================================================
