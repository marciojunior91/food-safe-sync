-- Migration: Update category RLS policies for role-based management
-- Description: Restrict category creation to owner, manager, and leader_chef only
-- Date: 2025-12-09

-- Drop existing policies for label_categories
DROP POLICY IF EXISTS "Managers and admins can manage categories" ON public.label_categories;
DROP POLICY IF EXISTS "Users can view categories in their organization" ON public.label_categories;

-- Create new policy: All authenticated users can view categories
CREATE POLICY "All users can view categories"
  ON public.label_categories
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL OR 
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Create new policy: Only owner, manager, leader_chef can INSERT categories
CREATE POLICY "Only managers and chefs can create categories"
  ON public.label_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['owner', 'manager', 'leader_chef']::app_role[]) AND
    (
      organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Create new policy: Only owner, manager, leader_chef can UPDATE categories
CREATE POLICY "Only managers and chefs can update categories"
  ON public.label_categories
  FOR UPDATE
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['owner', 'manager', 'leader_chef']::app_role[]) AND
    (
      organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['owner', 'manager', 'leader_chef']::app_role[]) AND
    (
      organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Create new policy: Only owner, manager can DELETE categories
CREATE POLICY "Only owners and managers can delete categories"
  ON public.label_categories
  FOR DELETE
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['owner', 'manager']::app_role[]) AND
    (
      organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Update products policies to allow all authenticated users to create products
DROP POLICY IF EXISTS "Managers and admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can view products in their organization" ON public.products;

CREATE POLICY "All users can view products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "All users can create products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "All users can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    ) AND
    public.has_any_role(auth.uid(), ARRAY['owner', 'manager']::app_role[])
  );

-- Helper function to check if user can manage categories
CREATE OR REPLACE FUNCTION can_manage_categories(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_any_role(p_user_id, ARRAY['owner', 'manager', 'leader_chef']::app_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can manage subcategories
CREATE OR REPLACE FUNCTION can_manage_subcategories(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_any_role(p_user_id, ARRAY['owner', 'manager', 'leader_chef']::app_role[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION can_manage_categories IS 'Returns true if user has permission to create/edit/delete categories (owner, manager, leader_chef)';
COMMENT ON FUNCTION can_manage_subcategories IS 'Returns true if user has permission to create/edit/delete subcategories (owner, manager, leader_chef)';

COMMENT ON POLICY "Only managers and chefs can create categories" ON public.label_categories IS 'Restricts category creation to owner, manager, and leader_chef roles';
COMMENT ON POLICY "All users can create products" ON public.products IS 'All authenticated users can create products, but only within their organization';
