-- Fix get_current_user_context to use user_roles table instead of profiles.role
-- This ensures the correct role hierarchy (admin, manager, leader_chef, staff) is used
-- Also migrates all RLS policies to use has_role() function instead of profiles.role

-- Step 1: Update get_current_user_context to use user_roles table
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
    p.location_id as department_id,
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
  LEFT JOIN departments d ON p.location_id = d.id
  WHERE p.user_id = auth.uid();
END;
$$;

COMMENT ON FUNCTION get_current_user_context IS 'Returns the current authenticated user context including organization and department. Role is fetched from user_roles table with priority: admin > manager > leader_chef > staff';

-- Step 2: Update user_context view to use user_roles table
DROP VIEW IF EXISTS user_context CASCADE;

CREATE OR REPLACE VIEW user_context AS
SELECT 
  p.user_id,
  p.organization_id,
  o.name as organization_name,
  p.location_id as department_id,
  d.name as department_name,
  -- Get role from user_roles table (highest priority role if multiple)
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
LEFT JOIN departments d ON p.location_id = d.id;

COMMENT ON VIEW user_context IS 'User context view showing organization and role from user_roles table';

-- Step 3: Update all RLS policies to use has_role() function instead of profiles.role

-- Organizations policies
DROP POLICY IF EXISTS "Admins can update their organization" ON organizations;
CREATE POLICY "Admins can update their organization" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    AND has_role(auth.uid(), 'admin')
  );

-- Task Templates policies
DROP POLICY IF EXISTS "Admins can manage templates" ON task_templates;
CREATE POLICY "Admins can manage templates" ON task_templates
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    AND has_role(auth.uid(), 'admin')
  );

-- Routine Tasks policies
DROP POLICY IF EXISTS "Admins can create tasks" ON routine_tasks;
CREATE POLICY "Admins can create tasks" ON routine_tasks
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    AND has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Assigned users or admins can update tasks" ON routine_tasks;
CREATE POLICY "Assigned users or admins can update tasks" ON routine_tasks
  FOR UPDATE USING (
    assigned_to = auth.uid() 
    OR has_role(auth.uid(), 'admin')
  );

-- Feed Items policies
DROP POLICY IF EXISTS "Admins can create feed items" ON feed_items;
CREATE POLICY "Admins can create feed items" ON feed_items
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    AND has_role(auth.uid(), 'admin')
  );

-- User Documents policies
DROP POLICY IF EXISTS "Users can view their own or admin can view all" ON user_documents;
CREATE POLICY "Users can view their own or admin can view all" ON user_documents
  FOR SELECT USING (
    user_id = auth.uid() 
    OR has_role(auth.uid(), 'admin')
  );

-- Label Categories policies
DROP POLICY IF EXISTS "Admins can manage label categories" ON label_categories;
CREATE POLICY "Admins can manage label categories" ON label_categories
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    AND has_role(auth.uid(), 'admin')
  );

-- Label Subcategories policies
DROP POLICY IF EXISTS "Admins can manage label subcategories" ON label_subcategories;
CREATE POLICY "Admins can manage label subcategories" ON label_subcategories
  FOR ALL USING (
    category_id IN (
      SELECT id FROM label_categories 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM profiles 
        WHERE user_id = auth.uid()
      )
    )
    AND has_role(auth.uid(), 'admin')
  );

-- Products policies
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    AND has_role(auth.uid(), 'admin')
  );

-- Recipes policies
DROP POLICY IF EXISTS "Leader chefs can create recipes" ON recipes;
CREATE POLICY "Leader chefs can create recipes" ON recipes
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'leader_chef'::app_role])
  );

DROP POLICY IF EXISTS "Leader chefs can update recipes" ON recipes;
CREATE POLICY "Leader chefs can update recipes" ON recipes
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    AND has_any_role(auth.uid(), ARRAY['admin'::app_role, 'leader_chef'::app_role])
  );

-- Measuring Units policies
DROP POLICY IF EXISTS "Admins can manage measuring units" ON measuring_units;
CREATE POLICY "Admins can manage measuring units" ON measuring_units
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    AND has_role(auth.uid(), 'admin')
  );

-- Printed Labels policies
DROP POLICY IF EXISTS "Admins can manage printed labels in their organization" ON printed_labels;
CREATE POLICY "Admins can manage printed labels in their organization" ON printed_labels
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    AND has_role(auth.uid(), 'admin')
  );

-- Step 4: Now we can safely drop the role column from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS role;

COMMENT ON TABLE profiles IS 'User profile information. User roles are managed in the user_roles table, not here.';

-- Step 5: Create a helper view for easy role lookup
CREATE OR REPLACE VIEW user_primary_roles AS
SELECT 
  ur.user_id,
  ur.role,
  p.display_name,
  p.organization_id
FROM user_roles ur
INNER JOIN profiles p ON ur.user_id = p.user_id
WHERE ur.role IN (
  SELECT ur2.role
  FROM user_roles ur2
  WHERE ur2.user_id = ur.user_id
  ORDER BY 
    CASE ur2.role::TEXT
      WHEN 'admin' THEN 1
      WHEN 'manager' THEN 2
      WHEN 'leader_chef' THEN 3
      WHEN 'staff' THEN 4
      ELSE 5
    END
  LIMIT 1
);

COMMENT ON VIEW user_primary_roles IS 'View showing each user primary role (highest priority if they have multiple roles)';

-- Step 6: Grant permissions on the views
GRANT SELECT ON user_primary_roles TO authenticated;
GRANT SELECT ON user_primary_roles TO service_role;
GRANT SELECT ON user_context TO authenticated;
GRANT SELECT ON user_context TO service_role;
