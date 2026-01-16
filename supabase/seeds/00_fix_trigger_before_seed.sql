-- ============================================================================
-- PRE-SEED FIX: Corrigir Trigger Antes de Inserir Team Members
-- ============================================================================
-- Execute este script ANTES do seed_test_team_members.sql
-- Este script corrige a função notify_incomplete_team_member_profile
-- para usar os campos REAIS da tabela feed_items:
-- - message (NÃO content)
-- - channel (OBRIGATÓRIO)
-- - SEM location_id
-- ============================================================================

-- Drop and recreate the function with CORRECT feed_items schema
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

-- Verify the function was updated
SELECT 'Function notify_incomplete_team_member_profile updated successfully with CORRECT schema!' as status;
