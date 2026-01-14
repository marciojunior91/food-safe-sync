-- ============================================================================
-- APPLY THIS IN SUPABASE SQL EDITOR
-- ============================================================================
-- This adds team_member_id column to routine_tasks table
-- Run this directly in your Supabase project SQL editor
-- ============================================================================

-- Add team_member_id column
ALTER TABLE routine_tasks 
ADD COLUMN IF NOT EXISTS team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_routine_tasks_team_member 
ON routine_tasks(team_member_id);

-- Add comment
COMMENT ON COLUMN routine_tasks.team_member_id IS 
'Team member assigned to this routine task';
