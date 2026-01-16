-- Create product_subcategories table for hierarchical category structure (SUFLEX-based)
-- Migration: 20251205000000_create_product_subcategories

-- Create the product_subcategories table
CREATE TABLE IF NOT EXISTS public.product_subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_subcategory_id UUID REFERENCES public.product_subcategories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT unique_subcategory_per_category UNIQUE(category_id, name)
);

-- Add subcategory_id column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.product_subcategories(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON public.product_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_parent ON public.product_subcategories(parent_subcategory_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_active ON public.product_subcategories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products(subcategory_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_subcategory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_subcategory_updated_at
  BEFORE UPDATE ON public.product_subcategories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_subcategory_updated_at();

-- Enable Row Level Security
ALTER TABLE public.product_subcategories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_subcategories
-- All authenticated users can view active subcategories
CREATE POLICY "Subcategories are viewable by authenticated users"
ON public.product_subcategories FOR SELECT
TO authenticated
USING (is_active = true OR auth.uid() IS NOT NULL);

-- Only owner, manager, and leader_chef can insert subcategories
CREATE POLICY "Subcategories can be created by authorized roles"
ON public.product_subcategories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('owner', 'manager', 'leader_chef')
  )
);

-- Only owner, manager, and leader_chef can update subcategories
CREATE POLICY "Subcategories can be updated by authorized roles"
ON public.product_subcategories FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('owner', 'manager', 'leader_chef')
  )
);

-- Only owner and manager can delete subcategories
CREATE POLICY "Subcategories can be deleted by owner or manager"
ON public.product_subcategories FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('owner', 'manager')
  )
);

-- Add helpful comments
COMMENT ON TABLE public.product_subcategories IS 'Hierarchical subcategories for products based on SUFLEX structure';
COMMENT ON COLUMN public.product_subcategories.parent_subcategory_id IS 'Parent subcategory for hierarchical structure (null for top-level)';
COMMENT ON COLUMN public.product_subcategories.display_order IS 'Order for displaying subcategories in UI';
COMMENT ON COLUMN public.product_subcategories.is_active IS 'Soft delete flag - inactive subcategories are hidden from users';

-- Insert some example subcategories (optional - can be removed if not needed)
-- Based on common food service subcategory structure
INSERT INTO public.product_subcategories (category_id, name, description, display_order)
SELECT 
  c.id,
  'Dairy Products',
  'Milk, cheese, yogurt, and other dairy items',
  1
FROM public.product_categories c
WHERE c.name = 'Refrigerated'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.product_subcategories (category_id, name, description, display_order)
SELECT 
  c.id,
  'Fresh Vegetables',
  'Raw vegetables requiring refrigeration',
  2
FROM public.product_categories c
WHERE c.name = 'Refrigerated'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.product_subcategories (category_id, name, description, display_order)
SELECT 
  c.id,
  'Fresh Fruits',
  'Raw fruits requiring refrigeration',
  3
FROM public.product_categories c
WHERE c.name = 'Refrigerated'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.product_subcategories (category_id, name, description, display_order)
SELECT 
  c.id,
  'Proteins',
  'Meat, poultry, fish, and seafood',
  4
FROM public.product_categories c
WHERE c.name = 'Refrigerated'
ON CONFLICT (category_id, name) DO NOTHING;
