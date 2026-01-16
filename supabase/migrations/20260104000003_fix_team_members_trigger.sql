-- ============================================================================
-- Fix Team Members Trigger - Use Correct feed_items Schema
-- ============================================================================
-- This migration fixes the notify_incomplete_team_member_profile function
-- to use the CORRECT columns from feed_items table:
-- - message (NOT content)
-- - channel (REQUIRED field)
-- - NO location_id
-- - Valid type from CHECK constraint
-- - Valid priority from CHECK constraint
-- ============================================================================

-- Drop and recreate the function with correct schema
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

-- No need to recreate trigger, just the function is enough
