-- ============================================================================
-- TEAM MEMBERS TABLE - Separating People from Authentication
-- ============================================================================
-- This migration creates a new team_members table to store actual staff information
-- while keeping profiles/user_roles only for authentication purposes
--
-- Concept:
-- - Shared logins: cook@company.com used by all cooks, barista@company.com by all baristas
-- - After login, user selects their team member profile
-- - Each team member has a 4-digit PIN to edit their own profile
-- ============================================================================

-- Create team_member_role enum (different from auth roles)
-- Only create if it doesn't exist
DO $$ BEGIN
  CREATE TYPE team_member_role AS ENUM (
    'cook',
    'barista', 
    'manager',
    'leader_chef',
    'admin'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Personal Information
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT, -- e.g., "Head Chef", "Pastry Cook", "Barista"
  
  -- Employment Information  
  hire_date DATE,
  department_id UUID, -- Reference to departments if needed
  role_type team_member_role NOT NULL DEFAULT 'cook',
  is_active BOOLEAN DEFAULT true,
  
  -- Authentication Link
  auth_role_id UUID REFERENCES profiles(user_id), -- Links to the shared login account
  pin_hash TEXT, -- Hashed 4-digit PIN for profile editing
  
  -- Profile Completion Tracking
  profile_complete BOOLEAN DEFAULT false,
  required_fields_missing TEXT[], -- Array of missing field names
  
  -- Organization & Location
  organization_id UUID NOT NULL REFERENCES organizations(id),
  location_id UUID, -- Location reference (optional, no FK constraint)
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(user_id),
  updated_by UUID REFERENCES profiles(user_id),
  
  -- Constraints
  CONSTRAINT team_members_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL),
  CONSTRAINT team_members_phone_check CHECK (phone ~* '^\+?[0-9]{10,15}$' OR phone IS NULL)
);

-- Create indexes for performance
CREATE INDEX idx_team_members_organization ON team_members(organization_id);
CREATE INDEX idx_team_members_location ON team_members(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX idx_team_members_role_type ON team_members(role_type);
CREATE INDEX idx_team_members_auth_role ON team_members(auth_role_id) WHERE auth_role_id IS NOT NULL;
CREATE INDEX idx_team_members_active ON team_members(is_active) WHERE is_active = true;
CREATE INDEX idx_team_members_incomplete ON team_members(profile_complete) WHERE profile_complete = false;
CREATE INDEX idx_team_members_search ON team_members USING gin(to_tsvector('english', display_name || ' ' || COALESCE(email, '') || ' ' || COALESCE(position, '')));

-- Updated at trigger
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE team_members IS 'Actual team members/staff - separated from authentication accounts';
COMMENT ON COLUMN team_members.auth_role_id IS 'Links to shared login account (e.g., cook@company.com)';
COMMENT ON COLUMN team_members.pin_hash IS 'Hashed 4-digit PIN for team member to edit their own profile';
COMMENT ON COLUMN team_members.role_type IS 'Team member role type (cook, barista, manager, etc.)';
COMMENT ON COLUMN team_members.profile_complete IS 'Whether all required profile fields are filled';
COMMENT ON COLUMN team_members.required_fields_missing IS 'Array of field names that are still missing';

-- ============================================================================
-- RLS Policies for team_members
-- ============================================================================

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone in org can view active team members
CREATE POLICY "Users can view team members in their organization"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
    AND is_active = true
  );

-- Policy: Admin/Manager/Leader Chef can insert team members
CREATE POLICY "Admins can create team members"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT p.organization_id 
      FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.user_id
      WHERE p.user_id = auth.uid()
        AND ur.role IN ('admin', 'manager', 'leader_chef')
    )
  );

-- Policy: Admin/Manager/Leader Chef can update team members
CREATE POLICY "Admins can update team members"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT p.organization_id 
      FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.user_id
      WHERE p.user_id = auth.uid()
        AND ur.role IN ('admin', 'manager', 'leader_chef')
    )
  );

-- Policy: Admin/Manager/Leader Chef can deactivate (not delete) team members
CREATE POLICY "Admins can deactivate team members"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT p.organization_id 
      FROM profiles p
      JOIN user_roles ur ON ur.user_id = p.user_id
      WHERE p.user_id = auth.uid()
        AND ur.role IN ('admin', 'manager', 'leader_chef')
    )
  )
  WITH CHECK (
    -- Can only update is_active to false (soft delete)
    is_active = false
  );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to check if team member profile is complete
CREATE OR REPLACE FUNCTION check_team_member_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  missing_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check required fields
  IF NEW.display_name IS NULL OR NEW.display_name = '' THEN
    missing_fields := array_append(missing_fields, 'display_name');
  END IF;
  
  IF NEW.email IS NULL OR NEW.email = '' THEN
    missing_fields := array_append(missing_fields, 'email');
  END IF;
  
  IF NEW.phone IS NULL OR NEW.phone = '' THEN
    missing_fields := array_append(missing_fields, 'phone');
  END IF;
  
  IF NEW.position IS NULL OR NEW.position = '' THEN
    missing_fields := array_append(missing_fields, 'position');
  END IF;
  
  IF NEW.hire_date IS NULL THEN
    missing_fields := array_append(missing_fields, 'hire_date');
  END IF;
  
  -- Update profile completion status
  NEW.required_fields_missing := missing_fields;
  NEW.profile_complete := (array_length(missing_fields, 1) IS NULL);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically check profile completion
CREATE TRIGGER check_team_member_completion
  BEFORE INSERT OR UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_member_profile_completion();

-- Function to generate feed notification for incomplete profiles
CREATE OR REPLACE FUNCTION notify_incomplete_team_member_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if profile is incomplete and it's a new team member
  IF NEW.profile_complete = false AND OLD.id IS NULL THEN
    INSERT INTO feed_items (
      organization_id,
      type,
      channel,
      title,
      message,
      priority,
      created_by
    ) VALUES (
      NEW.organization_id,
      'custom_note',  -- Using existing type from CHECK constraint
      'general',      -- Required field: using general channel
      'Complete Your Profile',
      format('Welcome %s! Please complete your profile by filling in: %s', 
        NEW.display_name, 
        array_to_string(NEW.required_fields_missing, ', ')
      ),
      'normal',       -- Using valid priority from CHECK constraint
      NEW.created_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create feed notification for incomplete profiles
CREATE TRIGGER notify_incomplete_profile
  AFTER INSERT ON team_members
  FOR EACH ROW
  WHEN (NEW.profile_complete = false)
  EXECUTE FUNCTION notify_incomplete_team_member_profile();

-- ============================================================================
-- Initial Data: Create shared authentication accounts
-- ============================================================================
-- Note: These should be created per organization
-- This is just an example - actual implementation should be done through the app

-- Example of how shared auth accounts would be set up:
/*
INSERT INTO profiles (user_id, organization_id, display_name, email)
VALUES 
  (gen_random_uuid(), 'org-id', 'Cook Account', 'cook@restaurant.com'),
  (gen_random_uuid(), 'org-id', 'Barista Account', 'barista@restaurant.com'),
  (gen_random_uuid(), 'org-id', 'Manager Account', 'manager@restaurant.com');

INSERT INTO user_roles (user_id, role)
SELECT user_id, 'staff' FROM profiles WHERE email LIKE 'cook@%' OR email LIKE 'barista@%'
UNION
SELECT user_id, 'manager' FROM profiles WHERE email LIKE 'manager@%';
*/
