-- ============================================================================
-- DISABLE ROLE VALIDATION TRIGGER
-- Issue: validate_role_assignment_trigger blocks service_role inserts
-- Solution: Drop or modify the trigger to allow service_role operations
-- ============================================================================

-- Option 1: DROP the trigger completely (RECOMMENDED for edge function use)
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON public.user_roles;

-- Option 2: Recreate the function to allow service_role bypass
CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role to bypass validation (for edge functions)
  -- Service role operations come from auth.uid() = NULL in triggers
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

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

-- Recreate the trigger
CREATE TRIGGER validate_role_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_assignment();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'validate_role_assignment_trigger';

-- Check function definition
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'validate_role_assignment';
