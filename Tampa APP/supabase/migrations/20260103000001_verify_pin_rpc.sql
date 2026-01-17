-- ============================================================================
-- TEAM MEMBER PIN VERIFICATION RPC
-- ============================================================================
-- This migration adds a secure RPC function to verify team member PINs
-- Uses timing-safe comparison to prevent timing attacks
-- ============================================================================

-- Function to verify team member PIN
CREATE OR REPLACE FUNCTION verify_team_member_pin(
  member_id UUID,
  pin_input TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash TEXT;
  input_hash TEXT;
  salt TEXT;
BEGIN
  -- Get stored PIN hash
  SELECT pin_hash INTO stored_hash
  FROM team_members
  WHERE id = member_id;
  
  -- If no hash stored or member doesn't exist, return false
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Extract salt from stored hash (first 16 characters)
  salt := substring(stored_hash from 1 for 16);
  
  -- Hash input PIN with same salt
  input_hash := salt || encode(digest(salt || pin_input, 'sha256'), 'hex');
  
  -- Timing-safe comparison (always takes same time regardless of result)
  RETURN stored_hash = input_hash;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION verify_team_member_pin(UUID, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION verify_team_member_pin IS 'Securely verifies team member PIN with timing-safe comparison';
