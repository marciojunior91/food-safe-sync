-- ============================================================================
-- CRITICAL TEST: Can you access the team_member via RLS?
-- ============================================================================

-- Test 1: Show your user info
SELECT 
  '1. YOUR USER' as test,
  auth.uid() as user_id,
  p.organization_id,
  p.display_name
FROM profiles p
WHERE p.user_id = auth.uid();

-- Test 2: Show the team member (WITHOUT RLS check)
SELECT 
  '2. TEAM MEMBER (bypassing RLS)' as test,
  id,
  display_name,
  organization_id,
  is_active
FROM team_members
WHERE id = 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8'; -- Replace with actual ID

-- Test 3: Can you SELECT the team member through RLS?
SELECT 
  '3. CAN ACCESS VIA RLS?' as test,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ YES - RLS allows access'
    ELSE '❌ NO - RLS is blocking! THIS IS THE PROBLEM!'
  END as result
FROM team_members
WHERE id = 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8'; -- Replace with actual ID

-- Test 4: What are the current team_members policies?
SELECT 
  '4. TEAM_MEMBERS POLICIES' as test,
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'team_members'
ORDER BY cmd;

-- Test 5: Your roles
SELECT 
  '5. YOUR ROLES' as test,
  role,
  organization_id
FROM user_roles
WHERE user_id = auth.uid();

-- ============================================================================
-- HYPOTHESIS:
-- ============================================================================
-- When INSERT tries to create a row with team_member_id = 'xxx',
-- PostgreSQL must verify the FK constraint exists.
-- 
-- To do this, it runs: SELECT 1 FROM team_members WHERE id = 'xxx'
-- 
-- But team_members has RLS! If the RLS policy blocks you from seeing
-- that team member, the FK check fails with "violates RLS policy"
-- 
-- Even though you disabled RLS on team_member_certificates,
-- the FK check still queries team_members which HAS RLS enabled!
-- ============================================================================
