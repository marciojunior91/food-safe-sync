-- ============================================================================
-- FIX: Ensure team_members has updated_at column
-- Issue: Trigger expects updated_at but column doesn't exist
-- ============================================================================

-- Check if updated_at column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'team_members' 
      AND column_name = 'updated_at'
  ) THEN
    -- Add updated_at column if it doesn't exist
    ALTER TABLE team_members 
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    
    RAISE NOTICE '✓ Added updated_at column to team_members';
  ELSE
    RAISE NOTICE '✓ updated_at column already exists in team_members';
  END IF;
END $$;

-- Fix phone validation constraint (too restrictive)
ALTER TABLE team_members 
DROP CONSTRAINT IF EXISTS team_members_phone_check;

-- Add more flexible phone constraint (8-15 digits, optional + and spaces/dashes)
ALTER TABLE team_members
ADD CONSTRAINT team_members_phone_check 
CHECK (phone ~* '^[\+]?[0-9\s\-\(\)]{8,20}$' OR phone IS NULL);

-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check column exists
SELECT 
  'Column Check' as info,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'team_members'
  AND column_name = 'updated_at';

-- Check trigger exists
SELECT 
  'Trigger Check' as info,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'update_team_members_updated_at';

-- Check function exists
SELECT 
  'Function Check' as info,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'update_updated_at_column';
