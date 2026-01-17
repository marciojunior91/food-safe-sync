-- ============================================================================
-- FIX: Allow service_role to manage user_roles table
-- Issue: Edge function (invite-user) cannot insert into user_roles due to RLS
-- Solution: Add policies for service_role operations
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role can manage user_roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can insert user_roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can update user_roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can delete user_roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can select user_roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view organization roles" ON user_roles;

-- Ensure RLS is enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow service_role to INSERT user_roles (for edge function)
CREATE POLICY "Service role can insert user_roles"
ON user_roles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow service_role to UPDATE user_roles (for edge function)
CREATE POLICY "Service role can update user_roles"
ON user_roles
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Allow service_role to DELETE user_roles (for cleanup)
CREATE POLICY "Service role can delete user_roles"
ON user_roles
FOR DELETE
TO service_role
USING (true);

-- Allow service_role to SELECT user_roles (for verification)
CREATE POLICY "Service role can select user_roles"
ON user_roles
FOR SELECT
TO service_role
USING (true);

-- Allow authenticated users to view their own role
CREATE POLICY "Users can view their own role"
ON user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to view roles in their organization
-- Note: We avoid recursion by not querying user_roles within the policy
CREATE POLICY "Users can view organization roles"
ON user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p1
    JOIN profiles p2 ON p1.organization_id = p2.organization_id
    WHERE p1.user_id = user_roles.user_id
      AND p2.user_id = auth.uid()
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check RLS status
SELECT 
  'RLS Status' as info,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'user_roles';

-- Check all policies
SELECT 
  'Policies' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_roles'
ORDER BY policyname;
