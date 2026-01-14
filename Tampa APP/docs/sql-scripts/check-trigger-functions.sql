-- ============================================================================
-- COMPLETE FIX: Check all trigger functions and fix updated_at references
-- ============================================================================

-- 1. Check which functions reference updated_at
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
WHERE p.proname IN (
  'check_team_member_profile_completion',
  'notify_incomplete_team_member_profile',
  'sync_team_member_to_user_role',
  'auto_assign_auth_role_id',
  'check_team_member_completion',
  'update_updated_at_column'
);
