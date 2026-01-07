# 🔍 Schema Verification - feed_items Table

**Data:** 2026-01-04  
**Status:** ✅ Verificado e Corrigido

---

## 🚨 LIÇÃO IMPORTANTE

**NUNCA assuma campos genéricos!** Sempre verifique o schema REAL antes de fazer INSERT/UPDATE.

---

## 📋 Schema REAL da Tabela feed_items

**Fonte:** `supabase/migrations/20241227000000_iteration_13_foundation.sql`

```sql
CREATE TABLE IF NOT EXISTS feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  channel TEXT NOT NULL,                    -- ⚠️ OBRIGATÓRIO
  title TEXT NOT NULL,
  message TEXT NOT NULL,                    -- ⚠️ É "message", NÃO "content"!
  priority TEXT DEFAULT 'normal',
  created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  related_entity_type TEXT,
  related_entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  CONSTRAINT check_feed_type CHECK (type IN (
    'task_delegated',
    'pending_docs',
    'custom_note',                          -- ⚠️ Usar este para team members
    'maintenance',
    'system'
  )),
  CONSTRAINT check_channel CHECK (channel IN (
    'general',                              -- ⚠️ Usar este para team members
    'baristas',
    'cooks',
    'maintenance'
  )),
  CONSTRAINT check_priority CHECK (priority IN (
    'critical', 
    'high', 
    'normal',                               -- ⚠️ Usar este por padrão
    'low'
  ))
);
```

---

## ❌ Campos que NÃO Existem (Erros Comuns)

| Campo Assumido | Por Que NÃO Existe | Campo Correto |
|----------------|-------------------|---------------|
| `content` | Nunca foi criado | `message` |
| `location_id` | Não faz parte do schema | Remover |
| `status` | Não existe | Usar `metadata` JSONB |
| `priority: 'medium'` | Não está no CHECK | Usar 'normal' ou 'high' |
| `type: 'team_member_incomplete'` | Não está no CHECK | Usar 'custom_note' |

---

## ✅ Correções Aplicadas

### 1. **Função Trigger Corrigida**

**ANTES (ERRADO):**
```sql
INSERT INTO feed_items (
  organization_id,
  location_id,          -- ❌ NÃO EXISTE
  type,
  title,
  content,              -- ❌ NÃO EXISTE (é "message")
  priority,
  created_by
) VALUES (
  NEW.organization_id,
  NEW.location_id,
  'team_member_incomplete',  -- ❌ NÃO está no CHECK constraint
  'Complete Your Profile',
  format('...'),
  'medium',             -- ❌ NÃO está no CHECK constraint
  NEW.created_by
);
```

**DEPOIS (CORRETO):**
```sql
INSERT INTO feed_items (
  organization_id,
  type,
  channel,              -- ✅ OBRIGATÓRIO
  title,
  message,              -- ✅ CORRETO
  priority,
  created_by
) VALUES (
  NEW.organization_id,
  'custom_note',        -- ✅ Válido no CHECK constraint
  'general',            -- ✅ Obrigatório e válido
  'Complete Your Profile',
  format('Welcome %s! Please complete your profile by filling in: %s', 
    NEW.display_name, 
    array_to_string(NEW.required_fields_missing, ', ')
  ),
  'normal',             -- ✅ Válido no CHECK constraint
  NEW.created_by
);
```

---

## 🔧 Arquivos Corrigidos

1. ✅ `supabase/seeds/00_fix_trigger_before_seed.sql`
2. ✅ `supabase/migrations/20260104000003_fix_team_members_trigger.sql`
3. ✅ `supabase/migrations/20260103000000_create_team_members_table.sql`

---

## 📝 Processo de Verificação de Schema (Para Futuro)

### Antes de Fazer INSERT/UPDATE em Qualquer Tabela:

```bash
# 1. Procurar CREATE TABLE da tabela
grep -r "CREATE TABLE.*nome_da_tabela" supabase/migrations/

# 2. Ler o schema completo
# Verificar:
# - Quais colunas existem
# - Quais são NOT NULL (obrigatórias)
# - Quais têm DEFAULT values
# - Quais têm CHECK constraints (valores permitidos)
# - Quais têm REFERENCES (foreign keys)

# 3. Testar INSERT manualmente no SQL Editor primeiro
# Antes de criar triggers ou migrations
```

### Checklist de Validação:

- [ ] Todas as colunas NOT NULL estão incluídas no INSERT?
- [ ] Todos os valores respeitam CHECK constraints?
- [ ] Foreign keys apontam para registros existentes?
- [ ] Tipos de dados estão corretos (TEXT, UUID, TIMESTAMP, etc.)?
- [ ] Campos com DEFAULT não precisam ser especificados (exceto se override)

---

## 🎯 Para o Team Members Integration

**Campos CORRETOS para feed_items:**

```sql
-- Notificação de perfil incompleto
INSERT INTO feed_items (
  organization_id,      -- UUID da organização
  type,                 -- 'custom_note'
  channel,              -- 'general' (obrigatório)
  title,                -- TEXT
  message,              -- TEXT (NÃO content!)
  priority,             -- 'normal' | 'high' | 'low' | 'critical'
  created_by            -- UUID do user
) VALUES (...);
```

---

## 📚 Referências

- Migration fonte: `20241227000000_iteration_13_foundation.sql`
- Tabela: `feed_items`
- Linhas: 212-250
- Documentação: `docs/iteration-13-integrated-modules/DATABASE_SCHEMA.sql`

---

**✅ STATUS:** Schema verificado e todas as funções corrigidas. Pronto para aplicar seed data.
