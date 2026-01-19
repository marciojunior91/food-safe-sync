-- =====================================================
-- FINAL DIAGNOSTIC: Why is the INSERT still failing?
-- =====================================================

-- STEP 1: Verify user_roles is correct now
SELECT 
  '1. User Roles Check' as step,
  ur.user_id,
  au.email,
  ur.organization_id,
  o.name as org_name,
  ur.role,
  CASE 
    WHEN ur.organization_id IS NOT NULL THEN '✅ Has org_id'
    ELSE '❌ Still NULL'
  END as status
FROM user_roles ur
LEFT JOIN auth.users au ON au.id = ur.user_id
LEFT JOIN organizations o ON o.id = ur.organization_id
WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d';

-- STEP 2: Show team members that this user should be able to post as
SELECT 
  '2. Available Team Members' as step,
  tm.id,
  tm.display_name,
  tm.role_type,
  tm.organization_id,
  ur.user_id as authenticated_user_id,
  CASE 
    WHEN ur.organization_id = tm.organization_id THEN '✅ Org Match'
    ELSE '❌ Org Mismatch'
  END as can_post_as
FROM team_members tm
INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d';

-- STEP 3: Check the exact INSERT policy
SELECT 
  '3. INSERT Policy' as step,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'feed_posts'
  AND cmd = 'INSERT';

-- STEP 4: Simulate the exact INSERT check for Manager Marcio
-- This simulates what happens when you try to create a post
WITH test_insert AS (
  SELECT 
    'Manager Marcio Team Member ID' as description,
    tm.id as author_id,
    tm.organization_id,
    tm.display_name
  FROM team_members tm
  WHERE tm.display_name = 'Manager Marcio'
    AND tm.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
)
SELECT 
  '4. Insert Simulation' as step,
  ti.author_id,
  ti.organization_id,
  ti.display_name,
  -- Check 1: Is author_id in the list of allowed team members?
  CASE 
    WHEN ti.author_id IN (
      SELECT tm.id FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d'
    ) THEN '✅ Author ID allowed'
    ELSE '❌ Author ID NOT allowed'
  END as author_check,
  -- Check 2: Does the organization match?
  CASE 
    WHEN ti.organization_id = (
      SELECT organization_id FROM team_members WHERE id = ti.author_id
    ) THEN '✅ Org matches'
    ELSE '❌ Org mismatch'
  END as org_check
FROM test_insert ti;

-- STEP 5: Check if there are OTHER policies blocking the insert
SELECT 
  '5. All Feed Policies' as step,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'INSERT' THEN '⚠️ Could block insert'
    ELSE 'Not relevant'
  END as relevance
FROM pg_policies
WHERE tablename = 'feed_posts'
ORDER BY cmd, policyname;

-- STEP 6: Check if RLS is actually enabled
SELECT 
  '6. RLS Status' as step,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'feed_posts';

-- =====================================================
-- POTENTIAL FIX: If the policy is too restrictive
-- =====================================================

-- If the diagnostics show the policy is wrong, uncomment and run this:
/*
-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create posts as team members in their org" ON feed_posts;

-- Create a simpler, more permissive INSERT policy for testing
CREATE POLICY "Users can create posts as team members in their org"
  ON feed_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    -- The author must be a team member in an org where the user has a role
    EXISTS (
      SELECT 1 FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
        AND tm.id = feed_posts.author_id
        AND tm.organization_id = feed_posts.organization_id
    )
  );

-- Verify the new policy
SELECT 'New Policy Created' as status;
*/
