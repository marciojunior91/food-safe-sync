-- ============================================================================
-- FIX: Profile Completion Logic
-- ============================================================================
-- Updates the trigger to match our JavaScript logic:
-- - Required fields (5): display_name, email, phone, position, hire_date
-- - Optional fields (at least 2 of 4): date_of_birth, address, emergency_contact_name, emergency_contact_phone
-- - Certificates: At least 1 active certificate
-- ============================================================================

-- Drop old trigger
DROP TRIGGER IF EXISTS trigger_check_team_member_completion ON team_members;
DROP FUNCTION IF EXISTS check_team_member_completion();

-- New function with updated logic
CREATE OR REPLACE FUNCTION check_team_member_completion()
RETURNS TRIGGER AS $$
DECLARE
  missing_required TEXT[] := '{}';
  missing_optional TEXT[] := '{}';
  optional_filled_count INT := 0;
  cert_count INT := 0;
BEGIN
  -- Check REQUIRED fields
  IF NEW.display_name IS NULL OR NEW.display_name = '' THEN 
    missing_required := array_append(missing_required, 'display_name'); 
  END IF;
  
  IF NEW.email IS NULL OR NEW.email = '' THEN 
    missing_required := array_append(missing_required, 'email'); 
  END IF;
  
  IF NEW.phone IS NULL OR NEW.phone = '' THEN 
    missing_required := array_append(missing_required, 'phone'); 
  END IF;
  
  IF NEW.position IS NULL OR NEW.position = '' THEN 
    missing_required := array_append(missing_required, 'position'); 
  END IF;
  
  IF NEW.hire_date IS NULL THEN 
    missing_required := array_append(missing_required, 'hire_date'); 
  END IF;
  
  -- Check OPTIONAL fields (need at least 2 of 4)
  IF NEW.date_of_birth IS NOT NULL THEN 
    optional_filled_count := optional_filled_count + 1;
  ELSE
    missing_optional := array_append(missing_optional, 'date_of_birth');
  END IF;
  
  IF NEW.address IS NOT NULL AND NEW.address != '' THEN 
    optional_filled_count := optional_filled_count + 1;
  ELSE
    missing_optional := array_append(missing_optional, 'address');
  END IF;
  
  IF NEW.emergency_contact_name IS NOT NULL AND NEW.emergency_contact_name != '' THEN 
    optional_filled_count := optional_filled_count + 1;
  ELSE
    missing_optional := array_append(missing_optional, 'emergency_contact_name');
  END IF;
  
  IF NEW.emergency_contact_phone IS NOT NULL AND NEW.emergency_contact_phone != '' THEN 
    optional_filled_count := optional_filled_count + 1;
  ELSE
    missing_optional := array_append(missing_optional, 'emergency_contact_phone');
  END IF;
  
  -- Count active certificates
  SELECT COUNT(*) INTO cert_count
  FROM team_member_certificates
  WHERE team_member_id = NEW.id
    AND status = 'active';
  
  -- Build list of ALL missing fields for display
  NEW.required_fields_missing := missing_required;
  
  -- Add optional fields only if less than 2 are filled
  IF optional_filled_count < 2 THEN
    NEW.required_fields_missing := NEW.required_fields_missing || missing_optional;
  END IF;
  
  -- Add certificate reminder if none
  IF cert_count = 0 THEN
    NEW.required_fields_missing := array_append(NEW.required_fields_missing, 'certificate (at least 1)');
  END IF;
  
  -- Profile is complete if:
  -- 1. All required fields filled (5 fields)
  -- 2. At least 2 optional fields filled
  -- 3. At least 1 active certificate
  NEW.profile_complete := (
    array_length(missing_required, 1) IS NULL AND
    optional_filled_count >= 2 AND
    cert_count >= 1
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_check_team_member_completion
  BEFORE INSERT OR UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_member_completion();

-- Update existing records to recalculate completion status
UPDATE team_members SET updated_at = updated_at;

COMMENT ON FUNCTION check_team_member_completion() IS 'Checks team member profile completion: 5 required + 2 of 4 optional + 1 certificate';
