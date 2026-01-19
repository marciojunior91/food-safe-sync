-- =====================================================
-- COMPLETE DIAGNOSTIC - Feed Posts 403 Error
-- =====================================================
-- Copy this entire script and run in Supabase SQL Editor
-- It will show you exactly what's wrong

-- =====================================================
-- PART 1: Check Current User Context
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=== PART 1: Current User Context ===';
END $$;

SELECT 
  'Your auth.uid()' as info,
  auth.uid() as value
UNION ALL
SELECT 
  'Your database role' as info,
  current_user as value;

-- =====================================================
-- PART 2: Check User Roles
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=== PART 2: User Roles ===';
END $$;

SELECT 
  'user_roles entry' as info,
  COUNT(*)::text as count
FROM user_roles 
WHERE user_id = auth.uid();

SELECT * FROM user_roles WHERE user_id = auth.uid();

-- =====================================================
-- PART 3: Check Team Members in Your Org
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=== PART 3: Team Members ===';
END $$;

SELECT 
  tm.id,
  tm.display_name,
  tm.role_type,
  tm.organization_id,
  'Can be used as author_id' as note
FROM team_members tm
WHERE tm.organization_id IN (
  SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
);

-- =====================================================
-- PART 4: Check Feed Policies
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=== PART 4: Feed RLS Policies ===';
END $$;

SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%team members%' THEN '✅ NEW POLICY'
    ELSE '⚠️ OLD POLICY'
  END as status
FROM pg_policies 
WHERE tablename = 'feed_posts'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- =====================================================
-- PART 5: Test Policy Logic
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=== PART 5: Test Policy Logic ===';
END $$;

-- This query simulates what the policy checks
-- Replace TEAM_MEMBER_ID_HERE with actual team member ID
SELECT 
  'Policy Check Result' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
        AND tm.id = 'TEAM_MEMBER_ID_HERE'  -- ← Replace this!
    ) THEN '✅ WOULD PASS'
    ELSE '❌ WOULD FAIL'
  END as result;

-- =====================================================
-- PART 6: Check RLS Status
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=== PART 6: RLS Enabled? ===';
END $$;

SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'feed_%'
ORDER BY tablename;

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================
/*
PART 1: Should show your auth UUID
PART 2: Should show at least 1 row in user_roles
PART 3: Should show team members (including Manager Marcio)
PART 4: Should show "NEW POLICY" with name "Users can create posts as team members in their org"
PART 5: Should show "WOULD PASS" (after you replace TEAM_MEMBER_ID_HERE)
PART 6: Should show "Enabled" for all feed tables

If ANY of these fail, that's your problem!
*/
