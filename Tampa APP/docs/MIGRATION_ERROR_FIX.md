# 🔧 Correção - Migration Error Fixed (v2)

**Data:** 21 de Fevereiro de 2026  
**Erro:** `ERROR: 42703: column "user_id" does not exist`  
**Status:** ✅ CORRIGIDO (2 erros encontrados)

---

## 🐛 PROBLEMA IDENTIFICADO

### **Erro Original:**
```
Error: Failed to run sql query: 
ERROR: 42703: column "user_id" does not exist
```

### **Causa Raiz 1: Foreign Keys**
Referência incorreta à tabela `profiles` nas foreign keys.

**Schema Real:**
```sql
profiles (
  id UUID PRIMARY KEY,          -- ✅ Usar esta
  user_id UUID REFERENCES auth.users  -- ❌ Não usar como FK
)
```

### **Causa Raiz 2: RLS Policies**
Referência incorreta à tabela `team_members` nas policies.

**Schema Real:**
```sql
team_members (
  id UUID PRIMARY KEY,
  auth_role_id UUID REFERENCES profiles(user_id),  -- ✅ Usar esta
  organization_id UUID
)
```

**Problema:**
- Policies usavam `WHERE user_id = auth.uid()` ❌
- Mas `team_members` não tem coluna `user_id` ❌
- Deve usar `auth_role_id` + JOIN com `profiles` ✅

---

## ✅ CORREÇÕES APLICADAS

### **1. Foreign Keys (3 correções)**

**task_series.created_by:**
```sql
-- ANTES: created_by UUID REFERENCES profiles(user_id),
-- DEPOIS: created_by UUID REFERENCES profiles(id),
```

**task_occurrences.completed_by:**
```sql
-- ANTES: completed_by UUID REFERENCES profiles(user_id),
-- DEPOIS: completed_by UUID REFERENCES profiles(id),
```

**task_occurrences.approved_by:**
```sql
-- ANTES: approved_by UUID REFERENCES profiles(user_id),
-- DEPOIS: approved_by UUID REFERENCES profiles(id),
```

---

### **2. RLS Policies (8 correções)**

**Todas as policies (task_series + task_occurrences):**

```sql
-- ANTES (ERRADO):
WHERE user_id = auth.uid()

-- DEPOIS (CORRETO):
WHERE auth_role_id = (
  SELECT user_id FROM profiles WHERE id = auth.uid()
)
```

**Explicação:**
- `auth.uid()` retorna o `id` da tabela `profiles`
- Precisamos pegar o `user_id` correspondente (FK para `auth.users`)
- Usar esse `user_id` para comparar com `team_members.auth_role_id`

---

## 🔍 VERIFICAÇÃO

Total de correções: **11** (3 foreign keys + 8 policies)

**Comando de verificação:**
```bash
grep -n "profiles(id)" supabase/migrations/20260221_recurring_tasks_refactor.sql
grep -n "auth_role_id" supabase/migrations/20260221_recurring_tasks_refactor.sql
```

---

## ✅ SCHEMA RELATIONSHIPS (Correto)

```
auth.users (Supabase Auth)
    ↓ (id)
profiles (user_id FK)
    ↓ (user_id)
team_members (auth_role_id FK)
    ↓ (organization_id)
task_series / task_occurrences
```

**RLS Policy Logic:**
```sql
auth.uid() 
  → profiles.id
  → profiles.user_id
  → team_members.auth_role_id
  → team_members.organization_id
  → task_series/task_occurrences.organization_id
```

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Migration corrigida (v2)
2. ⏳ Rodar novamente no Supabase SQL Editor
3. ⏳ Verificar se executa sem erros
4. ⏳ Prosseguir com data migration

---

**Status:** ✅ PRONTO PARA NOVA TENTATIVA (v2)
