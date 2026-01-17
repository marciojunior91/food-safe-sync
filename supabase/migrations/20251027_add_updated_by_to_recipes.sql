-- Add updated_by field to recipes table (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'recipes' 
    AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE public.recipes 
    ADD COLUMN updated_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Set initial value for existing records (same as created_by)
UPDATE public.recipes 
SET updated_by = created_by 
WHERE updated_by IS NULL;

-- Add foreign key constraints with meaningful names for relationship queries
-- Drop existing constraint on created_by if it exists
ALTER TABLE public.recipes 
DROP CONSTRAINT IF EXISTS recipes_created_by_fkey;

-- Add it back with the proper name
ALTER TABLE public.recipes 
ADD CONSTRAINT recipes_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES auth.users(id);

-- Only add updated_by constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'recipes' 
    AND constraint_name = 'recipes_updated_by_fkey'
  ) THEN
    ALTER TABLE public.recipes 
    ADD CONSTRAINT recipes_updated_by_fkey 
    FOREIGN KEY (updated_by) 
    REFERENCES auth.users(id);
  END IF;
END $$;

-- Create or replace trigger function to update both timestamp and user
CREATE OR REPLACE FUNCTION public.update_recipe_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the existing trigger with the new one
DROP TRIGGER IF EXISTS update_recipes_updated_at ON public.recipes;

CREATE TRIGGER update_recipes_metadata
BEFORE UPDATE ON public.recipes
FOR EACH ROW
EXECUTE FUNCTION public.update_recipe_metadata();
