-- ============================================================================
-- Expand team_members Table - Add Personal & Employment Data
-- Date: January 4, 2026
-- ============================================================================
-- This migration adds missing personal information and employment fields
-- to the team_members table for complete profile tracking
-- ============================================================================

-- ============================================================================
-- 1. ADD MISSING COLUMNS TO TEAM_MEMBERS
-- ============================================================================

-- Add date of birth
ALTER TABLE team_members 
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add address (full address text field)
ALTER TABLE team_members 
  ADD COLUMN IF NOT EXISTS address TEXT;

-- Add TFN (Tax File Number / Carteira de Trabalho)
ALTER TABLE team_members 
  ADD COLUMN IF NOT EXISTS tfn_number TEXT;

-- Add emergency contact information
ALTER TABLE team_members 
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;

ALTER TABLE team_members 
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

ALTER TABLE team_members 
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;

-- ============================================================================
-- 2. ADD CONSTRAINTS AND VALIDATIONS
-- ============================================================================

-- Constraint: Date of birth should be in the past and person should be at least 14 years old
ALTER TABLE team_members
  ADD CONSTRAINT team_members_dob_check 
  CHECK (date_of_birth IS NULL OR (date_of_birth < CURRENT_DATE AND date_of_birth > CURRENT_DATE - INTERVAL '100 years'));

-- Constraint: Emergency contact phone format
ALTER TABLE team_members
  ADD CONSTRAINT team_members_emergency_phone_check 
  CHECK (emergency_contact_phone IS NULL OR emergency_contact_phone ~* '^\+?[0-9]{10,15}$');

-- ============================================================================
-- 3. ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for date of birth searches (useful for age-based reporting)
CREATE INDEX IF NOT EXISTS idx_team_members_dob 
  ON team_members(date_of_birth) 
  WHERE date_of_birth IS NOT NULL;

-- Index for TFN lookups (useful for compliance checks)
CREATE INDEX IF NOT EXISTS idx_team_members_tfn 
  ON team_members(tfn_number) 
  WHERE tfn_number IS NOT NULL;

-- ============================================================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN team_members.date_of_birth IS 'Team member date of birth for age verification and reporting';
COMMENT ON COLUMN team_members.address IS 'Full residential address';
COMMENT ON COLUMN team_members.tfn_number IS 'Tax File Number (TFN) or Carteira de Trabalho number';
COMMENT ON COLUMN team_members.emergency_contact_name IS 'Emergency contact full name';
COMMENT ON COLUMN team_members.emergency_contact_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN team_members.emergency_contact_relationship IS 'Relationship to team member (e.g., spouse, parent, sibling)';

-- ============================================================================
-- 5. CREATE TEAM MEMBER CERTIFICATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_member_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to team member
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  
  -- Certificate Information
  certificate_name TEXT NOT NULL,
  certificate_type TEXT, -- e.g., 'food_safety', 'first_aid', 'license'
  description TEXT,
  
  -- File Information
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_type TEXT, -- e.g., 'application/pdf'
  file_size INTEGER, -- in bytes
  
  -- Certificate Validity
  issue_date DATE,
  expiration_date DATE,
  issued_by TEXT, -- Issuing organization
  certificate_number TEXT, -- Official certificate/license number
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending', 'rejected')),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES profiles(user_id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(user_id),
  updated_by UUID REFERENCES profiles(user_id),
  
  -- Indexes
  CONSTRAINT certificate_expiry_check CHECK (expiration_date IS NULL OR expiration_date > issue_date)
);

-- Create indexes for certificates
CREATE INDEX IF NOT EXISTS idx_certificates_team_member 
  ON team_member_certificates(team_member_id);

CREATE INDEX IF NOT EXISTS idx_certificates_status 
  ON team_member_certificates(status);

CREATE INDEX IF NOT EXISTS idx_certificates_verification 
  ON team_member_certificates(verification_status);

CREATE INDEX IF NOT EXISTS idx_certificates_expiration 
  ON team_member_certificates(expiration_date) 
  WHERE expiration_date IS NOT NULL AND status = 'active';

-- Updated at trigger for certificates
CREATE TRIGGER update_team_member_certificates_updated_at
  BEFORE UPDATE ON team_member_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE team_member_certificates IS 'Certificates, licenses, and qualifications for team members with file attachments';
COMMENT ON COLUMN team_member_certificates.verification_status IS 'Admin verification status: pending, verified, or rejected';
COMMENT ON COLUMN team_member_certificates.status IS 'Certificate validity status: active, expired, pending, or rejected';

-- ============================================================================
-- 6. ENABLE RLS FOR CERTIFICATES
-- ============================================================================

ALTER TABLE team_member_certificates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view certificates in their organization
CREATE POLICY "Users can view certificates in their organization"
  ON team_member_certificates
  FOR SELECT
  TO authenticated
  USING (
    team_member_id IN (
      SELECT id FROM team_members 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Team members can upload their own certificates (via application)
CREATE POLICY "Team members can manage their certificates"
  ON team_member_certificates
  FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid()
  )
  WITH CHECK (
    created_by = auth.uid()
  );

-- Policy: Admins can manage all certificates in their organization
CREATE POLICY "Admins can manage certificates"
  ON team_member_certificates
  FOR ALL
  TO authenticated
  USING (
    team_member_id IN (
      SELECT tm.id FROM team_members tm
      JOIN profiles p ON p.organization_id = tm.organization_id
      JOIN user_roles ur ON ur.user_id = p.user_id
      WHERE p.user_id = auth.uid()
        AND ur.role IN ('admin', 'leader_chef', 'manager')
    )
  )
  WITH CHECK (
    team_member_id IN (
      SELECT tm.id FROM team_members tm
      JOIN profiles p ON p.organization_id = tm.organization_id
      JOIN user_roles ur ON ur.user_id = p.user_id
      WHERE p.user_id = auth.uid()
        AND ur.role IN ('admin', 'leader_chef', 'manager')
    )
  );

-- ============================================================================
-- 7. UPDATE PROFILE COMPLETION TRIGGER
-- ============================================================================

-- Function to check team member profile completion
CREATE OR REPLACE FUNCTION check_team_member_completion()
RETURNS TRIGGER AS $$
DECLARE
  missing_fields TEXT[] := '{}';
BEGIN
  -- Check required personal fields
  IF NEW.display_name IS NULL OR NEW.display_name = '' THEN 
    missing_fields := array_append(missing_fields, 'display_name'); 
  END IF;
  
  IF NEW.date_of_birth IS NULL THEN 
    missing_fields := array_append(missing_fields, 'date_of_birth'); 
  END IF;
  
  IF NEW.email IS NULL OR NEW.email = '' THEN 
    missing_fields := array_append(missing_fields, 'email'); 
  END IF;
  
  IF NEW.phone IS NULL OR NEW.phone = '' THEN 
    missing_fields := array_append(missing_fields, 'phone'); 
  END IF;
  
  IF NEW.address IS NULL OR NEW.address = '' THEN 
    missing_fields := array_append(missing_fields, 'address'); 
  END IF;
  
  -- Check employment fields
  IF NEW.hire_date IS NULL THEN 
    missing_fields := array_append(missing_fields, 'hire_date'); 
  END IF;
  
  IF NEW.position IS NULL OR NEW.position = '' THEN 
    missing_fields := array_append(missing_fields, 'position'); 
  END IF;
  
  -- TFN is optional but recommended
  IF NEW.tfn_number IS NULL OR NEW.tfn_number = '' THEN 
    missing_fields := array_append(missing_fields, 'tfn_number'); 
  END IF;
  
  -- Emergency contact is optional but recommended
  IF NEW.emergency_contact_name IS NULL OR NEW.emergency_contact_name = '' THEN 
    missing_fields := array_append(missing_fields, 'emergency_contact'); 
  END IF;
  
  -- Update the tracking fields
  NEW.required_fields_missing := missing_fields;
  NEW.profile_complete := (array_length(missing_fields, 1) IS NULL);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_check_team_member_completion ON team_members;

-- Create trigger to automatically check completion on insert/update
CREATE TRIGGER trigger_check_team_member_completion
  BEFORE INSERT OR UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_member_completion();

-- ============================================================================
-- 8. UPDATE EXISTING RECORDS
-- ============================================================================

-- Update all existing team members to recalculate their completion status
UPDATE team_members SET updated_at = now();

-- ============================================================================
-- VERIFICATION QUERIES (commented out - run manually to verify)
-- ============================================================================

/*
-- Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'team_members'
  AND column_name IN ('date_of_birth', 'address', 'tfn_number', 'emergency_contact_name');

-- Check certificates table
SELECT * FROM team_member_certificates LIMIT 1;

-- Check profile completion
SELECT id, display_name, profile_complete, required_fields_missing
FROM team_members
WHERE profile_complete = false;

-- Test trigger
UPDATE team_members SET email = 'test@example.com' WHERE id = (SELECT id FROM team_members LIMIT 1);
SELECT id, profile_complete, required_fields_missing FROM team_members LIMIT 5;
*/
