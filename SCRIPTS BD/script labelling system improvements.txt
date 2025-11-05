-- Create tables for labeling system improvements

-- Label categories table
CREATE TABLE public.label_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  organization_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.label_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view categories in their organization"
ON public.label_categories
FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Managers and admins can manage categories"
ON public.label_categories
FOR ALL
USING (
  (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
);

-- Products table
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category_id uuid REFERENCES public.label_categories(id) ON DELETE SET NULL,
  organization_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products in their organization"
ON public.products
FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Managers and admins can manage products"
ON public.products
FOR ALL
USING (
  (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
);

-- Measuring units table
CREATE TABLE public.measuring_units (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  abbreviation text NOT NULL,
  organization_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.measuring_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view units in their organization"
ON public.measuring_units
FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Managers and admins can manage units"
ON public.measuring_units
FOR ALL
USING (
  (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
);

-- Insert some default measuring units
INSERT INTO public.measuring_units (name, abbreviation, organization_id)
VALUES 
  ('Kilograms', 'kg', NULL),
  ('Grams', 'g', NULL),
  ('Liters', 'L', NULL),
  ('Milliliters', 'mL', NULL),
  ('Servings', 'servings', NULL),
  ('Portions', 'portions', NULL),
  ('Pieces', 'pcs', NULL);

-- Insert some default categories
INSERT INTO public.label_categories (name, organization_id)
VALUES 
  ('Prepared Foods', NULL),
  ('Raw Ingredients', NULL),
  ('Sauces & Condiments', NULL),
  ('Desserts', NULL),
  ('Bakery', NULL),
  ('Beverages', NULL);