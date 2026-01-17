-- Fix get_current_user_context - Remove location_id (doesn't exist)
-- This fixes the "organization_id = null" issue in the UI

-- Drop and recreate the function without location_id
DROP FUNCTION IF EXISTS public.get_current_user_context();

CREATE OR REPLACE FUNCTION public.get_current_user_context()
RETURNS TABLE (
  user_id uuid,
  organization_id uuid,
  role text,
  department_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.organization_id,
    -- Get role from user_roles table (highest priority role if multiple)
    COALESCE(
      (
        SELECT ur.role::text
        FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        ORDER BY 
          CASE ur.role
            WHEN 'admin' THEN 1
            WHEN 'manager' THEN 2
            WHEN 'leader_chef' THEN 3
            WHEN 'cook' THEN 4
            WHEN 'barista' THEN 5
            WHEN 'staff' THEN 6
          END
        LIMIT 1
      ),
      'staff' -- Default fallback
    ) as role,
    p.department_id
  FROM profiles p
  WHERE p.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_current_user_context IS 'Returns current user context with role from user_roles table. Supports all roles: admin, manager, leader_chef, cook, barista, staff';
