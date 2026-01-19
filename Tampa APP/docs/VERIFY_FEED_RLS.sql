-- =====================================================
-- VERIFICATION SCRIPT - Check Feed RLS Policies
-- =====================================================
-- Run this in Supabase SQL Editor to verify policies

-- 1. Check if policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as check_clause
FROM pg_policies 
WHERE tablename IN ('feed_posts', 'feed_reactions', 'feed_comments', 'feed_attachments', 'feed_mentions')
ORDER BY tablename, policyname;

-- 2. Check RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'feed_%'
ORDER BY tablename;

-- 3. Test query to see what your auth.uid() is
SELECT 
  auth.uid() as current_auth_user,
  current_user as current_db_user;

-- 4. Check your user_roles
SELECT 
  ur.user_id,
  ur.organization_id,
  ur.role,
  o.name as org_name
FROM user_roles ur
LEFT JOIN organizations o ON o.id = ur.organization_id
WHERE ur.user_id = auth.uid();

-- 5. Check team_members in your organization
SELECT 
  tm.id,
  tm.display_name,
  tm.role_type,
  tm.organization_id,
  o.name as org_name
FROM team_members tm
LEFT JOIN organizations o ON o.id = tm.organization_id
WHERE tm.organization_id IN (
  SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
);

-- 6. Test the INSERT policy (this should succeed if policy is correct)
-- Replace these UUIDs with actual values from queries above:
/*
INSERT INTO feed_posts (
  organization_id,
  author_id,
  content,
  content_type
) VALUES (
  'YOUR_ORG_ID_HERE',
  'YOUR_TEAM_MEMBER_ID_HERE',
  'Test post from policy verification',
  'text'
);
*/
