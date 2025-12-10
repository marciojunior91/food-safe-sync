-- Migration: Create label_subcategories table (Suflex-style hierarchy)
-- Description: Add subcategory support for better product organization
-- Date: 2025-12-09

-- Create label_subcategories table
CREATE TABLE IF NOT EXISTS public.label_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.label_categories(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure unique subcategory names within a category per organization
  CONSTRAINT unique_subcategory_per_category_org 
    UNIQUE (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- Add indexes for performance
CREATE INDEX idx_subcategories_category_id ON public.label_subcategories(category_id);
CREATE INDEX idx_subcategories_org_id ON public.label_subcategories(organization_id);
CREATE INDEX idx_subcategories_display_order ON public.label_subcategories(display_order);
CREATE INDEX idx_subcategories_name ON public.label_subcategories(name);

-- Add subcategory_id to products table
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.label_subcategories(id) ON DELETE SET NULL;

CREATE INDEX idx_products_subcategory_id ON public.products(subcategory_id);

-- Enable Row Level Security
ALTER TABLE public.label_subcategories ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view subcategories in their organization or global ones (org_id = NULL)
CREATE POLICY "Users can view subcategories in their organization"
  ON public.label_subcategories
  FOR SELECT
  USING (
    organization_id IS NULL OR 
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Only managers, leader_chef, and owners can create/update/delete subcategories
CREATE POLICY "Managers and chefs can manage subcategories"
  ON public.label_subcategories
  FOR ALL
  USING (
    (
      organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      ) OR organization_id IS NULL
    ) AND
    public.has_any_role(auth.uid(), ARRAY['owner', 'manager', 'leader_chef']::app_role[])
  )
  WITH CHECK (
    (
      organization_id IN (
        SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
      ) OR organization_id IS NULL
    ) AND
    public.has_any_role(auth.uid(), ARRAY['owner', 'manager', 'leader_chef']::app_role[])
  );

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_label_subcategories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_label_subcategories_timestamp
  BEFORE UPDATE ON public.label_subcategories
  FOR EACH ROW
  EXECUTE FUNCTION update_label_subcategories_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.label_subcategories IS 'Subcategories for label products following Suflex-style hierarchical organization';
COMMENT ON COLUMN public.label_subcategories.display_order IS 'Order for displaying subcategories within a category';
COMMENT ON COLUMN public.label_subcategories.organization_id IS 'NULL means global/default subcategory available to all organizations';
