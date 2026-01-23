-- Fix allergens RLS policy to allow anon access
-- Allergens are public reference data, should be accessible to everyone

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Anyone can view allergens" ON public.allergens;

-- Create new policy that allows both authenticated AND anon users
CREATE POLICY "Public can view allergens"
  ON public.allergens
  FOR SELECT
  USING (true);

-- Comment for documentation
COMMENT ON POLICY "Public can view allergens" ON public.allergens IS 
  'Allergens are public reference data (FDA/EU standards). Allow read access for all users including anon.';
