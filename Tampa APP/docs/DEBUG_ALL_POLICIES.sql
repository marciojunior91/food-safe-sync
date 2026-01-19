-- =====================================================
-- DEBUG: Check ALL policies that might block INSERT
-- =====================================================

-- STEP 1: Show ALL policies on feed_posts (not just INSERT)
SELECT 
  'All Policies' as check,
  policyname,
  cmd,
  permissive,
  roles,
  CASE 
    WHEN cmd = 'ALL' THEN '⚠️ Applies to INSERT too!'
    WHEN cmd = 'INSERT' THEN '⚠️ Direct INSERT policy'
    ELSE 'Not relevant'
  END as relevance,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'feed_posts'
ORDER BY 
  CASE 
    WHEN cmd = 'INSERT' THEN 1
    WHEN cmd = 'ALL' THEN 2
    ELSE 3
  END;

-- STEP 2: Check if there's a restrictive SELECT policy
-- (SELECT policies can block INSERT if the user can't see the row they're creating)
SELECT 
  'SELECT Policies' as check,
  policyname,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'feed_posts'
  AND cmd IN ('SELECT', 'ALL');

-- STEP 3: Try to simulate an actual INSERT as the authenticated user
-- This will tell us EXACTLY why it's failing
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'cd9af250-133d-409e-9e97-f570f767648d';

-- Try to insert (will fail, but error message will be helpful)
/*
INSERT INTO feed_posts (
  organization_id,
  author_id,
  content,
  content_type
) VALUES (
  'b818500f-27f7-47c3-b62a-7d76d5505d57',
  'a1f7fde9-260d-4507-925a-1aabf787abcf',  -- manager marcio
  'Test post',
  'announcement'
);
*/

-- Reset role
RESET ROLE;

-- STEP 4: Check if auth.uid() is working in policies
-- This might return NULL in SQL Editor context
SELECT 
  'Auth UID Test' as test,
  auth.uid() as current_auth_uid,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ auth.uid() is NULL - this is the problem!'
    ELSE '✅ auth.uid() is working'
  END as status;

-- STEP 5: Verify the policy was actually recreated
SELECT 
  'Policy Check' as test,
  COUNT(*) as insert_policy_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ No INSERT policy!'
    WHEN COUNT(*) = 1 THEN '✅ One INSERT policy'
    ELSE '⚠️ Multiple INSERT policies (might conflict)'
  END as status
FROM pg_policies
WHERE tablename = 'feed_posts'
  AND cmd = 'INSERT';

-- STEP 6: Show the actual WITH CHECK clause that's being used
SELECT 
  'Current WITH CHECK' as info,
  policyname,
  with_check
FROM pg_policies
WHERE tablename = 'feed_posts'
  AND cmd = 'INSERT';
