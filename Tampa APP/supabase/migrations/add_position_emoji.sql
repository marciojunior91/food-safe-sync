-- Add position_emoji column to team_members for custom sub-role emoji
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS position_emoji TEXT DEFAULT NULL;

COMMENT ON COLUMN public.team_members.position_emoji IS 'Custom emoji for the team member position/sub-role';
