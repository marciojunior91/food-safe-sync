-- ============================================================================
-- DIAGNOSE: Why can't you see team members and why no roles?
-- ============================================================================

-- 1. YOUR USER PROFILE
SELECT 
  '1. YOUR PROFILE' as check_type,
  user_id,
  email,
  display_name,
  organization_id,
  CASE 
    WHEN organization_id IS NULL THEN '❌ NO ORG!'
    ELSE '✅ Has org'
  END as org_status
FROM profiles
WHERE user_id = auth.uid();

-- 2. ALL ORGANIZATIONS
SELECT 
  '2. ALL ORGANIZATIONS' as check_type,
  id as org_id,
  name as org_name,
  created_at
FROM organizations
ORDER BY created_at;

-- 3. ALL TEAM MEMBERS (to see which orgs they belong to)
SELECT 
  '3. TEAM MEMBERS' as check_type,
  id,
  display_name,
  organization_id,
  is_active
FROM team_members
ORDER BY created_at DESC
LIMIT 10;

-- 4. CHECK IF YOUR PROFILE HAS THE SAME ORG AS TEAM MEMBERS
SELECT 
  '4. ORG COMPARISON' as check_type,
  'Your org: ' || COALESCE(p.organization_id::text, 'NULL') as your_org,
  'Team member org: ' || COALESCE(tm.organization_id::text, 'NULL') as tm_org,
  CASE 
    WHEN p.organization_id IS NULL THEN '❌ You have no org_id'
    WHEN tm.organization_id IS NULL THEN '❌ Team member has no org_id'
    WHEN p.organization_id = tm.organization_id THEN '✅ MATCH'
    ELSE '❌ DIFFERENT ORGS'
  END as match_status
FROM profiles p
CROSS JOIN team_members tm
WHERE p.user_id = auth.uid()
  AND tm.id = 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8' -- Replace with actual team member ID
LIMIT 1;

-- 5. YOUR ROLES (from user_roles table)
SELECT 
  '5. YOUR ROLES' as check_type,
  role,
  organization_id
FROM user_roles
WHERE user_id = auth.uid();

-- 6. CHECK IF user_roles table is empty or has RLS blocking
SELECT 
  '6. user_roles TABLE STATUS' as check_type,
  COUNT(*) as total_rows,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ Table is empty or RLS blocking'
    ELSE '✅ Has data'
  END as status
FROM user_roles;

-- ============================================================================
-- RESULTS INTERPRETATION
-- ============================================================================
-- If #1 shows organization_id = NULL → Need to assign you to an org
-- If #2 shows organizations but you're not in one → Need to join org
-- If #3 shows team members in different org → Need to match orgs
-- If #5 shows no roles → Need to add admin role
-- If #6 shows 0 rows → user_roles table might have RLS issues
-- ============================================================================
