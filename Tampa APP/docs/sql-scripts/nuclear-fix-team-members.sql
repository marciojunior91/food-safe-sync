-- ============================================================================
-- NUCLEAR OPTION: Drop ALL triggers on team_members and recreate only essentials
-- ============================================================================

-- Drop ALL existing triggers on team_members
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tgname 
    FROM pg_trigger 
    WHERE tgrelid = 'team_members'::regclass 
      AND tgisinternal = false
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON team_members', r.tgname);
    RAISE NOTICE 'Dropped trigger: %', r.tgname;
  END LOOP;
END $$;

-- Ensure updated_at column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'team_members' 
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE team_members 
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    RAISE NOTICE '✓ Added updated_at column';
  ELSE
    -- Set default value for existing column
    ALTER TABLE team_members 
    ALTER COLUMN updated_at SET DEFAULT now();
    RAISE NOTICE '✓ updated_at column already exists';
  END IF;
END $$;

-- Create simple trigger function (no fancy stuff)
-- Works for both INSERT and UPDATE
-- This will run FIRST (priority trigger) to ensure updated_at is always set
CREATE OR REPLACE FUNCTION update_team_members_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set updated_at, regardless of INSERT or UPDATE
  NEW.updated_at := COALESCE(NEW.updated_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop all existing updated_at triggers
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
DROP TRIGGER IF EXISTS set_team_members_updated_at ON team_members;
DROP TRIGGER IF EXISTS team_members_updated_at ON team_members;

-- Create trigger for both INSERT and UPDATE
-- Using constraint trigger to run BEFORE other triggers
CREATE TRIGGER aaa_update_team_members_updated_at
  BEFORE INSERT OR UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_timestamp();

-- Note: Naming with 'aaa_' prefix ensures it runs first alphabetically

-- Verify
SELECT 
  'Triggers after cleanup' as info,
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgrelid = 'team_members'::regclass
  AND tgisinternal = false;
