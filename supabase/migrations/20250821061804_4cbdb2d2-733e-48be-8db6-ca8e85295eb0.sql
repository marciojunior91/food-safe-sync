-- Update recipes table to support new requirements
-- Change hold time from hours to days
ALTER TABLE public.recipes 
DROP COLUMN hold_time_hours,
ADD COLUMN hold_time_days integer DEFAULT 3;

-- Add recipe category/folder
ALTER TABLE public.recipes 
ADD COLUMN category text DEFAULT 'mains',
ADD COLUMN estimated_prep_minutes integer DEFAULT 30,
ADD COLUMN service_gap_minutes integer DEFAULT 0;

-- Expand dietary requirements (separate from allergens)
ALTER TABLE public.recipes 
ADD COLUMN dietary_requirements text[] DEFAULT '{}';

-- Update allergens to use a broader list (keeping existing array structure)
-- The allergens field already exists as text[] so we can keep using it

-- Create staff table for login system
CREATE TABLE public.staff (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  organization_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for staff table
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Create policies for staff table
CREATE POLICY "Users can view staff in their organization" 
ON public.staff 
FOR SELECT 
USING (organization_id IN ( 
  SELECT profiles.organization_id
  FROM profiles
  WHERE (profiles.user_id = auth.uid())
));

CREATE POLICY "Admins can manage staff" 
ON public.staff 
FOR ALL
USING (organization_id IN ( 
  SELECT profiles.organization_id
  FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'))
));

-- Add prep session tracking table for timer functionality
CREATE TABLE public.prep_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid NOT NULL,
  staff_id uuid NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  actual_prep_minutes integer,
  batch_size decimal DEFAULT 1,
  organization_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for prep_sessions
ALTER TABLE public.prep_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for prep_sessions
CREATE POLICY "Users can view prep sessions in their organization" 
ON public.prep_sessions 
FOR SELECT 
USING (organization_id IN ( 
  SELECT profiles.organization_id
  FROM profiles
  WHERE (profiles.user_id = auth.uid())
));

CREATE POLICY "Staff can create prep sessions" 
ON public.prep_sessions 
FOR INSERT 
WITH CHECK (organization_id IN ( 
  SELECT profiles.organization_id
  FROM profiles
  WHERE (profiles.user_id = auth.uid())
));

CREATE POLICY "Staff can update their prep sessions" 
ON public.prep_sessions 
FOR UPDATE 
USING (organization_id IN ( 
  SELECT profiles.organization_id
  FROM profiles
  WHERE (profiles.user_id = auth.uid())
));

-- Update prepared_items to reference staff and prep sessions
ALTER TABLE public.prepared_items 
ADD COLUMN staff_id uuid,
ADD COLUMN prep_session_id uuid,
ADD COLUMN batch_size decimal DEFAULT 1,
ADD COLUMN label_count integer DEFAULT 1;

-- Add triggers for timestamp updates
CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prep_sessions_updated_at
BEFORE UPDATE ON public.prep_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();