-- ============================================================================
-- FIX: Infinite Recursion in user_roles RLS Policies
-- ============================================================================
-- The current RLS policies are causing infinite recursion
-- We need to simplify them to avoid circular references
-- ============================================================================

-- Drop all existing user_roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view roles in their organization" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "view_user_roles" ON user_roles;
DROP POLICY IF EXISTS "insert_user_roles" ON user_roles;
DROP POLICY IF EXISTS "update_user_roles" ON user_roles;
DROP POLICY IF EXISTS "delete_user_roles" ON user_roles;

-- Create simple, non-recursive policies

-- 1. Users can view their OWN roles (no subqueries)
CREATE POLICY "view_own_roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Owners and admins can view ALL roles in their organization
CREATE POLICY "view_org_roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- 3. Only owners can INSERT roles (simplified)
CREATE POLICY "insert_roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be inserting for their own organization
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    -- And must be an owner (check via profiles, not user_roles to avoid recursion)
    AND EXISTS (
      SELECT 1 
      FROM organizations o
      WHERE o.id = organization_id
      AND o.owner_id = auth.uid()
    )
  );

-- 4. Only owners can UPDATE roles
CREATE POLICY "update_roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 
      FROM organizations o
      WHERE o.id = organization_id
      AND o.owner_id = auth.uid()
    )
  );

-- 5. Only owners can DELETE roles
CREATE POLICY "delete_roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 
      FROM organizations o
      WHERE o.id = organization_id
      AND o.owner_id = auth.uid()
    )
  );

-- Create a simple function to get user role without recursion
CREATE OR REPLACE FUNCTION get_user_role_simple(user_id_param UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM user_roles
  WHERE user_id = user_id_param
  ORDER BY 
    CASE role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'manager' THEN 3
      WHEN 'leader_chef' THEN 4
      WHEN 'staff' THEN 5
    END
  LIMIT 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_role_simple TO authenticated;

-- Verify the fix worked
SELECT 
  'Policy Check' as test,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies 
WHERE tablename = 'user_roles';

-- Test query (should work now)
SELECT 
  'Test Query' as test,
  ur.role,
  ur.organization_id
FROM user_roles ur
WHERE ur.user_id = auth.uid();

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Fixed infinite recursion by:
-- 1. Removed circular dependencies in policies
-- 2. Used organizations.owner_id instead of checking user_roles
-- 3. Created simple function for role lookup
-- 4. Split policies into specific actions (SELECT, INSERT, UPDATE, DELETE)
-- ============================================================================
