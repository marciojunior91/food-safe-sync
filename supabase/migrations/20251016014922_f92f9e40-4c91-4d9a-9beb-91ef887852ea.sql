-- ============================================
-- SECURITY FIX: Remove privilege escalation vulnerability
-- ============================================

-- 1. Remove the 'role' column from profiles table
-- Roles should ONLY be stored in the user_roles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- 2. Update RLS policies for profiles table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create new secure policies
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Admins and managers can view profiles in their organization
CREATE POLICY "Admins and managers can view all profiles in organization"
ON public.profiles
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'manager'::app_role])
);

-- Policy 3: Users can insert their own profile (for registration)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can update their own profile (limited fields)
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 5: Admins can update profiles in their organization
CREATE POLICY "Admins can update profiles in organization"
ON public.profiles
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Add security constraint to prevent self-role-escalation
-- Create a function to validate role assignments
CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to assign admin roles
  IF NEW.role = 'admin' THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only administrators can assign admin roles';
    END IF;
  END IF;
  
  -- Only allow admins and managers to assign manager roles
  IF NEW.role = 'manager' THEN
    IF NOT public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'manager'::app_role]) THEN
      RAISE EXCEPTION 'Only administrators and managers can assign manager roles';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for role assignment validation
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON public.user_roles;
CREATE TRIGGER validate_role_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_assignment();

-- 4. Create audit log table for role changes
CREATE TABLE IF NOT EXISTS public.role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  action text NOT NULL, -- 'assigned' or 'removed'
  performed_by uuid NOT NULL,
  performed_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

-- Enable RLS on audit log
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.role_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.role_audit_log
FOR INSERT
WITH CHECK (true);

-- Create trigger function for audit logging
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (user_id, role, action, performed_by, notes)
    VALUES (NEW.user_id, NEW.role, 'assigned', auth.uid(), 'Role assigned');
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log (user_id, role, action, performed_by, notes)
    VALUES (OLD.user_id, OLD.role, 'removed', auth.uid(), 'Role removed');
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for audit logging
DROP TRIGGER IF EXISTS log_role_change_trigger ON public.user_roles;
CREATE TRIGGER log_role_change_trigger
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();

-- 5. Update the handle_new_user function to not set a role
-- Roles should be assigned separately through proper authorization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create profile, do NOT assign any role
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  
  RETURN NEW;
END;
$$;