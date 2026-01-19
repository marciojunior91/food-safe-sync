-- =====================================================
-- DEBUG: Why is the join failing?
-- =====================================================

-- STEP 1: Show the existing user_role
SELECT 
  'Existing user_role' as check_type,
  ur.user_id,
  ur.organization_id,
  ur.role,
  au.email
FROM user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d';

-- STEP 2: Show team_members in your org
SELECT 
  'Team members in org' as check_type,
  tm.id,
  tm.display_name,
  tm.organization_id,
  tm.role_type
FROM team_members tm
WHERE tm.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57';

-- STEP 3: Check if organization_ids match
SELECT 
  'Organization ID Match' as check_type,
  ur.organization_id as user_role_org_id,
  'b818500f-27f7-47c3-b62a-7d76d5505d57' as expected_org_id,
  CASE 
    WHEN ur.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57' 
    THEN '✅ MATCH' 
    ELSE '❌ MISMATCH - THIS IS THE PROBLEM!' 
  END as result
FROM user_roles ur
WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d';

-- STEP 4: Show ALL user_roles (to see if there are multiples)
SELECT 
  'All user_roles' as check_type,
  ur.user_id,
  ur.organization_id,
  o.name as org_name,
  ur.role
FROM user_roles ur
LEFT JOIN organizations o ON o.id = ur.organization_id
ORDER BY ur.created_at DESC;

-- =====================================================
-- If organization_id is wrong, fix it:
-- =====================================================

-- Uncomment and run this if Step 3 shows MISMATCH:
/*
UPDATE user_roles
SET organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
WHERE user_id = 'cd9af250-133d-409e-9e97-f570f767648d';

-- Verify fix:
SELECT 
  'After Fix' as status,
  ur.user_id,
  ur.organization_id,
  ur.role,
  '✅ Should work now!' as note
FROM user_roles ur
WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d';
*/

-- =====================================================
-- Re-test the policy logic after fix:
-- =====================================================

/*
SELECT 
  'Policy Check After Fix' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d'
    ) THEN '✅ SHOULD WORK NOW!'
    ELSE '❌ Still failing'
  END as result;
*/
