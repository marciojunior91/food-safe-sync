-- Fix RLS policies on product_allergens to avoid 42501 permission denied errors
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view product allergens" ON public.product_allergens;
DROP POLICY IF EXISTS "Users can manage product allergens" ON public.product_allergens;

-- Recreate as separate permissive policies for each operation

-- SELECT: any authenticated user can view
CREATE POLICY "product_allergens_select"
  ON public.product_allergens
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: any authenticated user whose org owns the product
CREATE POLICY "product_allergens_insert"
  ON public.product_allergens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    product_id IN (
      SELECT id FROM public.products 
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- UPDATE: any authenticated user whose org owns the product
CREATE POLICY "product_allergens_update"
  ON public.product_allergens
  FOR UPDATE
  TO authenticated
  USING (
    product_id IN (
      SELECT id FROM public.products 
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT id FROM public.products 
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- DELETE: any authenticated user whose org owns the product
CREATE POLICY "product_allergens_delete"
  ON public.product_allergens
  FOR DELETE
  TO authenticated
  USING (
    product_id IN (
      SELECT id FROM public.products 
      WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );
