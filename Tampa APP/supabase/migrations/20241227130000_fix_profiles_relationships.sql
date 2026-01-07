-- ============================================================================
-- Fix Profiles Table Relationships
-- Date: December 27, 2025
-- ============================================================================
-- This migration properly connects profiles to organizations and departments
-- with foreign key constraints for data integrity.
-- ============================================================================

-- ============================================================================
-- 1. UPDATE DEPARTMENTS TABLE STRUCTURE
-- ============================================================================

-- Add foreign key constraint from departments to organizations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_departments_organization'
  ) THEN
    ALTER TABLE departments
    ADD CONSTRAINT fk_departments_organization 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure all departments have an organization_id
UPDATE departments
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL for future inserts
ALTER TABLE departments
ALTER COLUMN organization_id SET NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_departments_organization ON departments(organization_id);

COMMENT ON TABLE departments IS 'Physical locations within a restaurant (Main Kitchen, Pastry Station, Coffee Bar, etc.)';
COMMENT ON COLUMN departments.organization_id IS 'The restaurant/organization this location belongs to';

-- ============================================================================
-- 2. SEED DEFAULT DEPARTMENTS/LOCATIONS
-- ============================================================================

-- Create default department for the main organization if none exist
INSERT INTO departments (id, name, description, organization_id)
SELECT 
  '00000000-0000-0000-0001-000000000001'::uuid,
  'Main Kitchen',
  'Primary kitchen and food preparation area',
  '00000000-0000-0000-0000-000000000001'::uuid
WHERE NOT EXISTS (
  SELECT 1 FROM departments 
  WHERE organization_id = '00000000-0000-0000-0000-000000000001'::uuid
);

-- ============================================================================
-- 3. UPDATE PROFILES TABLE - FIX location_id REFERENCE
-- ============================================================================

-- Rename location_id to department_id to be clearer
-- (location_id should reference departments table)

-- First, update any NULL location_id to the default department
UPDATE profiles
SET location_id = '00000000-0000-0000-0001-000000000001'::uuid
WHERE location_id IS NULL;

-- Now add the foreign key constraint from profiles.location_id to departments
DO $$ 
BEGIN
  -- Check if department_id already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'department_id'
  ) THEN
    -- If location_id exists but not department_id, we can rename or add
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'location_id'
    ) THEN
      -- Keep location_id but add FK constraint to departments
      -- Add constraint if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_profiles_location'
      ) THEN
        ALTER TABLE profiles
        ADD CONSTRAINT fk_profiles_location 
        FOREIGN KEY (location_id) 
        REFERENCES departments(id) 
        ON DELETE SET NULL;
      END IF;
    END IF;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location_id);

-- Add comments for clarity
COMMENT ON COLUMN profiles.location_id IS 'The department/location where this user works (references departments table)';
COMMENT ON COLUMN profiles.organization_id IS 'The restaurant/organization this user belongs to (references organizations table)';

-- ============================================================================
-- 4. CREATE HELPER VIEW FOR USER CONTEXT
-- ============================================================================

-- Create a view that joins user profile with organization and department info
CREATE OR REPLACE VIEW user_context AS
SELECT 
  p.id,
  p.user_id,
  p.display_name,
  p.role,
  p.position,
  p.phone,
  p.organization_id,
  o.name as organization_name,
  o.slug as organization_slug,
  p.location_id as department_id,
  d.name as department_name,
  d.description as department_description,
  p.employment_status,
  p.admission_date,
  p.profile_completion_percentage,
  p.created_at,
  p.updated_at
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN departments d ON p.location_id = d.id;

COMMENT ON VIEW user_context IS 'Comprehensive user context with organization and department information';

-- Enable RLS on the view
ALTER VIEW user_context SET (security_invoker = on);

-- ============================================================================
-- 5. CREATE FUNCTION TO GET CURRENT USER CONTEXT
-- ============================================================================

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
    p.role as user_role,
    p.display_name
  FROM profiles p
  LEFT JOIN organizations o ON p.organization_id = o.id
  LEFT JOIN departments d ON p.location_id = d.id
  WHERE p.user_id = auth.uid();
END;
$$;

COMMENT ON FUNCTION get_current_user_context IS 'Returns the current authenticated user context including organization and department';

-- ============================================================================
-- 6. UPDATE EXISTING RLS POLICIES TO USE PROPER RELATIONSHIPS
-- ============================================================================

-- Example: Update recipes RLS policy to use the proper organization reference
DROP POLICY IF EXISTS "Users can view recipes in their organization" ON recipes;
CREATE POLICY "Users can view recipes in their organization"
ON recipes FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Leader chefs can create recipes" ON recipes;
CREATE POLICY "Leader chefs can create recipes"
ON recipes FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('leader_chef', 'owner', 'admin')
  )
);

-- ============================================================================
-- 7. CREATE SAMPLE ADDITIONAL DEPARTMENTS
-- ============================================================================

-- Insert additional department examples (commented out - uncomment to use)
/*
INSERT INTO departments (name, description, organization_id) VALUES
  ('Pastry Station', 'Bakery and dessert preparation area', '00000000-0000-0000-0000-000000000001'::uuid),
  ('Coffee Bar', 'Barista station and beverage preparation', '00000000-0000-0000-0000-000000000001'::uuid),
  ('Cold Storage', 'Refrigeration and freezer storage area', '00000000-0000-0000-0000-000000000001'::uuid),
  ('Dry Storage', 'Pantry and dry goods storage', '00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
