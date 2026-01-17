-- Fix get_current_user_context to remove non-existent location_id column
-- The profiles table doesn't have location_id, only organization_id and department_id

CREATE OR REPLACE FUNCTION get_current_user_context()
RETURNS TABLE (
  user_id UUID,
  organization_id UUID,
  organization_name TEXT,
  department_id UUID,
  department_name TEXT,
  user_role TEXT,
  display_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.organization_id,
    o.name as organization_name,
    p.department_id,  -- Changed from p.location_id to p.department_id
    d.name as department_name,
    -- Get role from user_roles table (highest priority role if multiple)
    -- Order: admin > manager > leader_chef > staff
    COALESCE(
      (
        SELECT ur.role::TEXT
        FROM user_roles ur
        WHERE ur.user_id = p.user_id
        ORDER BY 
          CASE ur.role::TEXT
            WHEN 'admin' THEN 1
            WHEN 'manager' THEN 2
            WHEN 'leader_chef' THEN 3
            WHEN 'staff' THEN 4
            ELSE 5
          END
        LIMIT 1
      ),
      'staff'  -- Default to staff if no role found
    ) as user_role,
    p.display_name
  FROM profiles p
  LEFT JOIN organizations o ON p.organization_id = o.id
  LEFT JOIN departments d ON p.department_id = d.id  -- Changed from p.location_id to p.department_id
  WHERE p.user_id = auth.uid();
END;
$$;

COMMENT ON FUNCTION get_current_user_context IS 'Returns the current authenticated user context including organization and department. Role is fetched from user_roles table with priority: admin > manager > leader_chef > staff';

-- Also update the user_context view to use department_id instead of location_id
DROP VIEW IF EXISTS user_context CASCADE;

CREATE OR REPLACE VIEW user_context AS
SELECT 
  p.user_id,
  p.organization_id,
  o.name as organization_name,
  COALESCE(
    (
      SELECT ur.role::TEXT
      FROM user_roles ur
      WHERE ur.user_id = p.user_id
      ORDER BY 
        CASE ur.role::TEXT
          WHEN 'admin' THEN 1
          WHEN 'manager' THEN 2
          WHEN 'leader_chef' THEN 3
          WHEN 'staff' THEN 4
          ELSE 5
        END
      LIMIT 1
    ),
    'staff'
  ) as user_role,
  p.display_name
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
WHERE p.user_id = auth.uid();

COMMENT ON VIEW user_context IS 'Simplified view of user context for RLS policies. Uses user_roles table for role information.';
