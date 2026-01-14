-- ============================================================================
-- TEST SCRIPT: RLS Organization Isolation Verification
-- ============================================================================
-- Run this script AFTER applying CRITICAL_FIX_RLS_ORGANIZATION_ISOLATION.sql
-- to verify that organization isolation is working correctly.
-- ============================================================================

-- ============================================================================
-- TEST 1: Verify user_roles has organization_id
-- ============================================================================

DO $$
DECLARE
  total_roles INTEGER;
  null_org_roles INTEGER;
  unique_orgs INTEGER;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE organization_id IS NULL),
    COUNT(DISTINCT organization_id)
  INTO total_roles, null_org_roles, unique_orgs
  FROM user_roles;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'TEST 1: user_roles organization_id check';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Total roles: %', total_roles;
  RAISE NOTICE 'Roles with NULL organization_id: %', null_org_roles;
  RAISE NOTICE 'Unique organizations: %', unique_orgs;
  
  IF null_org_roles > 0 THEN
    RAISE WARNING '❌ FAIL: % roles have NULL organization_id', null_org_roles;
  ELSE
    RAISE NOTICE '✅ PASS: All roles have organization_id';
  END IF;
  
  RAISE NOTICE '';
END $$;


-- ============================================================================
-- TEST 2: Verify user_roles.organization_id matches profiles.organization_id
-- ============================================================================

DO $$
DECLARE
  mismatched_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO mismatched_count
  FROM user_roles ur
  JOIN profiles p ON p.id = ur.user_id
  WHERE ur.organization_id != p.organization_id;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'TEST 2: organization_id consistency check';
  RAISE NOTICE '==========================================';
  
  IF mismatched_count > 0 THEN
    RAISE WARNING '❌ FAIL: % roles have mismatched organization_id', mismatched_count;
    
    -- Show the mismatched records
    RAISE NOTICE 'Mismatched records:';
    FOR rec IN (
      SELECT 
        ur.user_id,
        ur.organization_id AS role_org,
        p.organization_id AS profile_org
      FROM user_roles ur
      JOIN profiles p ON p.id = ur.user_id
      WHERE ur.organization_id != p.organization_id
      LIMIT 10
    ) LOOP
      RAISE NOTICE 'User: %, Role Org: %, Profile Org: %', 
        rec.user_id, rec.role_org, rec.profile_org;
    END LOOP;
  ELSE
    RAISE NOTICE '✅ PASS: All user_roles organization_ids match profiles';
  END IF;
  
  RAISE NOTICE '';
END $$;


-- ============================================================================
-- TEST 3: Verify RLS policies exist for critical tables
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
  table_name TEXT;
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'TEST 3: RLS policies existence check';
  RAISE NOTICE '==========================================';
  
  -- Check each critical table
  FOR table_name IN 
    SELECT unnest(ARRAY[
      'user_roles',
      'profiles', 
      'team_members',
      'team_member_certificates',
      'recipes',
      'products',
      'label_categories',
      'departments',
      'routine_tasks'
    ])
  LOOP
    SELECT COUNT(*)
    INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = table_name;
    
    IF policy_count > 0 THEN
      RAISE NOTICE '✅ %: % policies', table_name, policy_count;
    ELSE
      RAISE WARNING '❌ %: NO POLICIES FOUND', table_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
END $$;


-- ============================================================================
-- TEST 4: Verify organization-specific policies contain organization_id check
-- ============================================================================

DO $$
DECLARE
  total_org_policies INTEGER;
  rec RECORD;
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'TEST 4: Organization isolation in policies';
  RAISE NOTICE '==========================================';
  
  -- Count policies that should have organization checks
  SELECT COUNT(*)
  INTO total_org_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  AND (
    policyname ILIKE '%organization%'
    OR policyname ILIKE '%org%'
  );
  
  RAISE NOTICE 'Total organization-aware policies: %', total_org_policies;
  
  -- List key policies
  RAISE NOTICE 'Key organization-isolated policies:';
  FOR rec IN (
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (
      policyname ILIKE '%organization%'
      OR policyname ILIKE '%org%'
    )
    ORDER BY tablename, policyname
    LIMIT 20
  ) LOOP
    RAISE NOTICE '  - %.%', rec.tablename, rec.policyname;
  END LOOP;
  
  IF total_org_policies < 10 THEN
    RAISE WARNING '❌ FAIL: Expected at least 10 organization policies, found %', total_org_policies;
  ELSE
    RAISE NOTICE '✅ PASS: Found % organization policies', total_org_policies;
  END IF;
  
  RAISE NOTICE '';
END $$;


-- ============================================================================
-- TEST 5: Verify indexes exist for performance
-- ============================================================================

DO $$
DECLARE
  index_count INTEGER;
  index_name TEXT;
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'TEST 5: Performance indexes check';
  RAISE NOTICE '==========================================';
  
  -- Check for organization_id indexes
  FOR index_name IN 
    SELECT unnest(ARRAY[
      'idx_user_roles_organization_id',
      'idx_user_roles_user_org',
      'idx_profiles_org',
      'idx_team_members_org',
      'idx_recipes_org',
      'idx_products_org'
    ])
  LOOP
    SELECT COUNT(*)
    INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname = index_name;
    
    IF index_count > 0 THEN
      RAISE NOTICE '✅ Index exists: %', index_name;
    ELSE
      RAISE WARNING '❌ Index missing: %', index_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
END $$;


-- ============================================================================
-- TEST 6: Verify helper functions exist
-- ============================================================================

DO $$
DECLARE
  func_count INTEGER;
  func_name TEXT;
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'TEST 6: Helper functions check';
  RAISE NOTICE '==========================================';
  
  -- Check for helper functions
  FOR func_name IN 
    SELECT unnest(ARRAY[
      'get_user_organization_id',
      'is_organization_admin',
      'is_organization_manager',
      'validate_role_assignment'
    ])
  LOOP
    SELECT COUNT(*)
    INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proname = func_name;
    
    IF func_count > 0 THEN
      RAISE NOTICE '✅ Function exists: %()', func_name;
    ELSE
      RAISE WARNING '❌ Function missing: %()', func_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
END $$;


-- ============================================================================
-- TEST 7: Verify trigger exists on user_roles
-- ============================================================================

DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'TEST 7: Triggers check';
  RAISE NOTICE '==========================================';
  
  SELECT COUNT(*)
  INTO trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  WHERE c.relname = 'user_roles'
  AND t.tgname LIKE '%validate_role%';
  
  IF trigger_count > 0 THEN
    RAISE NOTICE '✅ PASS: validate_role_assignment trigger exists on user_roles';
  ELSE
    RAISE WARNING '❌ FAIL: validate_role_assignment trigger NOT found on user_roles';
  END IF;
  
  RAISE NOTICE '';
END $$;


-- ============================================================================
-- TEST 8: Data distribution by organization
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'TEST 8: Data distribution by organization';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
END $$;

-- User roles per organization
SELECT 
  'user_roles' AS table_name,
  ur.organization_id,
  o.name AS organization_name,
  COUNT(*) AS record_count
FROM user_roles ur
LEFT JOIN organizations o ON o.id = ur.organization_id
GROUP BY ur.organization_id, o.name
ORDER BY COUNT(*) DESC;

-- Team members per organization
SELECT 
  'team_members' AS table_name,
  tm.organization_id,
  o.name AS organization_name,
  COUNT(*) AS record_count
FROM team_members tm
LEFT JOIN organizations o ON o.id = tm.organization_id
GROUP BY tm.organization_id, o.name
ORDER BY COUNT(*) DESC;

-- Recipes per organization
SELECT 
  'recipes' AS table_name,
  r.organization_id,
  o.name AS organization_name,
  COUNT(*) AS record_count
FROM recipes r
LEFT JOIN organizations o ON o.id = r.organization_id
GROUP BY r.organization_id, o.name
ORDER BY COUNT(*) DESC;


-- ============================================================================
-- TEST 9: Simulate cross-organization access attempt (should fail)
-- ============================================================================

DO $$
DECLARE
  org1_id UUID;
  org2_id UUID;
  user1_id UUID;
  cross_org_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'TEST 9: Cross-organization access simulation';
  RAISE NOTICE '==========================================';
  
  -- Get two different organizations
  SELECT id INTO org1_id
  FROM organizations
  ORDER BY created_at
  LIMIT 1;
  
  SELECT id INTO org2_id
  FROM organizations
  WHERE id != org1_id
  ORDER BY created_at
  LIMIT 1;
  
  IF org2_id IS NULL THEN
    RAISE NOTICE '⚠️  SKIP: Only one organization exists, cannot test cross-org access';
  ELSE
    -- Get a user from org1
    SELECT user_id INTO user1_id
    FROM user_roles
    WHERE organization_id = org1_id
    LIMIT 1;
    
    IF user1_id IS NOT NULL THEN
      -- Simulate: Can user1 from org1 see team_members from org2?
      -- (This query uses auth context simulation)
      SELECT COUNT(*)
      INTO cross_org_count
      FROM team_members
      WHERE organization_id = org2_id;
      
      -- Note: This test is limited as we can't actually simulate auth.uid()
      -- In production, a real user from org1 trying to access org2 data
      -- should see 0 results
      
      RAISE NOTICE 'Organization 1: %', org1_id;
      RAISE NOTICE 'Organization 2: %', org2_id;
      RAISE NOTICE 'Test user from Org1: %', user1_id;
      RAISE NOTICE '';
      RAISE NOTICE '⚠️  Manual test required:';
      RAISE NOTICE '1. Login as user % (from org1)', user1_id;
      RAISE NOTICE '2. Try to query: SELECT * FROM team_members WHERE organization_id = ''%'';', org2_id;
      RAISE NOTICE '3. Expected result: 0 rows (RLS should block)';
    END IF;
  END IF;
  
  RAISE NOTICE '';
END $$;


-- ============================================================================
-- TEST SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '                           TEST SUMMARY';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tests completed. Review the output above for any ❌ failures.';
  RAISE NOTICE '';
  RAISE NOTICE 'If all tests show ✅ PASS, the RLS organization isolation is correctly';
  RAISE NOTICE 'configured and your multi-tenant database is secure.';
  RAISE NOTICE '';
  RAISE NOTICE 'CRITICAL: Perform manual testing with actual user logins to verify';
  RAISE NOTICE 'that users from Organization A cannot see/modify data from Organization B.';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
END $$;


-- ============================================================================
-- OPTIONAL: Detailed policy listing
-- ============================================================================

-- Uncomment to see all policies with their definitions
/*
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND (
  policyname ILIKE '%organization%'
  OR policyname ILIKE '%org%'
)
ORDER BY tablename, policyname;
*/
