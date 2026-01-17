-- Create security definer function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Drop existing problematic policies on profiles
DROP POLICY IF EXISTS "Admins and managers can view all profiles in organization" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles in organization" ON public.profiles;

-- Recreate policies using the security definer function
CREATE POLICY "Admins and managers can view all profiles in organization"
ON public.profiles
FOR SELECT
USING (
  (public.get_user_organization(auth.uid()) = organization_id) 
  AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'manager'::app_role])
);

CREATE POLICY "Admins can update profiles in organization"
ON public.profiles
FOR UPDATE
USING (
  (public.get_user_organization(auth.uid()) = organization_id) 
  AND has_role(auth.uid(), 'admin'::app_role)
);