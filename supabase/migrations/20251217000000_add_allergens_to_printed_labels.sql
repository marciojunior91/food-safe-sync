-- FIX: Add allergens column to printed_labels table
-- This should already exist from migration 20251209140200, but if it's missing, run this:

-- Add allergens array column
ALTER TABLE public.printed_labels 
  ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}';

-- Add GIN index for better array search performance
CREATE INDEX IF NOT EXISTS idx_printed_labels_allergens 
  ON public.printed_labels USING GIN(allergens);

-- Verify the column was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'printed_labels' 
      AND column_name = 'allergens'
  ) THEN
    RAISE NOTICE '✅ allergens column exists in printed_labels table';
  ELSE
    RAISE EXCEPTION '❌ Failed to add allergens column to printed_labels table';
  END IF;
END $$;

-- Display current printed_labels structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'printed_labels'
ORDER BY ordinal_position;
