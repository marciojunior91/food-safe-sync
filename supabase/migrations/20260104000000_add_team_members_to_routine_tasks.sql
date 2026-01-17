-- ============================================================================
-- ADD TEAM MEMBERS TO ROUTINE TASKS
-- ============================================================================
-- This migration adds team_member_id to routine task assignments and completions
-- Allows associating routine tasks with team members from the team_members table
-- ============================================================================

-- Add team_member_id to routine_task_assignments
ALTER TABLE routine_task_assignments 
ADD COLUMN IF NOT EXISTS team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- Add team_member_id to routine_task_completions
ALTER TABLE routine_task_completions 
ADD COLUMN IF NOT EXISTS team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_routine_task_assignments_team_member 
ON routine_task_assignments(team_member_id) 
WHERE team_member_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_routine_task_completions_team_member 
ON routine_task_completions(team_member_id) 
WHERE team_member_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN routine_task_assignments.team_member_id IS 'Team member assigned to this routine task';
COMMENT ON COLUMN routine_task_completions.team_member_id IS 'Team member who completed this routine task';

-- ============================================================================
-- MIGRATION NOTE
-- ============================================================================
-- This allows routine tasks to be assigned to team members from the team_members
-- table instead of just user_id from profiles. This supports the kitchen tablet
-- workflow where shared accounts are logged in and team members identify themselves
-- for task completion.
-- ============================================================================
