-- ============================================================================
-- DIAGNÓSTICO: Por que auth.users não consegue criar usuário?
-- ============================================================================

-- 1. Verificar se há usuários duplicados (email já existe)
SELECT 
  '1. EMAILS em auth.users' as check_type,
  email,
  COUNT(*) as count
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1;

-- 2. Ver todos os emails cadastrados
SELECT 
  '2. TODOS OS EMAILS' as check_type,
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 3. Verificar constraints em auth.users
SELECT 
  '3. AUTH.USERS CONSTRAINTS' as check_type,
  conname as constraint_name,
  contype as type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'auth.users'::regclass;

-- 4. Verificar triggers em auth.users
SELECT 
  '4. AUTH.USERS TRIGGERS' as check_type,
  tgname as trigger_name,
  tgenabled as enabled,
  tgtype as type
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgisinternal = false;

-- 5. Verificar se há policies bloqueando
SELECT 
  '5. AUTH.USERS POLICIES' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'auth' 
  AND tablename = 'users';

-- 6. Verificar RLS em auth.users
SELECT 
  '6. AUTH.USERS RLS STATUS' as check_type,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'auth' 
  AND tablename = 'users';

-- 7. Ver erros recentes nos logs (se disponível)
-- Nota: Isso só funciona se você tiver acesso aos logs do Postgres

-- ============================================================================
-- AÇÕES CORRETIVAS POSSÍVEIS
-- ============================================================================

-- Se o problema for RLS em auth.users (não deveria, mas pode acontecer):
-- ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Se houver algum trigger problemático, você verá nos resultados acima
-- ============================================================================
