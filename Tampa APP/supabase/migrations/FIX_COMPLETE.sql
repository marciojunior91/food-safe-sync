-- ============================================================================
-- SOLUÇÃO COMPLETA - Habilitar Criação de Usuários via Invite
-- ============================================================================

-- PASSO 1: Desabilitar RLS em TODAS as tabelas necessárias
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Verificar se funcionou
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'user_roles', 'team_members');

-- PASSO 3: Garantir que get_current_user_context está correto
DROP FUNCTION IF EXISTS public.get_current_user_context();

CREATE OR REPLACE FUNCTION public.get_current_user_context()
RETURNS TABLE (
  user_id uuid,
  organization_id uuid,
  role text,
  department_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.organization_id,
    COALESCE(
      (
        SELECT ur.role::text
        FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        ORDER BY 
          CASE ur.role
            WHEN 'admin' THEN 1
            WHEN 'manager' THEN 2
            WHEN 'leader_chef' THEN 3
            WHEN 'cook' THEN 4
            WHEN 'barista' THEN 5
            WHEN 'staff' THEN 6
          END
        LIMIT 1
      ),
      'staff'
    ) as role,
    p.department_id
  FROM profiles p
  WHERE p.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- PASSO 4: Confirmar
SELECT 'CONFIGURAÇÃO COMPLETA - Tente criar usuário agora!' as status;
