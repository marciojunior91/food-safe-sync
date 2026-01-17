-- ============================================================================
-- Diagnose RLS Policy Issue
-- ============================================================================
-- This will help us understand why the INSERT is being blocked
-- ============================================================================

-- 1. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'team_member_certificates';

-- 2. List all current policies
SELECT 
  policyname,
  cmd as operation,
  roles,
  permissive
FROM pg_policies 
WHERE tablename = 'team_member_certificates'
ORDER BY cmd;

-- 3. Check current user's context
SELECT 
  auth.uid() as current_user_id,
  p.organization_id,
  p.display_name,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.user_id
WHERE p.user_id = auth.uid();

-- 4. Check the team member that's being uploaded to
-- Replace 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8' with your actual team_member_id
SELECT 
  tm.id as team_member_id,
  tm.display_name,
  tm.organization_id,
  o.name as organization_name
FROM team_members tm
LEFT JOIN organizations o ON o.id = tm.organization_id
WHERE tm.id = 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8';

-- 5. Check if user and team member are in same organization
SELECT 
  p.user_id,
  p.organization_id as user_org,
  tm.organization_id as team_member_org,
  CASE 
    WHEN p.organization_id = tm.organization_id THEN '✅ MATCH - Should work'
    ELSE '❌ MISMATCH - This is the problem!'
  END as org_check
FROM profiles p
CROSS JOIN team_members tm
WHERE p.user_id = auth.uid()
AND tm.id = 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8';

-- 6. Summary
DO $$ 
BEGIN 
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RLS DIAGNOSTIC COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Check the results above to find the issue:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Is RLS enabled? (should be TRUE)';
  RAISE NOTICE '2. Are there INSERT policies? (should have at least one)';
  RAISE NOTICE '3. Does current user have organization_id?';
  RAISE NOTICE '4. Does team member exist and have organization_id?';
  RAISE NOTICE '5. Do they match? (must be SAME org)';
  RAISE NOTICE '';
  RAISE NOTICE 'If organizations dont match or are NULL, thats the issue!';
END $$;
