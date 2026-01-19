-- =====================================================
-- FIX: Correct the INSERT policy to use NEW row values
-- =====================================================

-- Drop the broken policy
DROP POLICY IF EXISTS "Users can create posts as team members in their org" ON feed_posts;

-- Create the CORRECT policy
-- The key fix: Don't reference feed_posts.author_id in WITH CHECK
-- Instead, let the policy evaluate against the values being inserted
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
      WHERE tm.id = author_id  -- This references the value being inserted, not feed_posts.author_id
    )
  );

-- Verify the new policy
SELECT 
  'New Policy' as status,
  policyname,
  with_check
FROM pg_policies
WHERE tablename = 'feed_posts'
  AND cmd = 'INSERT';

-- =====================================================
-- TEST: Verify it works now
-- =====================================================

-- Test with manager marcio's ID (from your results above)
DO $$
DECLARE
  v_author_id uuid := 'a1f7fde9-260d-4507-925a-1aabf787abcf';  -- manager marcio
  v_org_id uuid := 'b818500f-27f7-47c3-b62a-7d76d5505d57';
  v_user_id uuid := 'cd9af250-133d-409e-9e97-f570f767648d';
BEGIN
  -- Simulate the WITH CHECK clause
  IF (
    v_author_id IN (
      SELECT tm.id 
      FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = v_user_id
    )
    AND
    v_org_id IN (
      SELECT tm.organization_id 
      FROM team_members tm
      WHERE tm.id = v_author_id
    )
  ) THEN
    RAISE NOTICE '✅ Policy check PASSED! Posts should work now!';
  ELSE
    RAISE NOTICE '❌ Policy check still failing';
  END IF;
END $$;
