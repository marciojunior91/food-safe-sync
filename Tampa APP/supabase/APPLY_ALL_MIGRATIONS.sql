-- ============================================================
-- LABELING PHASE 1 - ALL MIGRATIONS COMBINED
-- Apply this entire file in Supabase SQL Editor
-- Date: 2025-12-10
-- ============================================================

-- ============================================================
-- MIGRATION 1: Create Subcategories Table
-- ============================================================

-- Create label_subcategories table
CREATE TABLE IF NOT EXISTS public.label_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.label_categories(id) ON DELETE CASCADE,
  organization_id UUID,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique index to handle NULL organization_id properly
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_subcategory_per_category_org 
  ON public.label_subcategories (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.label_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_org_id ON public.label_subcategories(organization_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_display_order ON public.label_subcategories(display_order);
CREATE INDEX IF NOT EXISTS idx_subcategories_name ON public.label_subcategories(name);

-- Add subcategory_id to products table
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.label_subcategories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products(subcategory_id);

-- Enable Row Level Security
ALTER TABLE public.label_subcategories ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view subcategories in their organization or global ones
DROP POLICY IF EXISTS "Users can view subcategories in their organization" ON public.label_subcategories;
CREATE POLICY "Users can view subcategories in their organization"
  ON public.label_subcategories
  FOR SELECT
  USING (
    organization_id IS NULL OR 
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Only managers, leader_chef, and admins can manage subcategories
DROP POLICY IF EXISTS "Managers and chefs can manage subcategories" ON public.label_subcategories;
CREATE POLICY "Managers and chefs can manage subcategories"
  ON public.label_subcategories
  FOR ALL
  USING (
    organization_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.user_id
      WHERE p.user_id = auth.uid()
        AND p.organization_id = label_subcategories.organization_id
        AND ur.role IN ('admin', 'manager', 'leader_chef')
    )
  );

COMMENT ON TABLE public.label_subcategories IS 'Subcategories for better product organization within label_categories';

-- ============================================================
-- MIGRATION 2: Seed Subcategories
-- ============================================================

-- Function to safely insert subcategories
CREATE OR REPLACE FUNCTION insert_subcategory_if_not_exists(
  p_name TEXT,
  p_category_name TEXT,
  p_display_order INTEGER
) RETURNS VOID AS $$
DECLARE
  v_category_id UUID;
BEGIN
  -- Get category ID
  SELECT id INTO v_category_id
  FROM public.label_categories
  WHERE name = p_category_name
  LIMIT 1;

  -- Insert if category exists and subcategory doesn't exist
  IF v_category_id IS NOT NULL THEN
    -- Check if already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.label_subcategories 
      WHERE name = p_name 
        AND category_id = v_category_id 
        AND organization_id IS NULL
    ) THEN
      INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
      VALUES (p_name, v_category_id, NULL, p_display_order);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Seed subcategories (Suflex-style)
DO $$
BEGIN
  -- Proteins
  PERFORM insert_subcategory_if_not_exists('Red Meats', 'Proteins', 10);
  PERFORM insert_subcategory_if_not_exists('Poultry', 'Proteins', 20);
  PERFORM insert_subcategory_if_not_exists('Fish', 'Proteins', 30);
  PERFORM insert_subcategory_if_not_exists('Seafood', 'Proteins', 40);
  PERFORM insert_subcategory_if_not_exists('Eggs', 'Proteins', 50);
  PERFORM insert_subcategory_if_not_exists('Plant-Based Proteins', 'Proteins', 60);

  -- Vegetables
  PERFORM insert_subcategory_if_not_exists('Leafy Greens', 'Vegetables', 10);
  PERFORM insert_subcategory_if_not_exists('Root Vegetables', 'Vegetables', 20);
  PERFORM insert_subcategory_if_not_exists('Cruciferous', 'Vegetables', 30);
  PERFORM insert_subcategory_if_not_exists('Nightshades', 'Vegetables', 40);
  PERFORM insert_subcategory_if_not_exists('Alliums', 'Vegetables', 50);
  PERFORM insert_subcategory_if_not_exists('Squashes', 'Vegetables', 60);

  -- Dairy
  PERFORM insert_subcategory_if_not_exists('Milk', 'Dairy', 10);
  PERFORM insert_subcategory_if_not_exists('Cheese', 'Dairy', 20);
  PERFORM insert_subcategory_if_not_exists('Yogurt', 'Dairy', 30);
  PERFORM insert_subcategory_if_not_exists('Butter & Cream', 'Dairy', 40);
  PERFORM insert_subcategory_if_not_exists('Plant-Based Dairy', 'Dairy', 50);

  -- Grains
  PERFORM insert_subcategory_if_not_exists('Rice', 'Grains', 10);
  PERFORM insert_subcategory_if_not_exists('Pasta', 'Grains', 20);
  PERFORM insert_subcategory_if_not_exists('Bread', 'Grains', 30);
  PERFORM insert_subcategory_if_not_exists('Wheat Products', 'Grains', 40);
  PERFORM insert_subcategory_if_not_exists('Gluten-Free Grains', 'Grains', 50);

  -- Fruits
  PERFORM insert_subcategory_if_not_exists('Citrus', 'Fruits', 10);
  PERFORM insert_subcategory_if_not_exists('Berries', 'Fruits', 20);
  PERFORM insert_subcategory_if_not_exists('Stone Fruits', 'Fruits', 30);
  PERFORM insert_subcategory_if_not_exists('Tropical', 'Fruits', 40);
  PERFORM insert_subcategory_if_not_exists('Melons', 'Fruits', 50);

  -- Sauces & Condiments
  PERFORM insert_subcategory_if_not_exists('Hot Sauces', 'Sauces & Condiments', 10);
  PERFORM insert_subcategory_if_not_exists('Dressings', 'Sauces & Condiments', 20);
  PERFORM insert_subcategory_if_not_exists('Marinades', 'Sauces & Condiments', 30);
  PERFORM insert_subcategory_if_not_exists('Vinegars', 'Sauces & Condiments', 40);
  PERFORM insert_subcategory_if_not_exists('Oils', 'Sauces & Condiments', 50);

  -- Spices & Herbs
  PERFORM insert_subcategory_if_not_exists('Fresh Herbs', 'Spices & Herbs', 10);
  PERFORM insert_subcategory_if_not_exists('Dried Herbs', 'Spices & Herbs', 20);
  PERFORM insert_subcategory_if_not_exists('Ground Spices', 'Spices & Herbs', 30);
  PERFORM insert_subcategory_if_not_exists('Whole Spices', 'Spices & Herbs', 40);
  PERFORM insert_subcategory_if_not_exists('Spice Blends', 'Spices & Herbs', 50);

  -- Beverages
  PERFORM insert_subcategory_if_not_exists('Juices', 'Beverages', 10);
  PERFORM insert_subcategory_if_not_exists('Sodas', 'Beverages', 20);
  PERFORM insert_subcategory_if_not_exists('Coffee & Tea', 'Beverages', 30);
  PERFORM insert_subcategory_if_not_exists('Alcoholic', 'Beverages', 40);
  PERFORM insert_subcategory_if_not_exists('Water', 'Beverages', 50);

  -- Desserts
  PERFORM insert_subcategory_if_not_exists('Cakes', 'Desserts', 10);
  PERFORM insert_subcategory_if_not_exists('Pastries', 'Desserts', 20);
  PERFORM insert_subcategory_if_not_exists('Ice Cream', 'Desserts', 30);
  PERFORM insert_subcategory_if_not_exists('Cookies', 'Desserts', 40);
  PERFORM insert_subcategory_if_not_exists('Puddings', 'Desserts', 50);

  -- Prepared Foods
  PERFORM insert_subcategory_if_not_exists('Soups', 'Prepared Foods', 10);
  PERFORM insert_subcategory_if_not_exists('Salads', 'Prepared Foods', 20);
  PERFORM insert_subcategory_if_not_exists('Sandwiches', 'Prepared Foods', 30);
  PERFORM insert_subcategory_if_not_exists('Entrees', 'Prepared Foods', 40);
  PERFORM insert_subcategory_if_not_exists('Sides', 'Prepared Foods', 50);
END $$;

-- Drop the helper function
DROP FUNCTION IF EXISTS insert_subcategory_if_not_exists(TEXT, TEXT, INTEGER);

-- ============================================================
-- MIGRATION 3: Create Allergens Tables
-- ============================================================

-- Enable pg_trgm extension for fuzzy matching (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create allergens table
CREATE TABLE IF NOT EXISTS public.allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('critical', 'warning', 'info')),
  is_common BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create product_allergens junction table
CREATE TABLE IF NOT EXISTS public.product_allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES public.allergens(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate allergen assignments
  CONSTRAINT unique_product_allergen UNIQUE (product_id, allergen_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_allergens_severity ON public.allergens(severity);
CREATE INDEX IF NOT EXISTS idx_allergens_is_common ON public.allergens(is_common);
CREATE INDEX IF NOT EXISTS idx_allergens_name ON public.allergens USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_product_allergens_product_id ON public.product_allergens(product_id);
CREATE INDEX IF NOT EXISTS idx_product_allergens_allergen_id ON public.product_allergens(allergen_id);

-- Enable Row Level Security
ALTER TABLE public.allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_allergens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for allergens (everyone can view, managers can manage)
DROP POLICY IF EXISTS "Everyone can view allergens" ON public.allergens;
CREATE POLICY "Everyone can view allergens"
  ON public.allergens
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Managers can manage allergens" ON public.allergens;
CREATE POLICY "Managers can manage allergens"
  ON public.allergens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager', 'leader_chef')
    )
  );

-- RLS Policies for product_allergens
DROP POLICY IF EXISTS "Users can view product allergens" ON public.product_allergens;
CREATE POLICY "Users can view product allergens"
  ON public.product_allergens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.profiles prof ON prof.organization_id = p.organization_id
      WHERE p.id = product_allergens.product_id
        AND prof.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage product allergens" ON public.product_allergens;
CREATE POLICY "Users can manage product allergens"
  ON public.product_allergens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.profiles prof ON prof.organization_id = p.organization_id
      WHERE p.id = product_allergens.product_id
        AND prof.user_id = auth.uid()
    )
  );

-- Helper function: Get product allergens
CREATE OR REPLACE FUNCTION get_product_allergens(p_product_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  icon TEXT,
  severity TEXT,
  is_common BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.name, a.icon, a.severity, a.is_common
  FROM public.allergens a
  JOIN public.product_allergens pa ON pa.allergen_id = a.id
  WHERE pa.product_id = p_product_id
  ORDER BY 
    CASE a.severity
      WHEN 'critical' THEN 1
      WHEN 'warning' THEN 2
      WHEN 'info' THEN 3
    END,
    a.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if product has critical allergens
CREATE OR REPLACE FUNCTION has_critical_allergens(p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.product_allergens pa
    JOIN public.allergens a ON a.id = pa.allergen_id
    WHERE pa.product_id = p_product_id
      AND a.severity = 'critical'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.allergens IS 'FDA/EU compliant allergen list for food safety';
COMMENT ON TABLE public.product_allergens IS 'Junction table linking products to allergens';

-- ============================================================
-- MIGRATION 4: Seed Allergens
-- ============================================================

-- Seed FDA Top 9 + EU Top 14 Allergens
INSERT INTO public.allergens (name, icon, severity, is_common) VALUES
  -- Critical Allergens (Life-threatening)
  ('Peanuts', '🥜', 'critical', true),
  ('Tree Nuts', '🌰', 'critical', true),
  ('Shellfish', '🦐', 'critical', true),
  ('Fish', '🐟', 'critical', true),
  
  -- Warning Allergens (Serious reactions)
  ('Milk', '🥛', 'warning', true),
  ('Eggs', '🥚', 'warning', true),
  ('Wheat/Gluten', '🌾', 'warning', true),
  ('Soy', '🫘', 'warning', true),
  ('Sesame', '🌿', 'warning', true),
  
  -- Info Allergens (Moderate reactions)
  ('Celery', '🥬', 'info', false),
  ('Mustard', '🟡', 'info', false),
  ('Lupin', '🫘', 'info', false),
  ('Sulfites/Sulfur Dioxide', '⚗️', 'info', true),
  ('Molluscs', '🦑', 'info', false),
  
  -- Additional Common Allergens
  ('Corn', '🌽', 'info', false),
  ('Garlic', '🧄', 'info', false),
  ('Onions', '🧅', 'info', false),
  ('Tomatoes', '🍅', 'info', false),
  ('Citrus', '🍊', 'info', false),
  ('Strawberries', '🍓', 'info', false),
  ('Bananas', '🍌', 'info', false),
  ('Chocolate', '🍫', 'info', false),
  ('Coffee', '☕', 'info', false),
  ('Alcohol', '🍷', 'info', false)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- MIGRATION 5: Product Validation Functions
-- ============================================================

-- Function to check for duplicate products
CREATE OR REPLACE FUNCTION check_duplicate_product(
  p_name TEXT,
  p_category_id UUID,
  p_organization_id UUID DEFAULT NULL,
  p_exclude_product_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_duplicate BOOLEAN,
  product_id UUID,
  product_name TEXT,
  category_name TEXT,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true AS is_duplicate,
    p.id AS product_id,
    p.name AS product_name,
    c.name AS category_name,
    similarity(LOWER(p.name), LOWER(p_name)) AS similarity_score
  FROM public.products p
  LEFT JOIN public.label_categories c ON c.id = p.category_id
  WHERE 
    (p_organization_id IS NULL OR p.organization_id = p_organization_id)
    AND (p_exclude_product_id IS NULL OR p.id != p_exclude_product_id)
    AND (
      -- Exact match (case-insensitive)
      LOWER(p.name) = LOWER(p_name)
      OR
      -- High similarity match (> 0.7)
      similarity(LOWER(p.name), LOWER(p_name)) > 0.7
    )
  ORDER BY similarity_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suggest existing products
CREATE OR REPLACE FUNCTION suggest_existing_products(
  p_partial_name TEXT,
  p_organization_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  category_name TEXT,
  subcategory_name TEXT,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS product_id,
    p.name AS product_name,
    c.name AS category_name,
    sc.name AS subcategory_name,
    similarity(LOWER(p.name), LOWER(p_partial_name)) AS similarity_score
  FROM public.products p
  LEFT JOIN public.label_categories c ON c.id = p.category_id
  LEFT JOIN public.label_subcategories sc ON sc.id = p.subcategory_id
  WHERE 
    (p_organization_id IS NULL OR p.organization_id = p_organization_id)
    AND (
      p.name ILIKE '%' || p_partial_name || '%'
      OR
      similarity(LOWER(p.name), LOWER(p_partial_name)) > 0.3
    )
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get full product details
CREATE OR REPLACE FUNCTION get_product_full_details(p_product_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'id', p.id,
    'name', p.name,
    'category', json_build_object('id', c.id, 'name', c.name),
    'subcategory', json_build_object('id', sc.id, 'name', sc.name),
    'measuring_unit', json_build_object('id', mu.id, 'name', mu.name, 'abbreviation', mu.abbreviation),
    'allergens', (
      SELECT json_agg(json_build_object('id', a.id, 'name', a.name, 'severity', a.severity))
      FROM public.product_allergens pa
      JOIN public.allergens a ON a.id = pa.allergen_id
      WHERE pa.product_id = p.id
    ),
    'created_at', p.created_at,
    'updated_at', p.updated_at
  ) INTO v_result
  FROM public.products p
  LEFT JOIN public.label_categories c ON c.id = p.category_id
  LEFT JOIN public.label_subcategories sc ON sc.id = p.subcategory_id
  LEFT JOIN public.measuring_units mu ON mu.id = p.measuring_unit_id
  WHERE p.id = p_product_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to validate product uniqueness before insert/update
CREATE OR REPLACE FUNCTION validate_product_unique()
RETURNS TRIGGER AS $$
DECLARE
  v_duplicate RECORD;
BEGIN
  -- Check for duplicates
  SELECT * INTO v_duplicate
  FROM check_duplicate_product(
    NEW.name,
    NEW.category_id,
    NEW.organization_id,
    NEW.id
  )
  LIMIT 1;
  
  -- If duplicate found, raise warning but allow insert
  -- (You can change to EXCEPTION if you want to block duplicates)
  IF FOUND THEN
    RAISE WARNING 'Potential duplicate product detected: % (similarity: %)', 
      v_duplicate.product_name, 
      v_duplicate.similarity_score;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS validate_product_unique_trigger ON public.products;

-- Create trigger
CREATE TRIGGER validate_product_unique_trigger
  BEFORE INSERT OR UPDATE OF name, category_id
  ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_unique();

COMMENT ON FUNCTION check_duplicate_product IS 'Check if product name already exists (exact or similar)';
COMMENT ON FUNCTION suggest_existing_products IS 'Suggest existing products based on partial name match';
COMMENT ON FUNCTION get_product_full_details IS 'Get complete product information including allergens';

-- ============================================================
-- MIGRATION 6: Update Category Permissions
-- ============================================================

-- Helper function to check if user can manage categories
CREATE OR REPLACE FUNCTION can_manage_categories(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id
      AND role IN ('admin', 'manager', 'leader_chef')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can manage subcategories
CREATE OR REPLACE FUNCTION can_manage_subcategories(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN can_manage_categories(p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for label_categories
DROP POLICY IF EXISTS "Everyone can view categories" ON public.label_categories;
CREATE POLICY "Everyone can view categories"
  ON public.label_categories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only elevated roles can create categories" ON public.label_categories;
CREATE POLICY "Only elevated roles can create categories"
  ON public.label_categories
  FOR INSERT
  WITH CHECK (can_manage_categories());

DROP POLICY IF EXISTS "Only elevated roles can update categories" ON public.label_categories;
CREATE POLICY "Only elevated roles can update categories"
  ON public.label_categories
  FOR UPDATE
  USING (can_manage_categories());

DROP POLICY IF EXISTS "Only elevated roles can delete categories" ON public.label_categories;
CREATE POLICY "Only elevated roles can delete categories"
  ON public.label_categories
  FOR DELETE
  USING (can_manage_categories());

COMMENT ON FUNCTION can_manage_categories IS 'Check if user has permission to manage categories (admin/manager/leader_chef only)';
COMMENT ON FUNCTION can_manage_subcategories IS 'Check if user has permission to manage subcategories (admin/manager/leader_chef only)';

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check if tables were created
SELECT 
  tablename,
  schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('label_subcategories', 'allergens', 'product_allergens')
ORDER BY tablename;

-- Check subcategories count
SELECT 
  c.name AS category,
  COUNT(sc.id) AS subcategory_count
FROM public.label_categories c
LEFT JOIN public.label_subcategories sc ON sc.category_id = c.id
GROUP BY c.name
ORDER BY c.name;

-- Check allergens count
SELECT 
  severity,
  COUNT(*) AS count
FROM public.allergens
GROUP BY severity
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    WHEN 'info' THEN 3
  END;

-- Check if products table has subcategory_id column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'products' 
  AND column_name = 'subcategory_id';

-- ============================================================
-- END OF MIGRATIONS
-- ============================================================

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '✅ All migrations applied successfully!';
  RAISE NOTICE '📊 Check verification queries above for details';
END $$;
