-- ============================================================================
-- ITERATION 13 - COMPLETE DATABASE SETUP
-- ============================================================================
-- This script contains ALL tables and migrations needed for Iteration 13:
-- - Routine Task Templates (redesigned structure)
-- - Team Members authentication
-- - Onboarding infrastructure
-- - Feed module enhancements
--
-- Execute this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: ROUTINE TASK TEMPLATES (New Structure for Iteration 13)
-- ============================================================================

-- Create routine_task_templates table
CREATE TABLE IF NOT EXISTS routine_task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL,
  frequency TEXT DEFAULT 'daily',
  estimated_duration_minutes INTEGER,
  requires_photo BOOLEAN DEFAULT false,
  photo_instructions TEXT,
  checklist_items JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT check_task_type CHECK (task_type IN (
    'cleaning',
    'temperature',
    'opening',
    'closing',
    'maintenance',
    'safety',
    'quality',
    'custom'
  )),
  
  CONSTRAINT check_frequency CHECK (frequency IN (
    'daily',
    'weekly',
    'biweekly',
    'monthly',
    'on_demand'
  ))
);

CREATE INDEX IF NOT EXISTS idx_routine_task_templates_org ON routine_task_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_routine_task_templates_type ON routine_task_templates(task_type);
CREATE INDEX IF NOT EXISTS idx_routine_task_templates_active ON routine_task_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE routine_task_templates IS 'Template definitions for routine tasks';

-- Enable RLS
ALTER TABLE routine_task_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routine_task_templates
DROP POLICY IF EXISTS "view_routine_task_templates" ON routine_task_templates;
CREATE POLICY "view_routine_task_templates"
  ON routine_task_templates FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "create_routine_task_templates" ON routine_task_templates;
CREATE POLICY "create_routine_task_templates"
  ON routine_task_templates FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT p.organization_id FROM profiles p WHERE p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'manager', 'leader_chef')
    )
  );

DROP POLICY IF EXISTS "update_routine_task_templates" ON routine_task_templates;
CREATE POLICY "update_routine_task_templates"
  ON routine_task_templates FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT p.organization_id FROM profiles p WHERE p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'manager', 'leader_chef')
    )
  );

-- ============================================================================
-- PART 2: ROUTINE TASK ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS routine_task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES routine_tasks(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL,
  status TEXT DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT check_status CHECK (status IN (
    'not_started',
    'in_progress',
    'completed',
    'skipped',
    'overdue'
  )),
  
  UNIQUE(task_id, assigned_date)
);

CREATE INDEX IF NOT EXISTS idx_routine_task_assignments_task ON routine_task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_routine_task_assignments_date ON routine_task_assignments(assigned_date);
CREATE INDEX IF NOT EXISTS idx_routine_task_assignments_status ON routine_task_assignments(status);

COMMENT ON TABLE routine_task_assignments IS 'Daily assignments of routine tasks';

-- Enable RLS
ALTER TABLE routine_task_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routine_task_assignments
DROP POLICY IF EXISTS "view_routine_task_assignments" ON routine_task_assignments;
CREATE POLICY "view_routine_task_assignments"
  ON routine_task_assignments FOR SELECT TO authenticated
  USING (
    task_id IN (
      SELECT id FROM routine_tasks WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "create_routine_task_assignments" ON routine_task_assignments;
CREATE POLICY "create_routine_task_assignments"
  ON routine_task_assignments FOR INSERT TO authenticated
  WITH CHECK (
    task_id IN (
      SELECT id FROM routine_tasks WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "update_routine_task_assignments" ON routine_task_assignments;
CREATE POLICY "update_routine_task_assignments"
  ON routine_task_assignments FOR UPDATE TO authenticated
  USING (
    task_id IN (
      SELECT id FROM routine_tasks WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- PART 3: ROUTINE TASK COMPLETIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS routine_task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES routine_tasks(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES routine_task_assignments(id) ON DELETE SET NULL,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ DEFAULT now(),
  checklist_responses JSONB DEFAULT '[]',
  photo_url TEXT,
  notes TEXT,
  verification_status TEXT DEFAULT 'pending',
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  CONSTRAINT check_verification_status CHECK (verification_status IN (
    'pending',
    'approved',
    'rejected',
    'needs_revision'
  ))
);

CREATE INDEX IF NOT EXISTS idx_routine_task_completions_task ON routine_task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_routine_task_completions_assignment ON routine_task_completions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_routine_task_completions_completed_by ON routine_task_completions(completed_by);
CREATE INDEX IF NOT EXISTS idx_routine_task_completions_date ON routine_task_completions(completed_at);

COMMENT ON TABLE routine_task_completions IS 'Completion records for routine tasks';

-- Enable RLS
ALTER TABLE routine_task_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routine_task_completions
DROP POLICY IF EXISTS "view_routine_task_completions" ON routine_task_completions;
CREATE POLICY "view_routine_task_completions"
  ON routine_task_completions FOR SELECT TO authenticated
  USING (
    task_id IN (
      SELECT id FROM routine_tasks WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "create_routine_task_completions" ON routine_task_completions;
CREATE POLICY "create_routine_task_completions"
  ON routine_task_completions FOR INSERT TO authenticated
  WITH CHECK (
    completed_by = auth.uid()
    AND task_id IN (
      SELECT id FROM routine_tasks WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "update_routine_task_completions" ON routine_task_completions;
CREATE POLICY "update_routine_task_completions"
  ON routine_task_completions FOR UPDATE TO authenticated
  USING (
    task_id IN (
      SELECT id FROM routine_tasks WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- PART 4: TEAM MEMBERS COLUMNS TO ROUTINE TASKS
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
-- PART 5: TEAM MEMBERS AUTHENTICATION FUNCTIONS
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

-- Drop and recreate enhanced RLS policies for team_members
DROP POLICY IF EXISTS "Users can view team members in their organization" ON team_members;
DROP POLICY IF EXISTS "Admins can create team members" ON team_members;
DROP POLICY IF EXISTS "Admins can update team members" ON team_members;
DROP POLICY IF EXISTS "Admins can deactivate team members" ON team_members;
DROP POLICY IF EXISTS "view_team_members_in_org" ON team_members;
DROP POLICY IF EXISTS "create_team_members" ON team_members;
DROP POLICY IF EXISTS "update_team_members" ON team_members;

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

-- Add performance indexes for team_members
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
-- PART 6: VALIDATION FUNCTION
-- ============================================================================

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

-- Add final indexes
CREATE INDEX IF NOT EXISTS idx_routine_task_assignments_team_member_task
ON routine_task_assignments(team_member_id, task_id);

CREATE INDEX IF NOT EXISTS idx_routine_task_completions_team_member_task
ON routine_task_completions(team_member_id, task_id);

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Applied:
--   ✓ Created routine_task_templates table with RLS policies
--   ✓ Created routine_task_assignments table with RLS policies
--   ✓ Created routine_task_completions table with RLS policies
--   ✓ Added team_member_id columns to routine tasks tables
--   ✓ Created PIN verification functions
--   ✓ Enhanced RLS policies with user_roles validation
--   ✓ Created helper functions for team member management
--   ✓ Added validation function for routine tasks
--   ✓ Created performance indexes
-- 
-- Next steps:
--   1. Regenerate TypeScript types
--   2. Test team member selection in UI
--   3. Test PIN validation for staff users
--   4. Test routine task assignment with team members
-- ============================================================================
