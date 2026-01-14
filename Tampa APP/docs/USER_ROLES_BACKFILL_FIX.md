# 🐛 USER_ROLES BACKFILL FIX

## Problema Identificado

O script Part 2 **NÃO FUNCIONOU** porque tentou fazer backfill usando a tabela `team_members` com a condição:

```sql
WHERE tm.auth_role_id IS NOT NULL
```

**Mas `auth_role_id` está NULL para todos os registros existentes!** 😱

## Por que Falhou?

### Lógica Original (ERRADA):
```sql
-- Step 6 do Part 2 - FALHA
CREATE TEMP TABLE temp_highest_roles AS
SELECT DISTINCT ON (tm.auth_role_id)
  tm.auth_role_id as user_id,
  tm.role_type::text::app_role as role,
  tm.created_at
FROM team_members tm
WHERE tm.auth_role_id IS NOT NULL  -- ⚠️ Retorna 0 linhas!
```

### Estrutura Real dos Dados:
- ✅ `profiles` tem todos os usuários cadastrados (10, 20, 30... usuários)
- ❌ `team_members.auth_role_id` está NULL para registros antigos
- ✅ `user_roles` tem apenas 2 registros (admin)

### Resultado:
- Query retorna **0 linhas** (nenhum team_member com auth_role_id)
- INSERT faz **nada** (temp table vazia)
- user_roles continua com apenas 2 registros

## Solução Correta

### Nova Estratégia:
Fazer backfill direto da tabela `profiles` (que TEM todos os usuários):

```sql
INSERT INTO user_roles (user_id, role, created_at)
SELECT 
  p.user_id,
  'staff'::app_role as role,  -- Default para todos
  p.created_at
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id
);
```

## Como Aplicar o Fix

### 1️⃣ Execute o Diagnóstico (Opcional)
```
Arquivo: supabase/migrations/DIAGNOSTIC_user_roles_issue.sql
```

Este script mostra:
- Quantos profiles existem
- Quantos user_roles existem  
- Quantos team_members têm auth_role_id NULL
- Quais profiles estão sem user_roles

### 2️⃣ Execute o Backfill Correto
```
Arquivo: supabase/migrations/20260110_backfill_user_roles_from_profiles.sql
```

Este script:
- ✅ Cria user_roles para TODOS os profiles que não têm
- ✅ Usa 'staff' como role padrão
- ✅ Mantém o relacionamento 1:1 (UNIQUE constraint)
- ✅ Mostra progresso detalhado
- ✅ Inclui queries de verificação

### 3️⃣ Verifique os Resultados

Após executar, você deve ver:
```
Total profiles: 15
Existing user_roles: 2
Missing user_roles: 13

✓ Inserted 13 new user_roles entries
✓ Total user_roles now: 15
✓ All profiles now have user_roles entries: YES
```

### 4️⃣ Atualize as Roles Corretas

Como todos foram criados com role 'staff', você precisa atualizar manualmente:

```sql
-- Exemplo: Tornar um usuário admin
UPDATE user_roles 
SET role = 'admin'
WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'admin@example.com');

-- Exemplo: Tornar um usuário manager
UPDATE user_roles 
SET role = 'manager'
WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'manager@example.com');
```

**OU** use a UI do módulo People para atualizar as roles! 🎨

## Queries de Verificação

```sql
-- Verificar se todos têm roles agora
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM user_roles) as total_user_roles,
  CASE 
    WHEN (SELECT COUNT(*) FROM profiles) = (SELECT COUNT(*) FROM user_roles) 
    THEN '✓ OK' 
    ELSE '✗ PROBLEMA' 
  END as status;

-- Ver todos os usuários e suas roles
SELECT 
  p.display_name,
  p.email,
  COALESCE(ur.role::text, 'SEM ROLE') as role
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
ORDER BY p.display_name;

-- Ver quem ainda não tem role
SELECT 
  p.display_name,
  p.email,
  'MISSING' as status
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id
);
```

## Resumo

### ❌ Problema Original:
- Part 2 Step 6 assume que `team_members.auth_role_id` está preenchido
- Na realidade, essa coluna está NULL para usuários existentes
- Backfill retorna 0 linhas → nenhum registro criado

### ✅ Solução:
- Usar `profiles` como fonte (tem todos os usuários)
- Criar user_roles com role 'staff' por padrão
- Admins atualizam roles depois

### 🎯 Resultado Esperado:
```
profiles count = user_roles count ✅
Todos os usuários têm role (mesmo que seja 'staff' temporariamente) ✅
Sistema funcional ✅
```

## Próximos Passos

1. ✅ Execute o backfill correto
2. ✅ Verifique que todos têm roles
3. 📝 Atualize roles corretas (via UI ou SQL)
4. 🧪 Teste criar novos usuários
5. 🚀 Continue para o próximo módulo!
