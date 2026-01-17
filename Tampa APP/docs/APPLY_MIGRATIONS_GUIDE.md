# 🚀 Como Aplicar Team Members Migrations

## Método Recomendado: Supabase Dashboard

### Passo 1: Abrir Supabase Dashboard
1. Acesse: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn
2. Faça login se necessário
3. Clique em "SQL Editor" no menu lateral

### Passo 2: Copiar o SQL
1. Abra o arquivo: `supabase\APPLY_TEAM_MEMBERS_MIGRATIONS.sql`
2. Selecione TODO o conteúdo (Ctrl+A)
3. Copie (Ctrl+C)

### Passo 3: Executar no Dashboard
1. No SQL Editor, cole o conteúdo (Ctrl+V)
2. Clique no botão "RUN" (ou Ctrl+Enter)
3. Aguarde a execução (~10-30 segundos)

### Passo 4: Verificar Sucesso
Você verá mensagens como:
```
✓ Added team_member_id to routine_task_assignments
✓ Created PIN verification functions
✓ Enhanced RLS policies
✓ Created performance indexes
```

## O que este script faz?

### Migration 1: Add team_member_id
- Adiciona coluna `team_member_id` em routine_task_assignments
- Adiciona coluna `team_member_id` em routine_task_completions
- Cria indexes para performance

### Migration 2: Authentication Functions
- `verify_team_member_pin()` - Valida PIN de 4 dígitos
- `can_edit_team_member()` - Verifica permissões
- `get_current_org_team_members()` - Lista team members ativos

### Migration 3: RLS Policies
- Atualiza políticas de segurança
- Valida organization_id
- Restringe acesso por role (admin/manager/leader_chef)

## Após Aplicar

### 1. Regenerar Types
```powershell
npx supabase gen types typescript --project-id imnecvcvhypnlvujajpn > src/integrations/supabase/types.ts
```

### 2. Rebuild
```powershell
npm run build
```

### 3. Testar
```powershell
npm run dev
```

## Troubleshooting

### Erro: "column already exists"
- ✅ **Normal!** O script tem checks `IF NOT EXISTS`
- Continue executando, não é problema

### Erro: "function already exists"
- ✅ **Normal!** O script usa `CREATE OR REPLACE`
- Continue executando

### Erro: "policy already exists"
- ✅ **Normal!** O script faz `DROP POLICY IF EXISTS` antes
- Continue executando

### Erro real: "table does not exist"
- ❌ **Problema!** Você precisa aplicar as migrações base primeiro
- Rode: `supabase\migrations\` na ordem correta

## Link Rápido

📊 **Supabase SQL Editor**: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/editor/sql

## Status

- [ ] Migrações aplicadas
- [ ] Types regenerados
- [ ] Build passou
- [ ] Testado no navegador

---

**Última atualização**: 7 de Janeiro de 2026
