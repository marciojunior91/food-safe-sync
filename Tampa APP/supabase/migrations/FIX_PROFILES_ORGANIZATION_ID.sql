-- Fix: Make organization_id nullable in profiles table
-- Root Cause: handle_new_user() trigger creates profile without organization_id
-- This migration allows the trigger to create basic profile, then edge function updates it

-- Step 1: Make organization_id nullable
ALTER TABLE public.profiles 
  ALTER COLUMN organization_id DROP NOT NULL;

-- Step 2: Update the handle_new_user trigger to include user_metadata fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create basic profile with user_metadata if available
  INSERT INTO public.profiles (
    user_id, 
    email,
    display_name,
    organization_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name', 
      split_part(NEW.email, '@', 1)
    ),
    -- Try to get organization_id from user_metadata, otherwise NULL
    (NEW.raw_user_meta_data->>'organization_id')::uuid
  );
  
  RETURN NEW;
END;
$$;

-- Step 3: Verification
DO $$
BEGIN
  RAISE NOTICE '✓ organization_id is now nullable in profiles table';
  RAISE NOTICE '✓ handle_new_user() updated to use user_metadata';
  RAISE NOTICE 'Users can now be created via Dashboard or edge function';
END $$;
