-- =====================================================
-- FIX ALL FEED TABLE RLS POLICIES
-- =====================================================
-- Problem: All feed tables have broken SELECT policies
-- that compare team_members.id with auth.uid()
-- This must be fixed for: feed_reactions, feed_comments,
-- feed_mentions, feed_attachments
-- =====================================================

-- =====================================================
-- 1. FIX FEED_REACTIONS POLICIES
-- =====================================================

-- Drop broken policies
DROP POLICY IF EXISTS "Users can view reactions in their organization" ON feed_reactions;
DROP POLICY IF EXISTS "Users can add reactions as team members" ON feed_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON feed_reactions;

-- Create correct SELECT policy
CREATE POLICY "Users can view reactions in their organization"
  ON feed_reactions
  FOR SELECT
  TO public
  USING (
    -- Users can see reactions in organizations where they have a user_role
    EXISTS (
      SELECT 1 FROM feed_posts fp
      INNER JOIN user_roles ur ON ur.organization_id = fp.organization_id
      WHERE fp.id = feed_reactions.post_id
        AND ur.user_id = auth.uid()
    )
  );

-- Create correct INSERT policy
CREATE POLICY "Users can add reactions as team members"
  ON feed_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- user_id must be a team member in an org where auth user has a role
    user_id IN (
      SELECT tm.id 
      FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
    AND
    -- Post must exist in same organization
    EXISTS (
      SELECT 1 FROM feed_posts fp
      INNER JOIN team_members tm ON tm.id = user_id
      WHERE fp.id = post_id
        AND fp.organization_id = tm.organization_id
    )
  );

-- Create correct DELETE policy
CREATE POLICY "Users can remove their own reactions"
  ON feed_reactions
  FOR DELETE
  TO authenticated
  USING (
    -- Can delete reactions where user_id is a team member they control
    user_id IN (
      SELECT tm.id 
      FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- =====================================================
-- 2. FIX FEED_COMMENTS POLICIES
-- =====================================================

-- Drop broken policies
DROP POLICY IF EXISTS "Users can view comments in their organization" ON feed_comments;
DROP POLICY IF EXISTS "Users can create comments as team members" ON feed_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON feed_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON feed_comments;

-- Create correct SELECT policy
CREATE POLICY "Users can view comments in their organization"
  ON feed_comments
  FOR SELECT
  TO public
  USING (
    -- Users can see comments in organizations where they have a user_role
    EXISTS (
      SELECT 1 FROM feed_posts fp
      INNER JOIN user_roles ur ON ur.organization_id = fp.organization_id
      WHERE fp.id = feed_comments.post_id
        AND ur.user_id = auth.uid()
    )
  );

-- Create correct INSERT policy
CREATE POLICY "Users can create comments as team members"
  ON feed_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- author_id must be a team member in an org where auth user has a role
    author_id IN (
      SELECT tm.id 
      FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
    AND
    -- Post must exist and be in same organization
    EXISTS (
      SELECT 1 FROM feed_posts fp
      INNER JOIN team_members tm ON tm.id = author_id
      WHERE fp.id = post_id
        AND fp.organization_id = tm.organization_id
    )
  );

-- Create correct UPDATE policy
CREATE POLICY "Users can update their own comments"
  ON feed_comments
  FOR UPDATE
  TO authenticated
  USING (
    author_id IN (
      SELECT tm.id 
      FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- Create correct DELETE policy
CREATE POLICY "Users can delete their own comments"
  ON feed_comments
  FOR DELETE
  TO authenticated
  USING (
    author_id IN (
      SELECT tm.id 
      FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. FIX FEED_MENTIONS POLICIES
-- =====================================================

-- Drop broken policies
DROP POLICY IF EXISTS "Users can view mentions in their organization" ON feed_mentions;
DROP POLICY IF EXISTS "Users can create mentions as team members" ON feed_mentions;

-- Create correct SELECT policy
CREATE POLICY "Users can view mentions in their organization"
  ON feed_mentions
  FOR SELECT
  TO public
  USING (
    -- Users can see mentions in organizations where they have a user_role
    EXISTS (
      SELECT 1 FROM feed_posts fp
      INNER JOIN user_roles ur ON ur.organization_id = fp.organization_id
      WHERE fp.id = feed_mentions.post_id
        AND ur.user_id = auth.uid()
    )
  );

-- Create correct INSERT policy
CREATE POLICY "Users can create mentions as team members"
  ON feed_mentions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- mentioned_by_id must be a team member in an org where auth user has a role
    mentioned_by_id IN (
      SELECT tm.id 
      FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. FIX FEED_ATTACHMENTS POLICIES
-- =====================================================

-- Drop broken policies
DROP POLICY IF EXISTS "Users can view attachments in their organization" ON feed_attachments;
DROP POLICY IF EXISTS "Users can upload attachments as team members" ON feed_attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON feed_attachments;

-- Create correct SELECT policy
CREATE POLICY "Users can view attachments in their organization"
  ON feed_attachments
  FOR SELECT
  TO public
  USING (
    -- Users can see attachments in organizations where they have a user_role
    EXISTS (
      SELECT 1 FROM feed_posts fp
      INNER JOIN user_roles ur ON ur.organization_id = fp.organization_id
      WHERE fp.id = feed_attachments.post_id
        AND ur.user_id = auth.uid()
    )
  );

-- Create correct INSERT policy
CREATE POLICY "Users can upload attachments as team members"
  ON feed_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- uploaded_by must be a team member in an org where auth user has a role
    uploaded_by IN (
      SELECT tm.id 
      FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- Create correct DELETE policy
CREATE POLICY "Users can delete their own attachments"
  ON feed_attachments
  FOR DELETE
  TO authenticated
  USING (
    uploaded_by IN (
      SELECT tm.id 
      FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check all feed table policies
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%team_members.id = auth.uid()%' THEN '❌ BROKEN'
    WHEN qual LIKE '%user_roles%' OR with_check LIKE '%user_roles%' THEN '✅ FIXED'
    ELSE '⚠️ CHECK MANUALLY'
  END as status
FROM pg_policies
WHERE tablename IN ('feed_posts', 'feed_reactions', 'feed_comments', 'feed_mentions', 'feed_attachments')
ORDER BY tablename, cmd;

-- Test with your user
SELECT 
  'Policy Test Results' as test,
  -- Can user see posts?
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d'
        AND ur.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
    ) THEN '✅ Can view posts'
    ELSE '❌ Cannot view posts'
  END as posts_check,
  -- Can user add reactions?
  CASE 
    WHEN 'a1f7fde9-260d-4507-925a-1aabf787abcf' IN (
      SELECT tm.id 
      FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d'
    ) THEN '✅ Can add reactions'
    ELSE '❌ Cannot add reactions'
  END as reactions_check,
  -- Can user create comments?
  CASE 
    WHEN 'a1f7fde9-260d-4507-925a-1aabf787abcf' IN (
      SELECT tm.id 
      FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = 'cd9af250-133d-409e-9e97-f570f767648d'
    ) THEN '✅ Can create comments'
    ELSE '❌ Cannot create comments'
  END as comments_check;
