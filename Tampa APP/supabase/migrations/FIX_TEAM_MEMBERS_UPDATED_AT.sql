-- Fix: Ensure team_members table has updated_at column
-- Also fix phone constraint to allow NULL or empty string

-- Step 1: Check if updated_at column exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'team_members' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.team_members 
      ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    RAISE NOTICE '✓ Added updated_at column to team_members';
  ELSE
    RAISE NOTICE '✓ updated_at column already exists';
  END IF;
END $$;

-- Step 2: Fix phone check constraint to be more lenient
ALTER TABLE public.team_members 
  DROP CONSTRAINT IF EXISTS team_members_phone_check;

ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_phone_check 
  CHECK (
    phone IS NULL OR 
    phone = '' OR 
    phone ~* '^\+?[0-9\s\-\(\)]{7,20}$'
  );

-- Step 3: Ensure the trigger exists
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Verification
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'team_members' 
  AND column_name IN ('updated_at', 'created_at')
ORDER BY column_name;
