-- ============================================================================
-- ENHANCE TEAM MEMBERS AUTHENTICATION & RLS
-- ============================================================================
-- This migration enhances the team_members table with:
-- 1. PIN verification function
-- 2. Enhanced RLS policies with user_roles validation
-- 3. Helper functions for authentication flow
-- ============================================================================

-- ============================================================================
-- 1. PIN VERIFICATION FUNCTION
-- ============================================================================

-- Function to verify team member PIN
CREATE OR REPLACE FUNCTION verify_team_member_pin(
  member_id UUID,
  pin_input TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash TEXT;
  input_hash TEXT;
BEGIN
  -- Get stored PIN hash
  SELECT pin_hash INTO stored_hash
  FROM team_members
  WHERE id = member_id;

  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Hash input PIN (using same algorithm as pinUtils.ts)
  -- Note: This expects the frontend to hash the PIN before sending
  -- Or you can implement the hash logic here
  input_hash := pin_input;

  -- Compare hashes
  RETURN stored_hash = input_hash;
END;
$$;

COMMENT ON FUNCTION verify_team_member_pin IS 'Verifies a team member PIN against stored hash. Frontend should hash PIN before calling.';

-- ============================================================================
-- 2. HELPER FUNCTIONS FOR TEAM MEMBER AUTHORIZATION
-- ============================================================================

-- Function to check if current user can edit team member
CREATE OR REPLACE FUNCTION can_edit_team_member(
  target_member_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role app_role;
  target_org_id UUID;
  current_org_id UUID;
BEGIN
  -- Get current user's role
  SELECT ur.role INTO current_user_role
  FROM user_roles ur
  WHERE ur.user_id = auth.uid()
  ORDER BY 
    CASE ur.role
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'leader_chef' THEN 3
      WHEN 'staff' THEN 4
    END
  LIMIT 1;

  -- Get target team member's organization
  SELECT organization_id INTO target_org_id
  FROM team_members
  WHERE id = target_member_id;

  -- Get current user's organization
  SELECT organization_id INTO current_org_id
  FROM profiles
  WHERE user_id = auth.uid();

  -- Must be in same organization
  IF target_org_id != current_org_id THEN
    RETURN FALSE;
  END IF;

  -- Admin and Manager can edit anyone
  IF current_user_role IN ('admin', 'manager') THEN
    RETURN TRUE;
  END IF;

  -- Leader Chef can edit anyone
  IF current_user_role = 'leader_chef' THEN
    RETURN TRUE;
  END IF;

  -- Staff cannot edit via direct SQL (must use PIN validation in app)
  RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION can_edit_team_member IS 'Checks if current user can edit a team member. Admin/Manager/Leader Chef can edit anyone in their org. Staff must use PIN validation in app.';

-- Function to get current user's organization team members
CREATE OR REPLACE FUNCTION get_current_org_team_members()
RETURNS SETOF team_members
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tm.*
  FROM team_members tm
  WHERE tm.organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
  AND tm.is_active = true
  ORDER BY tm.display_name;
$$;

COMMENT ON FUNCTION get_current_org_team_members IS 'Returns all active team members in current user organization';

-- ============================================================================
-- 3. ENHANCED RLS POLICIES
-- ============================================================================

-- Drop existing policies to recreate with better logic
DROP POLICY IF EXISTS "Users can view team members in their organization" ON team_members;
DROP POLICY IF EXISTS "Admins can create team members" ON team_members;
DROP POLICY IF EXISTS "Admins can update team members" ON team_members;
DROP POLICY IF EXISTS "Admins can deactivate team members" ON team_members;

-- ============================================================================
-- SELECT POLICY: View team members in organization
-- ============================================================================

CREATE POLICY "view_team_members_in_org"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    -- Must be in same organization
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    -- Only show active members (unless user is admin/manager)
    AND (
      is_active = true
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin', 'manager')
      )
    )
  );

COMMENT ON POLICY "view_team_members_in_org" ON team_members IS 
'Users can view active team members in their organization. Admin/Manager can also view inactive members.';

-- ============================================================================
-- INSERT POLICY: Create team members
-- ============================================================================

CREATE POLICY "create_team_members"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Must be creating in own organization
    organization_id IN (
      SELECT p.organization_id 
      FROM profiles p
      WHERE p.user_id = auth.uid()
    )
    -- Must have admin, manager, or leader_chef role
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'manager', 'leader_chef')
    )
  );

COMMENT ON POLICY "create_team_members" ON team_members IS 
'Admin, Manager, and Leader Chef can create team members in their organization.';

-- ============================================================================
-- UPDATE POLICY: Update team members
-- ============================================================================

CREATE POLICY "update_team_members"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (
    -- Must be in same organization
    organization_id IN (
      SELECT p.organization_id 
      FROM profiles p
      WHERE p.user_id = auth.uid()
    )
    -- Must have permission (admin/manager/leader_chef)
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'manager', 'leader_chef')
    )
  )
  WITH CHECK (
    -- Cannot change organization
    organization_id IN (
      SELECT p.organization_id 
      FROM profiles p
      WHERE p.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "update_team_members" ON team_members IS 
'Admin, Manager, and Leader Chef can update team members in their organization. Staff must use PIN validation in application layer.';

-- ============================================================================
-- DELETE POLICY: Soft delete only
-- ============================================================================

CREATE POLICY "deactivate_team_members"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (
    -- Must be in same organization
    organization_id IN (
      SELECT p.organization_id 
      FROM profiles p
      WHERE p.user_id = auth.uid()
    )
    -- Must have admin or manager role
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    -- Can only set is_active to false (soft delete)
    is_active = false
  );

COMMENT ON POLICY "deactivate_team_members" ON team_members IS 
'Admin and Manager can deactivate (soft delete) team members in their organization.';

-- ============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Add index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_team_members_org_active 
ON team_members(organization_id, is_active) 
WHERE is_active = true;

-- Add index for auth_role_id lookups
CREATE INDEX IF NOT EXISTS idx_team_members_auth_role 
ON team_members(auth_role_id, organization_id) 
WHERE auth_role_id IS NOT NULL;

-- Add index for role_type filtering
CREATE INDEX IF NOT EXISTS idx_team_members_role_org 
ON team_members(role_type, organization_id, is_active);

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION verify_team_member_pin TO authenticated;
GRANT EXECUTE ON FUNCTION can_edit_team_member TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_org_team_members TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add migration metadata
COMMENT ON TABLE team_members IS 
'Team members table with enhanced RLS policies. 
- Layer 1: auth.users + user_roles (system access)
- Layer 2: team_members (operational identity)
- PIN validation done in application layer for staff users.
- Admin/Manager/Leader Chef can edit via RLS directly.';
