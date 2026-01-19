-- =====================================================
-- FIX: Correct BOTH the INSERT and SELECT policies
-- =====================================================

-- Problem: The SELECT policy is comparing team_members.id with auth.uid()
-- This is wrong because they're different types of UUIDs!
-- team_members.id = team member UUID
-- auth.uid() = authentication user UUID

-- Drop the broken SELECT policy
DROP POLICY IF EXISTS "Users can view posts in their organization" ON feed_posts;

-- Create the CORRECT SELECT policy
CREATE POLICY "Users can view posts in their organization"
  ON feed_posts
  FOR SELECT
  TO public
  USING (
    -- Users can see posts in organizations where they have a user_role
    organization_id IN (
      SELECT ur.organization_id
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
    )
  );

-- Now fix the INSERT policy (it still has feed_posts.author_id reference)
DROP POLICY IF EXISTS "Users can create posts as team members in their org" ON feed_posts;

CREATE POLICY "Users can create posts as team members in their org"
  ON feed_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check 1: The author_id must be a team member in an org where the user has a role
    author_id IN (
      SELECT tm.id 
      FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
    AND
    -- Check 2: The organization_id matches the author's organization
    organization_id IN (
      SELECT tm.organization_id 
      FROM team_members tm
      WHERE tm.id = author_id  -- This references the NEW value being inserted
    )
  );

-- Verify both policies are correct now
SELECT 
  'Fixed Policies' as status,
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%view%' AND qual NOT LIKE '%team_members.id = auth.uid()%' 
      THEN '✅ SELECT policy fixed'
    WHEN policyname LIKE '%create%' AND with_check NOT LIKE '%feed_posts.author_id%' 
      THEN '✅ INSERT policy fixed'
    ELSE 'Check manually'
  END as check_result
FROM pg_policies
WHERE tablename = 'feed_posts'
  AND cmd IN ('SELECT', 'INSERT')
ORDER BY cmd;

-- Test the logic manually
SELECT 
  'Manual Test' as test,
  -- Test SELECT: Can user see posts in their org?
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d'
        AND ur.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
    ) THEN '✅ Can SELECT posts'
    ELSE '❌ Cannot SELECT posts'
  END as select_check,
  -- Test INSERT: Can user insert as manager marcio?
  CASE 
    WHEN 'a1f7fde9-260d-4507-925a-1aabf787abcf' IN (
      SELECT tm.id 
      FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d'
    ) THEN '✅ Can INSERT as manager marcio'
    ELSE '❌ Cannot INSERT as manager marcio'
  END as insert_check;
