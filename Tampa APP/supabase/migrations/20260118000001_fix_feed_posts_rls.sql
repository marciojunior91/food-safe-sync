-- =====================================================
-- FIX FEED RLS POLICIES - Support Team Member Selection
-- =====================================================
-- Date: January 18, 2026
-- Issue: RLS policies were checking auth.uid() = author_id, but author_id is a team_member
--        In this app, users authenticate with shared accounts, then select a team_member
-- Fix: Allow inserting posts where author_id is ANY team_member in the user's organization

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can create posts in their organization" ON feed_posts;
DROP POLICY IF EXISTS "Authors can update their own posts" ON feed_posts;
DROP POLICY IF EXISTS "Authors can delete their own posts" ON feed_posts;

DROP POLICY IF EXISTS "Users can add reactions" ON feed_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON feed_reactions;

DROP POLICY IF EXISTS "Users can create comments" ON feed_comments;
DROP POLICY IF EXISTS "Authors can update their own comments" ON feed_comments;
DROP POLICY IF EXISTS "Authors can delete their own comments" ON feed_comments;

DROP POLICY IF EXISTS "Users can upload attachments" ON feed_attachments;
DROP POLICY IF EXISTS "Uploaders can delete their attachments" ON feed_attachments;

-- =====================================================
-- NEW POLICIES: Support Team Member Selection
-- =====================================================

-- POSTS: Users can create posts as ANY team member in their organization
CREATE POLICY "Users can create posts as team members in their org"
  ON feed_posts FOR INSERT
  WITH CHECK (
    -- Check that the author_id is a team_member in an organization where the authenticated user has access
    author_id IN (
      SELECT tm.id FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
    -- And the organization_id matches the team member's organization
    AND organization_id = (
      SELECT organization_id FROM team_members WHERE id = author_id
    )
  );

-- POSTS: Users can update posts by team members in their organization
CREATE POLICY "Users can update posts from their org team members"
  ON feed_posts FOR UPDATE
  USING (
    author_id IN (
      SELECT tm.id FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- POSTS: Users can delete posts by team members in their organization
CREATE POLICY "Users can delete posts from their org team members"
  ON feed_posts FOR DELETE
  USING (
    author_id IN (
      SELECT tm.id FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- REACTIONS: Users can add reactions as ANY team member in their org
CREATE POLICY "Users can add reactions as team members in their org"
  ON feed_reactions FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT tm.id FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- REACTIONS: Users can remove reactions from their org team members
CREATE POLICY "Users can remove reactions from their org team members"
  ON feed_reactions FOR DELETE
  USING (
    user_id IN (
      SELECT tm.id FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- COMMENTS: Users can create comments as ANY team member in their org
CREATE POLICY "Users can create comments as team members in their org"
  ON feed_comments FOR INSERT
  WITH CHECK (
    author_id IN (
      SELECT tm.id FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- COMMENTS: Users can update comments from their org team members
CREATE POLICY "Users can update comments from their org team members"
  ON feed_comments FOR UPDATE
  USING (
    author_id IN (
      SELECT tm.id FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- COMMENTS: Users can delete comments from their org team members
CREATE POLICY "Users can delete comments from their org team members"
  ON feed_comments FOR DELETE
  USING (
    author_id IN (
      SELECT tm.id FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- ATTACHMENTS: Users can upload attachments as ANY team member in their org
CREATE POLICY "Users can upload attachments as team members in their org"
  ON feed_attachments FOR INSERT
  WITH CHECK (
    uploaded_by IN (
      SELECT tm.id FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- ATTACHMENTS: Users can delete attachments from their org team members
CREATE POLICY "Users can delete attachments from their org team members"
  ON feed_attachments FOR DELETE
  USING (
    uploaded_by IN (
      SELECT tm.id FROM team_members tm
      INNER JOIN user_roles ur ON ur.organization_id = tm.organization_id
      WHERE ur.user_id = auth.uid()
    )
  );

-- =====================================================
-- MENTIONS POLICIES (Keep as is - already correct)
-- =====================================================
-- Mentions policies were already checking mentioned_user_id and mentioned_by_id
-- which are team_member IDs, so they should work fine

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify policies are applied:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename LIKE 'feed_%' 
-- ORDER BY tablename, policyname;

COMMENT ON POLICY "Users can create posts as team members in their org" ON feed_posts 
IS 'Allows authenticated users to create posts as any team_member in their organization (supports shared tablet accounts)';
