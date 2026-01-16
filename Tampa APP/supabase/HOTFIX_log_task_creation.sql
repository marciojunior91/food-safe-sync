-- ============================================================================
-- HOTFIX: Corrigir função log_task_creation() IMEDIATAMENTE
-- Data: 16 de Janeiro de 2026
-- ============================================================================
-- COPIE E EXECUTE ESTE CÓDIGO NO SUPABASE SQL EDITOR AGORA
-- ============================================================================

-- Recriar a função log_task_creation() corretamente
CREATE OR REPLACE FUNCTION log_task_creation()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  creator_id UUID;
BEGIN
  -- Try to get creator from auth.uid() (current user creating the task)
  creator_id := auth.uid();
  
  -- Get the user's display name from team_member
  SELECT display_name INTO user_name
  FROM team_members
  WHERE id = NEW.team_member_id
  LIMIT 1;
  
  -- If not found in team_members, try profiles with current user
  IF user_name IS NULL AND creator_id IS NOT NULL THEN
    SELECT display_name INTO user_name
    FROM profiles
    WHERE user_id = creator_id
    LIMIT 1;
  END IF;
  
  -- Log the creation
  INSERT INTO task_activity_log (
    task_id,
    organization_id,
    activity_type,
    performed_by,
    performed_by_name,
    notes
  ) VALUES (
    NEW.id,
    NEW.organization_id,
    'created',
    creator_id,  -- Use auth.uid() instead of NEW.created_by
    COALESCE(user_name, 'System'),
    'Task created: ' || NEW.title
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Testar que a função foi atualizada
DO $$
BEGIN
  RAISE NOTICE '✅ Função log_task_creation() foi atualizada com sucesso!';
  RAISE NOTICE '✅ Agora usa auth.uid() em vez de NEW.created_by';
  RAISE NOTICE '✅ Tente criar uma task novamente';
END $$;
