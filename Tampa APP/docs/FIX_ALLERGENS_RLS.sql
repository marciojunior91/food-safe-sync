-- Quick Fix: Allow anon users to read allergens
-- Run this directly in Supabase SQL Editor

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Anyone can view allergens" ON public.allergens;

-- Create new policy that allows everyone (including anon)
CREATE POLICY "Public can view allergens"
  ON public.allergens
  FOR SELECT
  USING (true);
