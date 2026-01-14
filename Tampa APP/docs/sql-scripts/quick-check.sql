-- ============================================================================
-- DIAGNOSTIC: Check all triggers on team_members
-- ============================================================================

-- 1. List ALL triggers on team_members
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_orientation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'team_members'
ORDER BY trigger_name;

-- 2. Check if updated_at column really exists and its details
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'team_members'
  AND column_name = 'updated_at';

-- 3. Get the actual function code
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'update_updated_at_column';

-- 4. Check for any other triggers that might be causing issues
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid = 'team_members'::regclass
  AND tgisinternal = false;
