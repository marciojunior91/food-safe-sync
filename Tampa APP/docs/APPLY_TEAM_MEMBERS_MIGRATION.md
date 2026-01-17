# 🚀 APLICAR MIGRATION TEAM_MEMBERS - Guia Passo a Passo

## ⚠️ Situação Atual

O `supabase db push` está falhando porque há muitas migrations antigas pendentes que conflitam com o estado atual do banco de dados. A solução é executar manualmente a nova migration no Supabase Studio.

## 📝 Passos para Aplicar a Migration

### Opção 1: SQL Editor do Supabase Studio (RECOMENDADO)

1. **Abra o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"

3. **Copie o Conteúdo da Migration**
   - Abra o arquivo: `supabase/migrations/20260103000000_create_team_members_table.sql`
   - Copie TODO o conteúdo (Ctrl+A, Ctrl+C)

4. **Cole e Execute no SQL Editor**
   - Cole o SQL no editor
   - Clique em "Run" (ou pressione Ctrl+Enter)
   - Aguarde a execução (pode levar alguns segundos)

5. **Verifique se Foi Criado**
   - Vá para "Table Editor" no menu lateral
   - Procure pela tabela `team_members`
   - Deve aparecer listada com todas as colunas

### Opção 2: Via Terminal (Alternativa)

Se preferir executar via terminal, use o comando SQL direto:

```bash
# Execute o SQL diretamente
npx supabase db execute -f supabase/migrations/20260103000000_create_team_members_table.sql
```

### Opção 3: Usando psql (Se tiver acesso direto)

```bash
# Conecte ao banco
psql -h [seu-host] -U [seu-user] -d [seu-db]

# Execute o arquivo
\i supabase/migrations/20260103000000_create_team_members_table.sql
```

## ✅ Verificação Pós-Instalação

Após executar a migration, verifique se tudo foi criado corretamente:

### 1. Verificar Tabela

```sql
-- No SQL Editor, execute:
SELECT * FROM information_schema.tables 
WHERE table_name = 'team_members';
```

**Resultado esperado:** 1 linha mostrando a tabela

### 2. Verificar Enum

```sql
-- Verificar se o enum foi criado
SELECT enumlabel 
FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'team_member_role';
```

**Resultado esperado:** 5 linhas (cook, barista, manager, leader_chef, admin)

### 3. Verificar Triggers

```sql
-- Verificar triggers criados
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'team_members';
```

**Resultado esperado:** 3 triggers
- `update_team_members_updated_at`
- `check_team_member_completion`
- `notify_incomplete_profile`

### 4. Verificar RLS Policies

```sql
-- Verificar políticas RLS
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'team_members';
```

**Resultado esperado:** 4 policies
- "Users can view team members in their organization"
- "Admins can create team members"
- "Admins can update team members"
- "Admins can deactivate team members"

### 5. Verificar Índices

```sql
-- Verificar índices criados
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'team_members';
```

**Resultado esperado:** ~8-9 índices incluindo:
- idx_team_members_organization
- idx_team_members_role_type
- idx_team_members_auth_role
- etc.

## 🔍 Troubleshooting

### Erro: "type team_member_role already exists"

Se você já executou a migration antes:

```sql
-- Remova o enum antigo
DROP TYPE IF EXISTS team_member_role CASCADE;

-- Execute a migration novamente
```

### Erro: "relation team_members already exists"

Se a tabela já existe:

```sql
-- Remova a tabela existente
DROP TABLE IF EXISTS team_members CASCADE;

-- Execute a migration novamente
```

### Erro: "function check_team_member_profile_completion already exists"

```sql
-- Remova as funções
DROP FUNCTION IF EXISTS check_team_member_profile_completion CASCADE;
DROP FUNCTION IF EXISTS notify_incomplete_team_member_profile CASCADE;

-- Execute a migration novamente
```

## 📊 Próximos Passos Após Instalação

1. **Testar a Tabela**
   ```sql
   -- Inserir um team member de teste
   INSERT INTO team_members (
     display_name,
     role_type,
     organization_id
   ) VALUES (
     'Test Member',
     'cook',
     (SELECT id FROM organizations LIMIT 1)
   );
   
   -- Verificar se o trigger funcionou
   SELECT profile_complete, required_fields_missing 
   FROM team_members 
   WHERE display_name = 'Test Member';
   ```

2. **Verificar Feed Notification**
   ```sql
   -- Deve ter criado uma notificação
   SELECT * FROM feed_items 
   WHERE type = 'team_member_incomplete'
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

3. **Limpar Teste**
   ```sql
   DELETE FROM team_members WHERE display_name = 'Test Member';
   ```

## 🎯 Status Final

Após completar estes passos, você terá:

✅ Tabela `team_members` criada com todas as colunas
✅ Enum `team_member_role` com 5 valores
✅ 8+ índices para performance
✅ 4 RLS policies para segurança
✅ 3 triggers automáticos funcionando
✅ Sistema de notificação para perfis incompletos

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs de erro no Supabase Dashboard
2. Execute os comandos de verificação acima
3. Compartilhe a mensagem de erro completa

## 🔗 Arquivos Relacionados

- Migration: `supabase/migrations/20260103000000_create_team_members_table.sql`
- Types: `src/types/teamMembers.ts`
- PIN Utils: `src/utils/pinUtils.ts`
- Documentation: `docs/TEAM_MEMBERS_ARCHITECTURE.md`
