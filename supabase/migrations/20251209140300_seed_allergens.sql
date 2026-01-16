-- Migration: Seed default allergens (FDA/EU Top 14)
-- Description: Insert FDA and EU recognized major allergens
-- Date: 2025-12-09

-- Insert the FDA/EU recognized top 14 allergens
INSERT INTO public.allergens (name, description, icon, severity, is_common)
VALUES 
  -- Critical allergens (most severe/common reactions)
  ('Peanuts', 'Ground nuts (Arachis hypogaea)', '🥜', 'critical', true),
  ('Tree Nuts', 'Almonds, cashews, walnuts, hazelnuts, etc.', '🌰', 'critical', true),
  ('Shellfish', 'Crustaceans: shrimp, crab, lobster', '🦐', 'critical', true),
  ('Fish', 'All fish species', '🐟', 'critical', true),
  
  -- Warning level allergens (common allergens)
  ('Milk', 'Dairy products and lactose', '🥛', 'warning', true),
  ('Eggs', 'Chicken eggs and egg products', '🥚', 'warning', true),
  ('Wheat/Gluten', 'Wheat, barley, rye, and gluten-containing grains', '🌾', 'warning', true),
  ('Soy', 'Soybeans and soy products', '🫘', 'warning', true),
  ('Sesame', 'Sesame seeds and sesame oil', '🌱', 'warning', true),
  
  -- Info level allergens (less common but still FDA/EU recognized)
  ('Celery', 'Celery and celeriac', '🥬', 'info', true),
  ('Mustard', 'Mustard seeds and mustard products', '🌭', 'info', true),
  ('Sulphites', 'Sulfur dioxide and sulphites (>10mg/kg)', '⚗️', 'info', true),
  ('Lupin', 'Lupin beans and lupin flour', '🫘', 'info', true),
  ('Molluscs', 'Snails, squid, mussels, oysters, clams', '🦪', 'info', true)
ON CONFLICT (name) DO NOTHING;

-- Add some additional common allergens (not FDA/EU top 14)
INSERT INTO public.allergens (name, description, icon, severity, is_common)
VALUES 
  ('Corn', 'Corn and corn-derived products', '🌽', 'info', false),
  ('Garlic', 'Garlic and garlic powder', '🧄', 'info', false),
  ('Onion', 'Onions and onion powder', '🧅', 'info', false),
  ('Coconut', 'Coconut and coconut products', '🥥', 'info', false),
  ('Nightshades', 'Tomatoes, peppers, eggplant, potatoes', '🍅', 'info', false),
  ('Citrus', 'Oranges, lemons, limes, grapefruit', '🍊', 'info', false),
  ('Strawberries', 'Strawberries and strawberry products', '🍓', 'info', false),
  ('Kiwi', 'Kiwi fruit', '🥝', 'info', false),
  ('Avocado', 'Avocado and avocado products', '🥑', 'info', false),
  ('Banana', 'Bananas', '🍌', 'info', false)
ON CONFLICT (name) DO NOTHING;

-- Create a helpful view for common allergens
CREATE OR REPLACE VIEW public.common_allergens AS
SELECT 
  id,
  name,
  description,
  icon,
  severity,
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    WHEN 'info' THEN 3
    ELSE 4
  END as sort_order
FROM public.allergens
WHERE is_common = true
ORDER BY sort_order, name;

COMMENT ON VIEW public.common_allergens IS 'FDA/EU Top 14 major allergens, sorted by severity';

-- Create a helper function to check if a product has critical allergens
CREATE OR REPLACE FUNCTION has_critical_allergens(p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.product_allergens pa
    INNER JOIN public.allergens a ON pa.allergen_id = a.id
    WHERE pa.product_id = p_product_id
      AND a.severity = 'critical'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_critical_allergens IS 'Returns true if product contains any critical allergens (peanuts, tree nuts, shellfish, fish)';

-- Add comment about allergen standards
COMMENT ON TABLE public.allergens IS 'FDA (US) and EU Regulation 1169/2011 compliant allergen database. Includes all 14 major allergens recognized by FDA/EU food labeling laws.';
