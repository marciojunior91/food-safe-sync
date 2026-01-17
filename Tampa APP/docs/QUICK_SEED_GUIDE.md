# ⚡ GUIA RÁPIDO - Aplicar Seed Data

**Tempo Estimado:** 3 minutos ⏱️

---

## � IMPORTANTE: Executar em 2 Etapas

Você precisa executar **2 scripts SQL** na ordem:
1. **PRIMEIRO:** `00_fix_trigger_before_seed.sql` (corrige trigger)
2. **DEPOIS:** `seed_test_team_members.sql` (insere dados)

---

## 📋 ETAPA 1: Corrigir Trigger

### 1️⃣ **Abrir o arquivo de correção**
   - Arquivo: `supabase/seeds/00_fix_trigger_before_seed.sql`

### 2️⃣ **Copiar o conteúdo**
   ```
   Ctrl + A (selecionar tudo)
   Ctrl + C (copiar)
   ```

### 3️⃣ **Abrir Supabase Dashboard**
   - Ir para: https://supabase.com/dashboard
   - Login se necessário
   - Selecionar seu projeto **Tampa APP**

### 4️⃣ **Abrir SQL Editor**
   - No menu lateral esquerdo, clicar em: **"SQL Editor"** (ícone 📝)
   - Clicar em: **"+ New query"**

### 5️⃣ **Colar e Executar o FIX**
   ```
   Ctrl + V (colar)
   Ctrl + Enter (executar)
   ```
   OU clicar no botão verde **"Run"**

### 6️⃣ **Verificar Sucesso** ✅
   Você verá:
   ```
   status: "Function notify_incomplete_team_member_profile updated successfully!"
   ```

---

## 📋 ETAPA 2: Inserir Team Members

### 1️⃣ **Abrir o arquivo seed SIMPLIFICADO**
   - Arquivo: `supabase/seeds/seed_test_team_members_simple.sql` ⭐
   - OU: `supabase/seeds/seed_test_team_members.sql` (versão original)
   
   **💡 Use o `_simple.sql`** - ele só insere dados, sem tentar criar tipos que já existem

### 2️⃣ **Copiar o conteúdo**
   ```
   Ctrl + A (selecionar tudo)
   Ctrl + C (copiar)
   ```

### 3️⃣ **No Supabase SQL Editor**
   - Clicar em: **"+ New query"** (nova aba)

### 4️⃣ **Colar e Executar o SEED**
   ```
   Ctrl + V (colar)
   Ctrl + Enter (executar)
   ```
   OU clicar no botão verde **"Run"**

### 5️⃣ **Verificar Resultado** ✅
   Você verá:
   ```
   ============================================================================
   TEST TEAM MEMBERS CREATED SUCCESSFULLY
   ============================================================================
   Organization: Tampa Test Restaurant
   Total team members: 10
   Active team members: 9
   
   Team Members Summary:
     1. João Silva - Head Chef (admin) - PIN: 1234
     2. Maria Santos - Kitchen Manager (manager) - PIN: 5678
     3. Carlos Oliveira - Sous Chef (leader_chef) - PIN: 9999
     ... (mais 7 team members)
   ```

   E uma tabela mostrando os 10 team members criados.

---

## 🎯 Resumo Rápido das 2 Etapas

```
ETAPA 1: Fix Trigger
  → Abrir: supabase/seeds/00_fix_trigger_before_seed.sql
  → Copiar (Ctrl+A, Ctrl+C)
  → Executar no Supabase SQL Editor
  → Ver: "Function updated successfully!"

ETAPA 2: Seed Data
  → Abrir: supabase/seeds/seed_test_team_members_simple.sql ⭐
  → Copiar (Ctrl+A, Ctrl+C)
  → Executar no Supabase SQL Editor (nova query)
  → Ver: 10 team members criados
```

**⚠️ IMPORTANTE:** Use o arquivo `_simple.sql` se o tipo `team_member_role` já existir no banco!

---

## 🐛 O Que Foi Corrigido?

**Problema 1:** A função `notify_incomplete_team_member_profile()` tentava inserir `location_id` na tabela `feed_items`, mas essa coluna não existe.

**Problema 2:** A função usava `content` ao invés de `message` (campo correto).

**Problema 3:** A função usava valores inválidos nos CHECK constraints:
- ❌ `type: 'team_member_incomplete'` → ✅ `'custom_note'`
- ❌ `priority: 'medium'` → ✅ `'normal'`

**Solução:** Verificamos o schema REAL da tabela `feed_items` (migration `20241227000000_iteration_13_foundation.sql`) e corrigimos TODOS os campos:

**Schema CORRETO de feed_items:**
```sql
CREATE TABLE feed_items (
  organization_id UUID NOT NULL,
  type TEXT NOT NULL,           -- CHECK: task_delegated, pending_docs, custom_note, maintenance, system
  channel TEXT NOT NULL,         -- CHECK: general, baristas, cooks, maintenance (OBRIGATÓRIO!)
  title TEXT NOT NULL,
  message TEXT NOT NULL,         -- NÃO "content"!
  priority TEXT DEFAULT 'normal', -- CHECK: critical, high, normal, low
  created_by UUID,
  -- outros campos...
);
```

**Correção aplicada:**
- ✅ Removido `location_id`
- ✅ Trocado `content` por `message`
- ✅ Adicionado `channel: 'general'` (obrigatório)
- ✅ Trocado `type` para `'custom_note'` (válido no CHECK)
- ✅ Trocado `priority` para `'normal'` (válido no CHECK)

📖 Ver detalhes completos em: `docs/SCHEMA_VERIFICATION_FEED_ITEMS.md`
   
   Team Members Summary:
     1. João Silva - Head Chef (admin) - PIN: 1234
     2. Maria Santos - Kitchen Manager (manager) - PIN: 5678
     3. Carlos Oliveira - Sous Chef (leader_chef) - PIN: 9999
     ... (mais 7 team members)
   ```

   E uma tabela mostrando os 10 team members criados.

---

## 🎯 Alternativa: Criar Migration Temporária

Se preferir automatizar via CLI (requer Docker):

```powershell
# Copiar seed para uma nova migration
Copy-Item "supabase\seeds\seed_test_team_members.sql" "supabase\migrations\99999999999999_seed_team_members.sql"

# Push da migration
npx supabase@latest db push

# Limpar depois
Remove-Item "supabase\migrations\99999999999999_seed_team_members.sql"
```

**⚠️ NOTA:** Esta abordagem NÃO é recomendada pois você não tem Docker instalado.

---

## ✅ Verificação Após Aplicação

Depois de executar, verifique no **Table Editor**:

1. No menu lateral: **"Table Editor"**
2. Selecionar tabela: **`team_members`**
3. Você deve ver **10 registros**

OU execute esta query no SQL Editor:

```sql
SELECT 
  display_name,
  position,
  role_type,
  email,
  is_active,
  profile_complete
FROM team_members
WHERE organization_id = (
  SELECT id FROM organizations 
  WHERE slug = 'tampa-test-restaurant'
)
ORDER BY role_type, display_name;
```

---

## 🚀 Próximos Passos

Após confirmar que os 10 team members foram criados:

1. ✅ Voltar ao VS Code
2. ✅ Me avisar que aplicou com sucesso
3. ✅ Seguir para **PASSO 2** do `NEXT_STEPS_TEAM_MEMBERS.md`

---

**💡 DICA:** Mantenha o Supabase Dashboard aberto - você vai precisar para os testes! 🎨

---

**❓ Problemas?**
- Organization não existe → O script cria automaticamente
- Duplicate key error → Use `ON CONFLICT DO NOTHING` (já está no script)
- Permission denied → Verifique se está logado como owner do projeto
