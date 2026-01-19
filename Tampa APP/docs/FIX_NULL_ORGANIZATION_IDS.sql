-- =====================================================
-- FIX: Update NULL organization_ids in user_roles
-- =====================================================

-- STEP 1: Show the problem - user_roles with NULL organization_id
SELECT 
  'BEFORE FIX' as status,
  ur.user_id,
  au.email,
  ur.organization_id,
  ur.role,
  '❌ NULL organization_id!' as problem
FROM user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
WHERE ur.organization_id IS NULL;

-- STEP 2: Find the correct organization_id for each user
-- This matches user_roles to their team_members' organization
SELECT 
  'Preview Fix' as status,
  ur.user_id,
  au.email,
  tm.organization_id as correct_org_id,
  o.name as org_name,
  ur.role,
  'Will update to this org ⬆️' as note
FROM user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
LEFT JOIN team_members tm ON tm.created_by = ur.user_id
LEFT JOIN organizations o ON o.id = tm.organization_id
WHERE ur.organization_id IS NULL
  AND tm.organization_id IS NOT NULL
GROUP BY ur.user_id, au.email, tm.organization_id, o.name, ur.role;

-- STEP 3: Apply the fix
-- This updates user_roles.organization_id based on the team_members they created
UPDATE user_roles ur
SET organization_id = tm.organization_id
FROM team_members tm
WHERE ur.user_id = tm.created_by
  AND ur.organization_id IS NULL
  AND tm.organization_id IS NOT NULL;

-- STEP 4: Verify the fix
SELECT 
  'AFTER FIX' as status,
  ur.user_id,
  au.email,
  ur.organization_id,
  o.name as org_name,
  ur.role,
  '✅ Fixed!' as result
FROM user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
LEFT JOIN organizations o ON o.id = ur.organization_id
WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d';

-- STEP 5: Re-test the policy logic
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

-- =====================================================
-- ALTERNATIVE: Manual fix if automatic doesn't work
-- =====================================================

/*
-- If the automatic UPDATE doesn't work, do it manually:
UPDATE user_roles
SET organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
WHERE user_id = 'cd9af250-133d-409e-9e97-f570f767648d';
*/

-- =====================================================
-- BONUS: Prevent this from happening again
-- =====================================================

-- After testing, you may want to add a NOT NULL constraint:
/*
ALTER TABLE user_roles 
ALTER COLUMN organization_id SET NOT NULL;
*/
