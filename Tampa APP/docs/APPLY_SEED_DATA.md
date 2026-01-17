# 🌱 Aplicar Seed Data - Team Members

**Data:** 2026-01-04  
**Status:** ⏳ Pendente

---

## 📋 Opções para Aplicar o Seed Script

### **OPÇÃO 1: Supabase Dashboard (Recomendado)** 🌐

Esta é a maneira mais simples e visual:

1. **Abrir Supabase Dashboard**
   - Ir para: https://supabase.com/dashboard
   - Selecionar seu projeto Tampa APP

2. **Abrir SQL Editor**
   - No menu lateral, clicar em **"SQL Editor"**
   - Clicar em **"New query"**

3. **Copiar e Colar o Script**
   - Abrir arquivo: `supabase/seeds/seed_test_team_members.sql`
   - Copiar TODO o conteúdo (Ctrl+A, Ctrl+C)
   - Colar no SQL Editor (Ctrl+V)

4. **Executar**
   - Clicar em **"Run"** (ou pressionar Ctrl+Enter)
   - Aguardar conclusão

5. **Verificar Resultado**
   - Você verá mensagens de NOTICE no console
   - Deve aparecer uma tabela com os 10 team members criados

---

### **OPÇÃO 2: Via psql (Terminal)** 💻

Se você tem PostgreSQL instalado localmente:

```powershell
# Obter connection string do Supabase
# Dashboard > Settings > Database > Connection string (Direct connection)

# Exemplo (substitua com seus dados):
$env:PGPASSWORD="sua_senha_aqui"
psql -h db.xxxxx.supabase.co -p 5432 -U postgres -d postgres -f "supabase\seeds\seed_test_team_members.sql"
```

---

### **OPÇÃO 3: Via Supabase Studio (SQL Editor Local)** 🖥️

Se você tem o Supabase rodando localmente:

```powershell
# 1. Iniciar Supabase local (se ainda não estiver rodando)
npx supabase@latest start

# 2. Abrir Studio local
# Ir para: http://localhost:54323

# 3. Navegar para SQL Editor

# 4. Copiar e colar o conteúdo do seed_test_team_members.sql

# 5. Executar
```

---

## ✅ Verificação Após Aplicação

Após aplicar o script, execute esta query para verificar:

```sql
-- Verificar team members criados
SELECT 
  display_name,
  position,
  role_type,
  email,
  is_active,
  profile_complete,
  created_at
FROM team_members
WHERE organization_id = (
  SELECT id FROM organizations 
  WHERE slug = 'tampa-test-restaurant'
)
ORDER BY 
  CASE role_type
    WHEN 'admin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'leader_chef' THEN 3
    WHEN 'cook' THEN 4
    WHEN 'barista' THEN 5
  END,
  display_name;
```

**Resultado Esperado:** 10 linhas retornadas

---

## 📊 Team Members Criados

Após a execução bem-sucedida, você terá:

| # | Nome | Cargo | Role | PIN | Status |
|---|------|-------|------|-----|--------|
| 1 | João Silva | Head Chef | admin | 1234 | ✅ Ativo |
| 2 | Maria Santos | Kitchen Manager | manager | 5678 | ✅ Ativo |
| 3 | Carlos Oliveira | Sous Chef | leader_chef | 9999 | ✅ Ativo |
| 4 | Ana Costa | Line Cook | cook | 1111 | ✅ Ativo |
| 5 | Pedro Almeida | Line Cook | cook | 2222 | ✅ Ativo |
| 6 | Lucia Fernandes | Prep Cook | cook | 3333 | ✅ Ativo |
| 7 | Roberto Lima | Head Barista | barista | 4444 | ✅ Ativo |
| 8 | Sofia Rodrigues | Barista | barista | 5555 | ✅ Ativo |
| 9 | Teste Incomplete | N/A | cook | 0000 | ⚠️ Perfil Incompleto |
| 10 | Ex-Employee Test | Former Cook | cook | N/A | ❌ Inativo |

---

## 🐛 Troubleshooting

### Erro: "organization not found"

**Causa:** A organização 'tampa-test-restaurant' não existe

**Solução:** O script cria automaticamente. Mas se precisar criar manualmente:

```sql
INSERT INTO organizations (name, slug, status)
VALUES ('Tampa Test Restaurant', 'tampa-test-restaurant', 'active')
ON CONFLICT DO NOTHING;
```

### Erro: "duplicate key violation"

**Causa:** Team members já existem

**Solução:** O script usa `ON CONFLICT DO NOTHING`, então é seguro executar novamente. Se quiser limpar antes:

```sql
-- CUIDADO: Isso apaga todos os team members da organização de teste
DELETE FROM team_members 
WHERE organization_id = (
  SELECT id FROM organizations WHERE slug = 'tampa-test-restaurant'
);
```

### Erro: "relation team_members does not exist"

**Causa:** Migrations não foram aplicadas

**Solução:** 
```powershell
# Verificar status das migrations
npx supabase@latest migration list --linked

# Se necessário, aplicar migrations
npx supabase@latest db push
```

---

## 📝 Próximos Passos

Após aplicar o seed data:

1. ✅ **Verificar dados no Dashboard**
   - Table Editor > team_members
   - Confirmar 10 registros

2. ✅ **Testar no Frontend**
   - Ver `NEXT_STEPS_TEAM_MEMBERS.md` - PASSO 3

3. ✅ **Criar User Roles**
   - Ver `NEXT_STEPS_TEAM_MEMBERS.md` - PASSO 2

---

**⚡ Ação Imediata:** Escolha OPÇÃO 1 (Dashboard) e execute o script agora!
