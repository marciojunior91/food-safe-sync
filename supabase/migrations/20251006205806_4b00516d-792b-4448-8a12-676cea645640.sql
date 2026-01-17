-- Phase 1: Secure User Roles & Establishment Structure

-- Create app_role enum with hierarchy
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'leader_chef', 'staff');

-- Create user_roles table (CRITICAL: roles must NOT be in profiles table)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user has any role in list
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- Function to get user's highest role (for hierarchy)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'leader_chef' THEN 3
      WHEN 'staff' THEN 4
    END
  LIMIT 1
$$;

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and managers can assign roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
);

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 
  CASE 
    WHEN role = 'admin' THEN 'admin'::app_role
    WHEN role = 'manager' THEN 'manager'::app_role
    WHEN role = 'leader_chef' THEN 'leader_chef'::app_role
    ELSE 'staff'::app_role
  END
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Update recipes RLS to use new role system
DROP POLICY IF EXISTS "Admins can create recipes" ON public.recipes;
DROP POLICY IF EXISTS "Admins can update recipes" ON public.recipes;
DROP POLICY IF EXISTS "Admins can delete recipes" ON public.recipes;

-- Leader chefs and admins can create recipes
CREATE POLICY "Leader chefs can create recipes"
ON public.recipes
FOR INSERT
WITH CHECK (
  (auth.uid() = created_by) AND
  (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'leader_chef']::app_role[])
);

-- Leader chefs and admins can update recipes
CREATE POLICY "Leader chefs can update recipes"
ON public.recipes
FOR UPDATE
USING (
  (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'leader_chef']::app_role[])
);

-- Only admins can delete recipes
CREATE POLICY "Admins can delete recipes"
ON public.recipes
FOR DELETE
USING (
  (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )) AND
  public.has_role(auth.uid(), 'admin')
);

-- Update staff RLS for new role system
DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;

CREATE POLICY "Managers and admins can manage staff"
ON public.staff
FOR ALL
USING (
  (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
);