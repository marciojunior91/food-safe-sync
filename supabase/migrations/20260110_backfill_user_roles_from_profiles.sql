-- ============================================================================
-- BACKFILL USER_ROLES FROM PROFILES
-- Sprint 2 Module 1 - People & Authentication
-- Date: January 10, 2026
-- ============================================================================
-- 
-- PROBLEM: The Part 2 migration tried to backfill from team_members.auth_role_id
-- but that column is NULL for existing users.
-- 
-- SOLUTION: Create user_roles entries directly from profiles with default 'staff' role,
-- then let admins update roles as needed.
--
-- ============================================================================

DO $$
DECLARE
  profiles_count INT;
  user_roles_count INT;
  missing_count INT;
  inserted_count INT;
BEGIN
  -- Get current counts
  SELECT COUNT(*) INTO profiles_count FROM profiles;
  SELECT COUNT(*) INTO user_roles_count FROM user_roles;
  missing_count := profiles_count - user_roles_count;
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'BACKFILL USER_ROLES - Starting...';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Total profiles: %', profiles_count;
  RAISE NOTICE 'Existing user_roles: %', user_roles_count;
  RAISE NOTICE 'Missing user_roles: %', missing_count;
  RAISE NOTICE '';
  
  IF missing_count = 0 THEN
    RAISE NOTICE '✓ All profiles already have user_roles entries!';
    RETURN;
  END IF;
  
  -- Temporarily disable triggers
  BEGIN
    ALTER TABLE user_roles DISABLE TRIGGER ALL;
    RAISE NOTICE '✓ Disabled all triggers on user_roles';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠ Could not disable triggers: %', SQLERRM;
  END;
  
  -- Insert missing user_roles with 'staff' as default role
  -- Admins can update roles later through the UI
  INSERT INTO user_roles (user_id, role, created_at)
  SELECT 
    p.user_id,
    'staff'::app_role as role,  -- Default role for all new entries
    p.created_at
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  
  -- Re-enable triggers
  BEGIN
    ALTER TABLE user_roles ENABLE TRIGGER ALL;
    RAISE NOTICE '✓ Re-enabled all triggers on user_roles';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠ Could not re-enable triggers: %', SQLERRM;
  END;
  
  -- Get final count
  SELECT COUNT(*) INTO user_roles_count FROM user_roles;
  
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'BACKFILL COMPLETE';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✓ Inserted % new user_roles entries', inserted_count;
  RAISE NOTICE '✓ Total user_roles now: %', user_roles_count;
  RAISE NOTICE '✓ All profiles now have user_roles entries: %', 
    CASE WHEN user_roles_count = profiles_count THEN 'YES' ELSE 'NO' END;
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Review new user_roles entries (all set to "staff" by default)';
  RAISE NOTICE '2. Update roles as needed through the People module UI';
  RAISE NOTICE '3. Verify: SELECT COUNT(*) FROM user_roles; should equal SELECT COUNT(*) FROM profiles;';
END $$;

-- Verification query
SELECT 
  'Verification' as check_type,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM user_roles) as total_user_roles,
  CASE 
    WHEN (SELECT COUNT(*) FROM profiles) = (SELECT COUNT(*) FROM user_roles) 
    THEN '✓ MATCH' 
    ELSE '✗ MISMATCH' 
  END as status;

-- Show newly created entries (default 'staff' role)
SELECT 
  p.display_name,
  p.email,
  ur.role::text as role,
  ur.created_at as role_assigned_at
FROM profiles p
JOIN user_roles ur ON p.user_id = ur.user_id
WHERE ur.role = 'staff'
ORDER BY p.display_name;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This migration:
-- 1. ✅ Identifies profiles missing user_roles entries
-- 2. ✅ Creates user_roles entries with 'staff' as default role
-- 3. ✅ Maintains 1:1 relationship (UNIQUE constraint)
-- 4. ✅ Provides verification queries
--
-- NOTE: All new entries are set to 'staff' role by default.
-- Admins should update roles through the People module UI as needed.
-- ============================================================================
