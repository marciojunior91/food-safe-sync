-- Create printed_labels table for history and stats
CREATE TABLE IF NOT EXISTS public.printed_labels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    category_id UUID REFERENCES public.label_categories(id),
    category_name TEXT,
    prepared_by UUID REFERENCES auth.users(id),
    prepared_by_name TEXT,
    prep_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    quantity TEXT,
    unit TEXT,
    condition TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for printed_labels
ALTER TABLE public.printed_labels ENABLE ROW LEVEL SECURITY;

-- Policies for printed_labels
CREATE POLICY "Enable read access for authenticated users" ON public.printed_labels
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.printed_labels
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create label_templates table
CREATE TABLE IF NOT EXISTS public.label_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    zpl_code TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for label_templates
ALTER TABLE public.label_templates ENABLE ROW LEVEL SECURITY;

-- Policies for label_templates
CREATE POLICY "Enable read access for authenticated users" ON public.label_templates
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable all access for authenticated users" ON public.label_templates
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Insert default templates
INSERT INTO public.label_templates (name, description, zpl_code, is_default)
VALUES 
    ('Default', 'Standard food label with date and user', '^XA^FO50,50^ADN,36,20^FD${productName}^FS^FO50,100^ADN,18,10^FDCategory: ${categoryName}^FS^FO50,150^ADN,18,10^FDCondition: ${condition}^FS^FO50,200^ADN,18,10^FDPrep: ${prepDate}^FS^FO50,250^ADN,18,10^FDExp: ${expiryDate}^FS^FO50,300^ADN,18,10^FDBy: ${preparedByName}^FS^XZ', true),
    ('Blank', 'Empty template for custom use', '^XA^XZ', false),
    ('Recipe', 'Template for recipe ingredients', '^XA^FO50,50^ADN,36,20^FD${productName}^FS^FO50,100^ADN,18,10^FDRecipe Item^FS^XZ', false);
