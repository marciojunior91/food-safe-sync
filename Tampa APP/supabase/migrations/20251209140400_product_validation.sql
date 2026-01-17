-- Migration: Add product duplicate validation and suggestions
-- Description: Prevent duplicate products and suggest existing ones
-- Date: 2025-12-09

-- Function to check if product name exists (exact match)
CREATE OR REPLACE FUNCTION check_duplicate_product(
  p_name TEXT,
  p_category_id UUID,
  p_organization_id UUID,
  p_exclude_product_id UUID DEFAULT NULL
)
RETURNS TABLE (
  exists BOOLEAN,
  existing_product_id UUID,
  existing_category_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE as exists,
    p.id as existing_product_id,
    lc.name as existing_category_name
  FROM public.products p
  LEFT JOIN public.label_categories lc ON p.category_id = lc.id
  WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(p_name))
    AND p.organization_id = p_organization_id
    AND (p_exclude_product_id IS NULL OR p.id != p_exclude_product_id)
  LIMIT 1;
  
  -- If no exact match found, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suggest similar products (fuzzy matching)
CREATE OR REPLACE FUNCTION suggest_existing_products(
  p_name TEXT,
  p_organization_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  category_id UUID,
  category_name TEXT,
  subcategory_id UUID,
  subcategory_name TEXT,
  similarity_score FLOAT
) AS $$
BEGIN
  -- Enable pg_trgm extension if not already enabled
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    lc.id as category_id,
    lc.name as category_name,
    ls.id as subcategory_id,
    ls.name as subcategory_name,
    SIMILARITY(LOWER(p.name), LOWER(p_name)) as similarity_score
  FROM public.products p
  LEFT JOIN public.label_categories lc ON p.category_id = lc.id
  LEFT JOIN public.label_subcategories ls ON p.subcategory_id = ls.id
  WHERE p.organization_id = p_organization_id
    AND SIMILARITY(LOWER(p.name), LOWER(p_name)) > 0.3
  ORDER BY similarity_score DESC, p.name
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate product before insert/update
CREATE OR REPLACE FUNCTION validate_product_unique()
RETURNS TRIGGER AS $$
DECLARE
  v_duplicate_exists BOOLEAN;
  v_duplicate_id UUID;
  v_duplicate_category TEXT;
BEGIN
  -- Check for duplicate
  SELECT check.exists, check.existing_product_id, check.existing_category_name
  INTO v_duplicate_exists, v_duplicate_id, v_duplicate_category
  FROM check_duplicate_product(
    NEW.name, 
    NEW.category_id, 
    NEW.organization_id,
    NEW.id  -- Exclude current product on UPDATE
  ) as check;
  
  -- If duplicate found, raise exception with details
  IF v_duplicate_exists THEN
    RAISE EXCEPTION 'Product "%" already exists in category "%". Product ID: %', 
      NEW.name, 
      v_duplicate_category,
      v_duplicate_id
    USING HINT = 'Use the existing product or choose a different name';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate products on insert/update
-- NOTE: This trigger can be disabled if you want to handle validation in the application layer
CREATE TRIGGER validate_product_unique_trigger
  BEFORE INSERT OR UPDATE OF name, category_id ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_unique();

-- Function to get product details with allergens (for suggestions)
CREATE OR REPLACE FUNCTION get_product_full_details(p_product_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category_id UUID,
  category_name TEXT,
  subcategory_id UUID,
  subcategory_name TEXT,
  measuring_unit_id UUID,
  unit_name TEXT,
  unit_abbreviation TEXT,
  allergen_names TEXT[],
  allergen_count INTEGER,
  has_critical_allergens BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    lc.id as category_id,
    lc.name as category_name,
    ls.id as subcategory_id,
    ls.name as subcategory_name,
    mu.id as measuring_unit_id,
    mu.name as unit_name,
    mu.abbreviation as unit_abbreviation,
    ARRAY_AGG(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL) as allergen_names,
    COUNT(DISTINCT pa.allergen_id)::INTEGER as allergen_count,
    bool_or(a.severity = 'critical') as has_critical_allergens
  FROM public.products p
  LEFT JOIN public.label_categories lc ON p.category_id = lc.id
  LEFT JOIN public.label_subcategories ls ON p.subcategory_id = ls.id
  LEFT JOIN public.measuring_units mu ON p.measuring_unit_id = mu.id
  LEFT JOIN public.product_allergens pa ON pa.product_id = p.id
  LEFT JOIN public.allergens a ON pa.allergen_id = a.id
  WHERE p.id = p_product_id
  GROUP BY p.id, p.name, lc.id, lc.name, ls.id, ls.name, mu.id, mu.name, mu.abbreviation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for faster similarity searches
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (LOWER(name) gin_trgm_ops);

-- Add comments
COMMENT ON FUNCTION check_duplicate_product IS 'Checks if a product name already exists in the organization (exact match, case-insensitive)';
COMMENT ON FUNCTION suggest_existing_products IS 'Returns similar products using fuzzy matching (pg_trgm). Useful for preventing duplicates and suggesting existing products.';
COMMENT ON FUNCTION validate_product_unique IS 'Trigger function that prevents duplicate product creation within an organization';
COMMENT ON FUNCTION get_product_full_details IS 'Returns complete product information including category, subcategory, unit, and allergens';
