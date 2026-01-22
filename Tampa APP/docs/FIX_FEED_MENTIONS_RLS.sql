-- =====================================================
-- FIX: Feed Mentions RLS Policy
-- =====================================================
-- Problem: "Users can view their own mentions" blocks users
--          because it checks auth.uid() = mentioned_user_id
--          but we use team_member.id (not auth.uid())
--
-- Solution: Update the policy to check organization membership
--           via team_members table using user_id column
--
-- Date: 2026-01-22
-- =====================================================

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Users can view their own mentions" ON feed_mentions;

-- Step 2: Update existing "Users can view mentions in their organization" policy
DROP POLICY IF EXISTS "Users can view mentions in their organization" ON feed_mentions;

CREATE POLICY "Users can view mentions in their organization"
ON feed_mentions
FOR SELECT
TO public
USING (
  -- Allow if the mentioned user is in the same organization as the current user
  EXISTS (
    SELECT 1 
    FROM team_members tm_mentioned
    INNER JOIN team_members tm_current 
      ON tm_mentioned.organization_id = tm_current.organization_id
    WHERE tm_mentioned.id = feed_mentions.mentioned_user_id
      AND tm_current.auth_user_id = auth.uid()
  )
);

-- Step 3: Update "Users can create mentions" policy (if needed)
DROP POLICY IF EXISTS "Users can create mentions" ON feed_mentions;

CREATE POLICY "Users can create mentions"
ON feed_mentions
FOR INSERT
TO public
WITH CHECK (
  -- Allow if user is in the same org as the mentioned user
  EXISTS (
    SELECT 1 
    FROM team_members tm_mentioned
    INNER JOIN team_members tm_current 
      ON tm_mentioned.organization_id = tm_current.organization_id
    WHERE tm_mentioned.id = feed_mentions.mentioned_user_id
      AND tm_current.auth_user_id = auth.uid()
  )
);

-- Step 4: Update "Users can mark their mentions as read" policy
DROP POLICY IF EXISTS "Users can mark their mentions as read" ON feed_mentions;

CREATE POLICY "Users can mark their mentions as read"
ON feed_mentions
FOR UPDATE
TO public
USING (
  -- Allow if user is the mentioned user OR is in the same organization
  EXISTS (
    SELECT 1 
    FROM team_members tm
    WHERE tm.id = feed_mentions.mentioned_user_id
      AND tm.auth_user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM team_members tm_mentioned
    INNER JOIN team_members tm_current 
      ON tm_mentioned.organization_id = tm_current.organization_id
    WHERE tm_mentioned.id = feed_mentions.mentioned_user_id
      AND tm_current.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  -- Same check for WITH CHECK
  EXISTS (
    SELECT 1 
    FROM team_members tm
    WHERE tm.id = feed_mentions.mentioned_user_id
      AND tm.auth_user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM team_members tm_mentioned
    INNER JOIN team_members tm_current 
      ON tm_mentioned.organization_id = tm_current.organization_id
    WHERE tm_mentioned.id = feed_mentions.mentioned_user_id
      AND tm_current.auth_user_id = auth.uid()
  )
);

-- Step 5: Verify the updated policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'feed_mentions'
ORDER BY policyname;

-- Step 6: Test the fix by querying mentions for Ana Costa
-- Expected: Should return the mention from Carlos Oliveira
SELECT 
  fm.*,
  tm_mentioned.display_name as mentioned_user,
  tm_by.display_name as mentioned_by
FROM feed_mentions fm
LEFT JOIN team_members tm_mentioned ON fm.mentioned_user_id = tm_mentioned.id
LEFT JOIN team_members tm_by ON fm.mentioned_by_id = tm_by.id
WHERE fm.mentioned_user_id = 'cdfc2f50-c400-4f1d-8f42-71c8f1ae14e8'
ORDER BY fm.created_at DESC;

-- =====================================================
-- Expected Result After Fix:
-- =====================================================
-- Policies updated:
-- 1. "Users can view mentions in their organization" (SELECT) ✅
-- 2. "Users can create mentions" (INSERT) ✅
-- 3. "Users can mark their mentions as read" (UPDATE) ✅
--
-- Old policies removed:
-- - "Users can view their own mentions" (BLOCKED access) ❌
--
-- Now Ana Costa should see the mention from Carlos Oliveira
-- when clicking @Mentions tab!
-- =====================================================
