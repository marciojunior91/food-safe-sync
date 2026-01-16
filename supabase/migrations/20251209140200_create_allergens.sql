-- Migration: Create allergens management system
-- Description: Add allergen support for FDA/EU compliance
-- Date: 2025-12-09

-- Create allergens table
CREATE TABLE IF NOT EXISTS public.allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- emoji or icon identifier
  severity TEXT CHECK (severity IN ('critical', 'warning', 'info')),
  is_common BOOLEAN DEFAULT true, -- FDA/EU common allergens
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create product_allergens junction table
CREATE TABLE IF NOT EXISTS public.product_allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES public.allergens(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure unique allergen per product
  CONSTRAINT unique_product_allergen UNIQUE (product_id, allergen_id)
);

-- Add allergens array to printed_labels for historical tracking
ALTER TABLE public.printed_labels 
  ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX idx_allergens_name ON public.allergens(name);
CREATE INDEX idx_allergens_is_common ON public.allergens(is_common);
CREATE INDEX idx_product_allergens_product ON public.product_allergens(product_id);
CREATE INDEX idx_product_allergens_allergen ON public.product_allergens(allergen_id);
CREATE INDEX idx_printed_labels_allergens ON public.printed_labels USING GIN(allergens);

-- Enable Row Level Security
ALTER TABLE public.allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_allergens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can view allergens (public data)
CREATE POLICY "Anyone can view allergens"
  ON public.allergens
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Only managers can create/update allergens
CREATE POLICY "Managers can manage allergens"
  ON public.allergens
  FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['owner', 'manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['owner', 'manager']::app_role[]));

-- RLS Policy: Users can view product allergens
CREATE POLICY "Users can view product allergens"
  ON public.product_allergens
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Users can manage allergens for products in their organization
CREATE POLICY "Users can manage product allergens"
  ON public.product_allergens
  FOR ALL
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

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_allergens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_allergens_timestamp
  BEFORE UPDATE ON public.allergens
  FOR EACH ROW
  EXECUTE FUNCTION update_allergens_updated_at();

-- Helper function to get allergens for a product
CREATE OR REPLACE FUNCTION get_product_allergens(p_product_id UUID)
RETURNS TABLE (
  allergen_id UUID,
  allergen_name TEXT,
  severity TEXT,
  icon TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.severity,
    a.icon
  FROM public.allergens a
  INNER JOIN public.product_allergens pa ON pa.allergen_id = a.id
  WHERE pa.product_id = p_product_id
  ORDER BY 
    CASE a.severity
      WHEN 'critical' THEN 1
      WHEN 'warning' THEN 2
      WHEN 'info' THEN 3
      ELSE 4
    END,
    a.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.allergens IS 'FDA/EU compliant allergen database';
COMMENT ON TABLE public.product_allergens IS 'Junction table linking products to their allergens';
COMMENT ON COLUMN public.allergens.severity IS 'critical: Major allergens (gluten, peanuts), warning: Common allergens, info: Minor allergens';
COMMENT ON COLUMN public.allergens.is_common IS 'True for FDA/EU recognized major allergens (top 14)';
COMMENT ON FUNCTION get_product_allergens IS 'Returns all allergens for a product, ordered by severity';
