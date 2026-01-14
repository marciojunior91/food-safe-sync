# 🚨 URGENT: Missing Database Tables

## ⚠️ Situação

Você regenerou os tipos TypeScript do Supabase, mas a tabela `print_queue` **NÃO APARECE** nos tipos gerados. Isso significa que a tabela **não existe no banco de dados Supabase**.

## 📋 Migrations Pendentes

Você tem **DUAS migrations críticas** que precisam ser aplicadas:

### 1. ✅ **APPLY_TEAM_MEMBER_TO_ROUTINE_TASKS.sql** 
- Adiciona coluna `team_member_id` à tabela `routine_tasks`
- **Status**: ✅ Você disse que aplicou (passo 1)

### 2. 🔴 **APPLY_PRINT_QUEUE_MIGRATION.sql** (NOVO)
- Cria a tabela `print_queue` completa
- **Status**: ❌ NUNCA FOI APLICADA

## 🎯 Ação Necessária

### Passo 1: Abrir Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn
2. Vá em **SQL Editor** (menu lateral esquerdo)
3. Clique em **New Query**

### Passo 2: Aplicar Print Queue Migration

1. Abra o arquivo: `APPLY_PRINT_QUEUE_MIGRATION.sql`
2. **Copie TODO o conteúdo**
3. **Cole no SQL Editor do Supabase**
4. Clique em **Run** (ou Ctrl+Enter)
5. ✅ Aguarde mensagem de sucesso

### Passo 3: Verificar Tabelas Criadas

Execute este comando no SQL Editor para confirmar:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('print_queue', 'routine_tasks', 'team_members')
ORDER BY table_name;
```

**Resultado esperado:**
```
table_name      | column_count
----------------|-------------
print_queue     | 18
routine_tasks   | 15 (com team_member_id)
team_members    | 10
```

### Passo 4: Regenerar Tipos TypeScript (NOVAMENTE)

Agora que a tabela `print_queue` existe no banco, regenere:

```powershell
npx supabase gen types typescript --project-id imnecvcvhypnlvujajpn > src/types/supabase.ts
```

### Passo 5: Verificar Tipos Gerados

Abra `src/types/supabase.ts` e procure (Ctrl+F):

```typescript
print_queue: {
  Row: {
    id: string
    product_id: string | null
    // ... outros campos
  }
  Insert: { ... }
  Update: { ... }
}
```

Se aparecer, **SUCESSO!** ✅

### Passo 6: Verificar Erros TypeScript

```powershell
npm run dev
```

**Esperado**: ✅ Sem erros de compilação no `PrintQueue.tsx`

## 🔍 Por Que Isso Aconteceu?

A migration `20251203130000_create_print_queue.sql` existe no repositório desde **3 de dezembro de 2025**, mas **nunca foi aplicada no Supabase**.

Possíveis causas:
- Migrations foram feitas localmente mas não sincronizadas
- Supabase CLI não estava configurado
- Migration foi criada manualmente sem `supabase migration up`

## 📊 Status das Migrations

| Migration | Arquivo | Status | Aplicar? |
|-----------|---------|--------|----------|
| Team Member ID | `APPLY_TEAM_MEMBER_TO_ROUTINE_TASKS.sql` | ✅ Aplicada | - |
| Print Queue Table | `APPLY_PRINT_QUEUE_MIGRATION.sql` | 🔴 PENDENTE | **SIM** |

## ⚠️ Importante

**NÃO pule a etapa 2!** Sem a tabela `print_queue` no banco:
- ❌ Tipos TypeScript continuarão sem `print_queue`
- ❌ PrintQueue.tsx continuará com 10 erros
- ❌ Funcionalidade de fila de impressão não funciona
- ❌ App não compila

## ✅ Checklist

- [ ] Abrir Supabase SQL Editor
- [ ] Copiar `APPLY_PRINT_QUEUE_MIGRATION.sql`
- [ ] Colar e executar no SQL Editor
- [ ] Verificar tabela criada com query de verificação
- [ ] Regenerar tipos TypeScript com comando npx
- [ ] Procurar `print_queue` em `src/types/supabase.ts`
- [ ] Executar `npm run dev` e verificar sem erros
- [ ] ✅ **Print Queue funcionando!**

---

**Depois de aplicar, me avise para continuar o teste das funcionalidades!** 🚀
