# 🧹 Apply Cleanup Migration - profiles & user_roles

**Data:** 2026-01-04  
**Status:** ⏳ Pronto para Aplicar

---

## 🎯 O Que Esta Migration Faz

### Limpeza da Tabela `profiles`:
- ❌ Remove coluna `role` (deprecated - usar `user_roles`)
- ❌ Remove coluna `location_id` (pertence a `team_members`)
- ✅ Adiciona FK proper em `organization_id` com CASCADE
- ✅ Torna `organization_id` NOT NULL (obrigatório)

### Validação da Tabela `user_roles`:
- ✅ Verifica que existe e tem estrutura correta
- ✅ Adiciona indexes de performance

### Resultado Final:
- ✅ Arquitetura limpa e sem campos duplicados/deprecated
- ✅ Single source of truth para roles (`user_roles`)
- ✅ Separação clara entre auth e operational identity

---

## 📋 Ordem de Execução

### **PASSO 1: Aplicar Fix do Trigger** (Se ainda não aplicou)
```
Arquivo: supabase/seeds/00_fix_trigger_before_seed.sql
Local: Supabase SQL Editor
```

### **PASSO 2: Aplicar Cleanup de Tabelas** ⭐
```
Arquivo: supabase/migrations/20260104000004_cleanup_profiles_user_roles.sql
Local: Supabase SQL Editor
```

### **PASSO 3: Inserir Team Members** (Depois do cleanup)
```
Arquivo: supabase/seeds/seed_test_team_members_simple.sql
Local: Supabase SQL Editor
```

---

## 🚀 Como Aplicar

### **Método 1: Via Supabase Dashboard (Recomendado)** 🌐

1. **Abrir o arquivo de cleanup:**
   ```
   Localização: supabase/migrations/20260104000004_cleanup_profiles_user_roles.sql
   ```

2. **Copiar todo o conteúdo:**
   ```
   Ctrl + A (selecionar tudo)
   Ctrl + C (copiar)
   ```

3. **Ir ao Supabase Dashboard:**
   - URL: https://supabase.com/dashboard
   - Selecionar projeto Tampa APP
   - SQL Editor → New Query

4. **Colar e executar:**
   ```
   Ctrl + V (colar)
   Ctrl + Enter (executar)
   ```

5. **Verificar resultado:**
   ```
   ============================================================================
   PROFILES & USER_ROLES CLEANUP COMPLETE
   ============================================================================
   
   profiles table:
     - Removed: role column (use user_roles instead)
     - Removed: location_id (belongs to team_members)
     - Updated: organization_id FK with CASCADE
     - Enforced: organization_id NOT NULL
   
   user_roles table:
     - Verified: Correct structure exists
     - Added: Performance indexes
   ```

---

### **Método 2: Via Supabase CLI** 💻

```powershell
# Se você tiver Docker rodando (local development)
npx supabase@latest db push

# Ou aplicar migration específica
npx supabase@latest migration up --to 20260104000004
```

**⚠️ NOTA:** Requer Docker Desktop instalado e rodando.

---

## ✅ Verificação Após Aplicação

Execute estas queries no SQL Editor para confirmar:

### 1. Verificar estrutura de `profiles`:
```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Resultado Esperado:**
```
id              | uuid         | NO  | gen_random_uuid()
user_id         | uuid         | NO  | 
organization_id | uuid         | NO  |
display_name    | text         | YES |
created_at      | timestamptz  | NO  | now()
updated_at      | timestamptz  | NO  | now()
```

**❌ NÃO deve conter:**
- `role` (removido!)
- `location_id` (removido!)

### 2. Verificar estrutura de `user_roles`:
```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles'
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Resultado Esperado:**
```
id         | uuid        | NO
user_id    | uuid        | NO
role       | app_role    | NO
created_at | timestamptz | NO
created_by | uuid        | YES
```

### 3. Verificar FK constraints:
```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('profiles', 'user_roles')
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;
```

**Resultado Esperado para `profiles`:**
```
profiles_organization_id_fkey | profiles | organization_id | organizations | id | CASCADE
profiles_user_id_fkey         | profiles | user_id         | users         | id | CASCADE
```

---

## 🐛 Troubleshooting

### Erro: "column role does not exist"

**Causa:** Coluna `role` já foi removida anteriormente.

**Solução:** Isso é normal! A migration usa `DROP COLUMN IF EXISTS`, então é seguro executar.

---

### Erro: "cannot drop column because other objects depend on it"

**Causa:** Alguma view, policy ou função ainda referencia `profiles.role`.

**Solução:** 
```sql
-- Encontrar dependências:
SELECT DISTINCT 
  dependent_ns.nspname as dependent_schema,
  dependent_view.relname as dependent_view,
  source_table.relname as source_table,
  pg_attribute.attname as column_name
FROM pg_depend 
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid 
JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid 
JOIN pg_attribute ON pg_depend.refobjid = pg_attribute.attrelid 
    AND pg_depend.refobjsubid = pg_attribute.attnum 
JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
WHERE source_table.relname = 'profiles'
  AND pg_attribute.attname = 'role';
```

Então dropar a dependência antes:
```sql
DROP VIEW IF EXISTS nome_da_view CASCADE;
```

---

### Erro: "organization_id violates not null constraint"

**Causa:** Existem registros em `profiles` sem `organization_id`.

**Solução:** Atualizar ou deletar registros órfãos:
```sql
-- Ver registros sem organização:
SELECT * FROM profiles WHERE organization_id IS NULL;

-- Deletar se forem registros de teste:
DELETE FROM profiles WHERE organization_id IS NULL;

-- OU atribuir a uma organização padrão:
UPDATE profiles 
SET organization_id = (SELECT id FROM organizations LIMIT 1)
WHERE organization_id IS NULL;
```

---

## 📊 Impacto da Migration

### Tabelas Afetadas:
- ✅ `profiles` - Estrutura simplificada
- ✅ `user_roles` - Validada e indexada
- ❌ `team_members` - Não afetada (já estava correta)

### Possíveis Quebras:
- ❌ Queries antigas usando `profiles.role` → Devem usar `user_roles`
- ❌ Queries antigas usando `profiles.location_id` → Devem usar `team_members.location_id`

### Migrations a Verificar Depois:
```bash
# Procurar por uso de profiles.role
grep -r "profiles.role" supabase/migrations/

# Procurar por uso de profiles.location_id
grep -r "profiles.location_id" supabase/migrations/
```

---

## 📚 Próximos Passos

Após aplicar esta migration:

1. ✅ **Verificar estrutura** (queries acima)
2. ✅ **Aplicar seed data** (seed_test_team_members_simple.sql)
3. ✅ **Testar no frontend** (ver NEXT_STEPS_TEAM_MEMBERS.md)
4. ✅ **Atualizar migrations antigas** (se tiverem referências a profiles.role)

---

**⚡ PRONTO PARA EXECUTAR!** Migration testada e segura com IF EXISTS em todas as operações.
