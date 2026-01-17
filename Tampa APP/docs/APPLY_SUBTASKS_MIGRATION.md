# 🗂️ ADICIONAR SUPORTE A SUBTASKS - GUIA DE APLICAÇÃO

**Data**: 16 de Janeiro de 2026  
**Migration**: `20260116000001_add_subtasks_to_routine_tasks.sql`  
**Status**: ⚠️ **PENDENTE DE APLICAÇÃO**

---

## 📋 O QUE ESTA MIGRATION FAZ

### 1. **Adiciona Coluna `subtasks`**
- Tipo: `JSONB` (array de objetos)
- Padrão: `[]` (array vazio)
- Estrutura: `[{ id: string, title: string, completed: boolean }]`

### 2. **Validação Automática**
- Trigger que valida estrutura das subtasks antes de insert/update
- Garante que cada subtask tenha `id`, `title` e `completed`
- Valida tipos de dados (string, boolean)
- Previne títulos vazios

### 3. **Função Utilitária**
- `get_subtasks_completion_percentage(task_id)`: Retorna percentual de conclusão (0-100%)

### 4. **Performance**
- Índice GIN para queries rápidas em JSONB

---

## 🚀 COMO APLICAR

### Opção 1: Via Supabase Dashboard (RECOMENDADO)

1. **Acesse o Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor
   ```

2. **Vá para SQL Editor**
   - Clique em "SQL Editor" no menu lateral

3. **Crie Nova Query**
   - Clique em "+ New query"

4. **Cole o Conteúdo da Migration**
   - Abra: `supabase/migrations/20260116000001_add_subtasks_to_routine_tasks.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor

5. **Execute**
   - Clique em "Run" ou pressione `Ctrl+Enter`
   - Aguarde confirmação: "Success. No rows returned"

---

### Opção 2: Via Supabase CLI (AVANÇADO)

```powershell
# 1. Certifique-se de estar na pasta do projeto
cd "c:\Users\Marci\OneDrive\Área de Trabalho\Tampa APP\Tampa APP"

# 2. Verifique se CLI está instalada
supabase --version

# 3. Login (se necessário)
supabase login

# 4. Link ao projeto (se necessário)
supabase link --project-ref YOUR_PROJECT_REF

# 5. Aplique a migration
supabase db push
```

---

## ✅ VERIFICAR SE FOI APLICADA CORRETAMENTE

Execute esta query no SQL Editor:

```sql
-- Verificar se coluna existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'routine_tasks'
  AND column_name = 'subtasks';

-- Verificar se trigger existe
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'routine_tasks'
  AND trigger_name = 'trigger_validate_subtasks';

-- Verificar se função existe
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'get_subtasks_completion_percentage';

-- Verificar se índice existe
SELECT indexname
FROM pg_indexes
WHERE tablename = 'routine_tasks'
  AND indexname = 'idx_routine_tasks_subtasks';
```

**Resultado Esperado:**
- ✅ `subtasks` column found (type: `jsonb`, default: `'[]'::jsonb`)
- ✅ `trigger_validate_subtasks` found
- ✅ `get_subtasks_completion_percentage` function found
- ✅ `idx_routine_tasks_subtasks` index found

---

## 🧪 TESTAR A FUNCIONALIDADE

### 1. **Criar Task com Subtasks**

```sql
INSERT INTO routine_tasks (
  organization_id,
  title,
  task_type,
  scheduled_date,
  team_member_id,
  subtasks
)
SELECT 
  organization_id,
  'Test Task - Refrigerator Check',
  'temperature',
  CURRENT_DATE,
  id,
  '[
    {"id": "uuid-test-1", "title": "Check main fridge temperature", "completed": false},
    {"id": "uuid-test-2", "title": "Check freezer temperature", "completed": false},
    {"id": "uuid-test-3", "title": "Record readings", "completed": false}
  ]'::jsonb
FROM team_members
WHERE organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
LIMIT 1;
```

### 2. **Verificar Task Criada**

```sql
SELECT 
  id,
  title,
  subtasks,
  jsonb_array_length(subtasks) as total_subtasks,
  get_subtasks_completion_percentage(id) as completion_percentage
FROM routine_tasks
WHERE title = 'Test Task - Refrigerator Check'
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado Esperado:**
```
id: <uuid>
title: Test Task - Refrigerator Check
subtasks: [{"id": "uuid-test-1", ...}, ...]
total_subtasks: 3
completion_percentage: 0
```

### 3. **Marcar Subtask como Completa**

```sql
-- Marcar primeira subtask como completa
UPDATE routine_tasks
SET subtasks = jsonb_set(
  subtasks,
  '{0,completed}',
  'true'::jsonb
)
WHERE title = 'Test Task - Refrigerator Check';

-- Verificar percentual atualizado
SELECT 
  title,
  get_subtasks_completion_percentage(id) as completion_percentage
FROM routine_tasks
WHERE title = 'Test Task - Refrigerator Check';
```

**Resultado Esperado:**
```
completion_percentage: 33  (1 de 3 completas)
```

### 4. **Testar Validação (deve falhar)**

```sql
-- Teste 1: Subtask sem campo 'id' (DEVE FALHAR)
INSERT INTO routine_tasks (
  organization_id,
  title,
  task_type,
  scheduled_date,
  team_member_id,
  subtasks
)
SELECT 
  organization_id,
  'Test Invalid Subtask',
  'others',
  CURRENT_DATE,
  id,
  '[{"title": "Invalid", "completed": false}]'::jsonb
FROM team_members
LIMIT 1;

-- Resultado esperado: ERROR: Each subtask must have id, title, and completed fields

-- Teste 2: Título vazio (DEVE FALHAR)
INSERT INTO routine_tasks (
  organization_id,
  title,
  task_type,
  scheduled_date,
  team_member_id,
  subtasks
)
SELECT 
  organization_id,
  'Test Empty Title',
  'others',
  CURRENT_DATE,
  id,
  '[{"id": "test", "title": "", "completed": false}]'::jsonb
FROM team_members
LIMIT 1;

-- Resultado esperado: ERROR: Subtask title cannot be empty
```

### 5. **Limpar Dados de Teste**

```sql
DELETE FROM routine_tasks
WHERE title LIKE 'Test%';
```

---

## 🔄 ATUALIZAR TIPOS TYPESCRIPT

Após aplicar a migration, é necessário atualizar os tipos TypeScript do Supabase:

```powershell
# Gerar tipos atualizados
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

**OU**

Adicionar manualmente ao arquivo `src/integrations/supabase/types.ts`:

```typescript
// Localizar routine_tasks Row/Insert/Update
// Adicionar:
subtasks: Json | null  // Array de subtasks: [{ id: string, title: string, completed: boolean }]
```

---

## 📊 IMPACTO NO CÓDIGO EXISTENTE

### ✅ Código que JÁ está preparado:
- ✅ `TaskForm.tsx` - UI para adicionar/remover subtasks
- ✅ `TaskForm.tsx` - Estado e funções de gerenciamento
- ✅ `TaskForm.tsx` - Validação com Zod
- ✅ `TaskForm.tsx` - Integração com React Hook Form

### 🔧 Código que PRECISA ser atualizado:

#### 1. **CreateTaskInput Type**
```typescript
// src/types/routineTasks.ts
export interface CreateTaskInput {
  // ... campos existentes
  subtasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
}
```

#### 2. **Task Service**
```typescript
// src/services/taskService.ts
// Ao criar task, incluir subtasks no payload
const taskData = {
  // ... campos existentes
  subtasks: input.subtasks || [],
};
```

#### 3. **Task Display Components**
- `TaskCard.tsx` - Mostrar subtasks na card
- `TaskDetailsDialog.tsx` - Mostrar/editar subtasks no detalhe
- `TaskActivityTimeline.tsx` - Registrar mudanças em subtasks

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Migration Criada** - `20260116000001_add_subtasks_to_routine_tasks.sql`
2. ⏳ **Aplicar Migration** - Via Supabase Dashboard
3. ⏳ **Atualizar Types** - Regenerar tipos TypeScript
4. ⏳ **Atualizar CreateTaskInput** - Adicionar subtasks ao type
5. ⏳ **Testar no App** - Criar task com subtasks e verificar persistência
6. ⏳ **Adicionar UI de Display** - Mostrar subtasks em TaskCard/Details

---

## 🐛 TROUBLESHOOTING

### Erro: "relation routine_tasks does not exist"
- ✅ Verifique se está conectado ao projeto correto
- ✅ Verifique se a migration base `20241227000000_iteration_13_foundation.sql` foi aplicada

### Erro: "column subtasks already exists"
- ✅ Migration já foi aplicada anteriormente
- ✅ Verifique com: `SELECT * FROM information_schema.columns WHERE table_name='routine_tasks' AND column_name='subtasks';`

### Erro: "permission denied"
- ✅ Certifique-se de estar usando uma conta com permissões de admin no Supabase
- ✅ Verifique se está executando no SQL Editor correto (não no Query Editor público)

### Validação não está funcionando
- ✅ Verifique se o trigger foi criado: `SELECT * FROM information_schema.triggers WHERE trigger_name='trigger_validate_subtasks';`
- ✅ Execute manualmente: `SELECT validate_subtasks();`

---

## 📝 NOTAS IMPORTANTES

1. **Compatibilidade com dados existentes**: A coluna tem default `[]`, então todas as tasks existentes automaticamente terão um array vazio de subtasks.

2. **Performance**: O índice GIN permite queries eficientes mesmo com milhares de tasks.

3. **Validação**: O trigger garante integridade dos dados, mas pode ser removido se necessário (veja seção de rollback na migration).

4. **Rollback**: Instruções de rollback estão comentadas no final da migration caso seja necessário reverter.

---

**Status**: ⏳ Aguardando aplicação no banco de dados  
**Última atualização**: 16/01/2026  
**Autor**: Sistema de Migrations - Tampa APP
