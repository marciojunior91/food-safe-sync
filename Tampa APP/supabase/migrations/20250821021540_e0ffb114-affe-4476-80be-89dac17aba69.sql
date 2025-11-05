-- Add hold_time column to recipes table for Time Rules feature
ALTER TABLE public.recipes 
ADD COLUMN hold_time_hours integer DEFAULT 4;

-- Create prepared_items table to track when staff prepare recipes
CREATE TABLE public.prepared_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  prepared_by UUID NOT NULL,
  prepared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on prepared_items
ALTER TABLE public.prepared_items ENABLE ROW LEVEL SECURITY;

-- Users can view prepared items in their organization
CREATE POLICY "Users can view prepared items in their organization" 
ON public.prepared_items 
FOR SELECT 
USING (organization_id IN (
  SELECT profiles.organization_id 
  FROM profiles 
  WHERE profiles.user_id = auth.uid()
));

-- Staff can create prepared items
CREATE POLICY "Staff can create prepared items" 
ON public.prepared_items 
FOR INSERT 
WITH CHECK (
  auth.uid() = prepared_by AND 
  organization_id IN (
    SELECT profiles.organization_id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_prepared_items_updated_at
BEFORE UPDATE ON public.prepared_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();