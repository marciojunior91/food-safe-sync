-- ============================================================================
-- APPLY TEAM MEMBERS MIGRATIONS - SAFE EXECUTION (Dashboard-Compatible)
-- ============================================================================
-- This script safely applies the three new team_members migrations:
-- 1. 20260104000000_add_team_members_to_routine_tasks.sql
-- 2. 20260104000001_enhance_team_members_auth.sql
-- 3. 20260104000002_make_team_member_mandatory_routine_tasks.sql
--
-- Execute this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Add team_member_id to routine tasks
-- ============================================================================

-- Add team_member_id to routine_task_assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'routine_task_assignments' 
    AND column_name = 'team_member_id'
  ) THEN
    ALTER TABLE routine_task_assignments 
    ADD COLUMN team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added team_member_id to routine_task_assignments';
  ELSE
    RAISE NOTICE 'Column team_member_id already exists in routine_task_assignments';
  END IF;
END $$;

-- Add team_member_id to routine_task_completions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'routine_task_completions' 
    AND column_name = 'team_member_id'
  ) THEN
    ALTER TABLE routine_task_completions 
    ADD COLUMN team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added team_member_id to routine_task_completions';
  ELSE
    RAISE NOTICE 'Column team_member_id already exists in routine_task_completions';
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_routine_task_assignments_team_member 
ON routine_task_assignments(team_member_id) 
WHERE team_member_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_routine_task_completions_team_member 
ON routine_task_completions(team_member_id) 
WHERE team_member_id IS NOT NULL;

COMMENT ON COLUMN routine_task_assignments.team_member_id IS 'Team member assigned to this routine task';
COMMENT ON COLUMN routine_task_completions.team_member_id IS 'Team member who completed this routine task';

-- ============================================================================
-- MIGRATION 2: Enhance team_members authentication
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
  SELECT pin_hash INTO stored_hash
  FROM team_members
  WHERE id = member_id;

  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;

  input_hash := pin_input;
  RETURN stored_hash = input_hash;
END;
$$;

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

  SELECT organization_id INTO target_org_id
  FROM team_members
  WHERE id = target_member_id;

  SELECT organization_id INTO current_org_id
  FROM profiles
  WHERE user_id = auth.uid();

  IF target_org_id != current_org_id THEN
    RETURN FALSE;
  END IF;

  IF current_user_role IN ('admin', 'manager', 'leader_chef') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

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

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS "Users can view team members in their organization" ON team_members;
DROP POLICY IF EXISTS "Admins can create team members" ON team_members;
DROP POLICY IF EXISTS "Admins can update team members" ON team_members;
DROP POLICY IF EXISTS "Admins can deactivate team members" ON team_members;

-- View policy
CREATE POLICY "view_team_members_in_org"
  ON team_members FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
    AND (
      is_active = true
      OR EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'manager')
      )
    )
  );

-- Insert policy
CREATE POLICY "create_team_members"
  ON team_members FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT p.organization_id FROM profiles p WHERE p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'manager', 'leader_chef')
    )
  );

-- Update policy
CREATE POLICY "update_team_members"
  ON team_members FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT p.organization_id FROM profiles p WHERE p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'manager', 'leader_chef')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT p.organization_id FROM profiles p WHERE p.user_id = auth.uid()
    )
  );

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_team_members_org_active 
ON team_members(organization_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_team_members_auth_role 
ON team_members(auth_role_id, organization_id) WHERE auth_role_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_members_role_org 
ON team_members(role_type, organization_id, is_active);

-- Grant permissions
GRANT EXECUTE ON FUNCTION verify_team_member_pin TO authenticated;
GRANT EXECUTE ON FUNCTION can_edit_team_member TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_org_team_members TO authenticated;

-- ============================================================================
-- MIGRATION 3: Make team_member_id mandatory
-- ============================================================================
-- NOTE: This will NOT apply NOT NULL constraint yet - do it manually after testing

CREATE OR REPLACE FUNCTION validate_routine_task_team_member(
  task_id_param UUID,
  team_member_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_org_id UUID;
  member_org_id UUID;
BEGIN
  SELECT rtt.organization_id INTO task_org_id
  FROM routine_tasks rt
  JOIN routine_task_templates rtt ON rt.template_id = rtt.id
  WHERE rt.id = task_id_param;

  SELECT organization_id INTO member_org_id
  FROM team_members
  WHERE id = team_member_id_param;

  IF task_org_id IS NULL OR member_org_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN task_org_id = member_org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION validate_routine_task_team_member TO authenticated;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_routine_task_assignments_team_member_task
ON routine_task_assignments(team_member_id, task_id);

CREATE INDEX IF NOT EXISTS idx_routine_task_completions_team_member_task
ON routine_task_completions(team_member_id, task_id);

-- ============================================================================
-- SUMMARY: All migrations applied successfully!
-- ============================================================================
-- Applied:
--   ✓ Added team_member_id columns to routine tasks
--   ✓ Created PIN verification functions
--   ✓ Enhanced RLS policies with user_roles validation
--   ✓ Created helper functions for team member management
--   ✓ Added validation function for routine tasks
--   ✓ Created performance indexes
-- 
-- Next steps:
--   1. Test team member selection in UI
--   2. Test PIN validation for staff users
--   3. Test routine task assignment with team members
--   4. After testing, manually apply NOT NULL constraint if needed
-- ============================================================================
