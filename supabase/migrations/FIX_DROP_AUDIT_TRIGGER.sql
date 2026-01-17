-- Fix: Remove audit logging trigger that references deleted role_audit_log table
-- Root Cause: role_audit_log table was dropped in cleanup migration but trigger still exists

-- Drop the trigger
DROP TRIGGER IF EXISTS log_role_change_trigger ON public.user_roles;

-- Drop the trigger function
DROP FUNCTION IF EXISTS public.log_role_change();

-- Verification
SELECT 'Audit logging trigger and function removed successfully!' as status;
