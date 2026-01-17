-- ============================================================================
-- VERIFICAR E CORRIGIR RLS (Row Level Security) em user_roles
-- ============================================================================

-- 1. Ver status atual do RLS
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'user_roles';

-- 2. Ver todas as policies existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_roles';

-- 3. SOLUÇÃO: Adicionar policy para permitir INSERT via service role
-- Desabilitar RLS temporariamente para permitir inserts via edge function
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- OU criar policy permissiva para service role
-- ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Service role can insert user_roles"
-- ON user_roles
-- FOR INSERT
-- TO service_role
-- WITH CHECK (true);

-- CREATE POLICY "Service role can update user_roles"
-- ON user_roles
-- FOR UPDATE
-- TO service_role
-- USING (true)
-- WITH CHECK (true);

-- CREATE POLICY "Service role can delete user_roles"  
-- ON user_roles
-- FOR DELETE
-- TO service_role
-- USING (true);

-- CREATE POLICY "Users can view their own role"
-- ON user_roles
-- FOR SELECT
-- TO authenticated
-- USING (auth.uid() = user_id);

-- CREATE POLICY "Admins can view all roles"
-- ON user_roles
-- FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM user_roles ur
--     WHERE ur.user_id = auth.uid()
--     AND ur.role IN ('admin', 'manager')
--   )
-- );

-- 4. Verificar se funcionou
SELECT 
  'RLS Status após mudança' as info,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'user_roles';

-- ============================================================================
-- RESUMO
-- ============================================================================
-- Este script DESABILITA o RLS na tabela user_roles
-- Isso permite que o edge function (que usa service_role) possa inserir livremente
-- 
-- Se você quiser MANTER o RLS ativo, descomente as policies acima
-- ============================================================================
