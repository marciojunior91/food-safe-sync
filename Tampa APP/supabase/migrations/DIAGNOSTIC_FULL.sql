-- ============================================================================
-- DIAGNÓSTICO COMPLETO - Por que o backfill não funcionou?
-- ============================================================================

-- 1. Verificar se há profiles
SELECT '1. PROFILES' as step, COUNT(*) as count FROM profiles;

-- 2. Verificar se há user_roles
SELECT '2. USER_ROLES' as step, COUNT(*) as count FROM user_roles;

-- 3. Ver os profiles que NÃO têm user_roles
SELECT 
  '3. PROFILES SEM USER_ROLES' as step,
  p.user_id,
  p.display_name,
  p.email,
  p.created_at
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id
)
ORDER BY p.created_at
LIMIT 20;

-- 4. Verificar o tipo do enum app_role
SELECT '4. APP_ROLE ENUM VALUES' as step, enumlabel as value
FROM pg_enum
WHERE enumtypid = 'app_role'::regtype
ORDER BY enumsortorder;

-- 5. Tentar INSERT manual de UM registro para testar
DO $$
DECLARE
  test_user_id UUID;
  test_result TEXT;
BEGIN
  -- Pegar o primeiro profile sem user_role
  SELECT user_id INTO test_user_id
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id
  )
  LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '5. TEST INSERT: Todos os profiles já têm user_roles!';
  ELSE
    -- Tentar inserir
    BEGIN
      INSERT INTO user_roles (user_id, role, created_at)
      VALUES (test_user_id, 'staff'::app_role, NOW());
      
      RAISE NOTICE '5. TEST INSERT: ✓ Sucesso! Inserido user_role para user_id: %', test_user_id;
      
      -- Rollback para não afetar o teste
      RAISE EXCEPTION 'Rollback intencional para teste';
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLERRM LIKE '%Rollback intencional%' THEN
          RAISE NOTICE '   (Rollback feito - teste concluído sem modificar dados)';
        ELSE
          RAISE NOTICE '5. TEST INSERT: ✗ ERRO: %', SQLERRM;
        END IF;
    END;
  END IF;
END $$;

-- 6. Verificar constraints na tabela user_roles
SELECT 
  '6. USER_ROLES CONSTRAINTS' as step,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'user_roles'::regclass;

-- 7. Verificar triggers na tabela user_roles
SELECT 
  '7. USER_ROLES TRIGGERS' as step,
  tgname as trigger_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'user_roles'::regclass
  AND tgisinternal = false;

-- 8. Verificar RLS (Row Level Security)
SELECT 
  '8. USER_ROLES RLS' as step,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_roles';

-- 9. Ver as policies de RLS
SELECT 
  '9. USER_ROLES POLICIES' as step,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles';

-- ============================================================================
-- INSTRUÇÕES
-- ============================================================================
-- Execute este script no SQL Editor do Supabase
-- Copie TODA a saída e me envie
-- Vou identificar exatamente o que está bloqueando o INSERT
-- ============================================================================
