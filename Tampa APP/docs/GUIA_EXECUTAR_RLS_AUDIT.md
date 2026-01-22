# 🔒 GUIA: EXECUTAR RLS AUDIT NO SUPABASE

**Objetivo:** Verificar Row Level Security policies em produção  
**Tempo Estimado:** 15-20 minutos  
**Quando:** Próximo passo do BLOCO 1

---

## 📋 PASSO A PASSO

### 1. Acessar Supabase Dashboard
1. Abrir https://supabase.com/dashboard
2. Login com suas credenciais
3. Selecionar projeto Tampa APP
4. Ir para **SQL Editor** (menu lateral esquerdo)

---

### 2. Executar Queries de Audit

**Arquivo:** `docs/CHECK_RLS_POLICIES.sql`

#### Query #1: Verificar RLS Enabled
```sql
-- Copiar da linha 13-32 do arquivo CHECK_RLS_POLICIES.sql
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations', 'profiles', 'user_roles', 'team_members',
    'products', 'categories', 'subcategories', 'allergens',
    'printed_labels', 'recipes', 'routine_tasks', 'feed_posts',
    'zebra_printers'
  )
ORDER BY tablename;
```

**O que verificar:**
- ✅ Todas as tabelas devem ter `rls_enabled = true`
- 🚨 Se alguma tabela tem `rls_enabled = false`, é **SECURITY RISK**

---

#### Query #8: Zebra Printers Isolation (CRÍTICO!)
```sql
-- Copiar da linha 99-106 do arquivo CHECK_RLS_POLICIES.sql
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'zebra_printers'
ORDER BY policyname;
```

**O que verificar:**
- ✅ Deve existir pelo menos 1 policy
- ✅ Policy deve ter filtro `organization_id`
- 🚨 Se NÃO existir policy, **CRITICAL BUG** - orgs podem ver impressoras de outras orgs

---

#### Query #9: Tabelas Sem RLS (SECURITY SCAN)
```sql
-- Copiar da linha 109-119 do arquivo CHECK_RLS_POLICIES.sql
SELECT 
  schemaname,
  tablename,
  'WARNING: RLS NOT ENABLED!' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;
```

**O que verificar:**
- ✅ Lista deve estar VAZIA (ideal)
- 🟡 Se listar tabelas internas do sistema, OK
- 🚨 Se listar tabelas de dados (products, team_members, etc), **BLOCKER**

---

#### Query #10: Policies Sem Org Filter (DATA LEAKAGE!)
```sql
-- Copiar da linha 122-143 do arquivo CHECK_RLS_POLICIES.sql
SELECT 
  tablename,
  policyname,
  cmd,
  'POTENTIAL LEAK: No org filter' as warning
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'SELECT'
  AND tablename IN (
    'products', 'categories', 'subcategories',
    'team_members', 'routine_tasks', 'feed_posts'
  )
  AND (
    qual NOT LIKE '%organization_id%'
    OR qual IS NULL
  )
ORDER BY tablename, policyname;
```

**O que verificar:**
- ✅ Lista deve estar VAZIA (ideal)
- 🚨 Se listar policies, **DATA LEAKAGE RISK** - usuários podem ver dados de outras orgs

---

### 3. Anotar Resultados

Criar arquivo: `docs/RLS_AUDIT_RESULTS.txt`

```
==========================================
RLS AUDIT RESULTS - 21 Jan 2026
==========================================

Query #1 - RLS Enabled:
[ ] Todas as tabelas têm RLS = true
[ ] Tabelas SEM RLS: _______________

Query #8 - Zebra Printers:
[ ] zebra_printers tem policies
[ ] Policy filtra por organization_id
[ ] ISSUE: _______________

Query #9 - Tabelas Sem RLS:
[ ] Lista vazia (OK)
[ ] Tabelas encontradas: _______________

Query #10 - Policies Sem Org Filter:
[ ] Lista vazia (OK)
[ ] Policies encontradas: _______________

==========================================
CONCLUSION:
[ ] ✅ RLS SECURE - No issues found
[ ] ⚠️ MINOR ISSUES - Fix recommended
[ ] 🚨 CRITICAL ISSUES - Fix required
==========================================
```

---

### 4. Interpretar Resultados

#### CENÁRIO 1: Tudo OK ✅
```
Query #1: Todas tabelas com RLS = true
Query #8: zebra_printers tem policy com org filter
Query #9: Lista vazia
Query #10: Lista vazia
```
**Ação:** Documentar sucesso, continuar para production testing

---

#### CENÁRIO 2: zebra_printers sem RLS 🚨
```
Query #1: zebra_printers com RLS = false
Query #8: Sem policies
```
**Ação:** Criar e aplicar migration `FIX_ZEBRA_PRINTERS_RLS.sql`

**Migration:**
```sql
-- Habilitar RLS
ALTER TABLE zebra_printers ENABLE ROW LEVEL SECURITY;

-- Policy SELECT
CREATE POLICY "Users can view printers in their org"
  ON zebra_printers FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE user_id = auth.uid()
    )
  );

-- Policy ALL (INSERT/UPDATE/DELETE)
CREATE POLICY "Users can manage printers in their org"
  ON zebra_printers FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE user_id = auth.uid()
    )
  );
```

---

#### CENÁRIO 3: Outras tabelas sem org filter 🚨
```
Query #10: Lista policies sem organization_id
```
**Ação:** Analisar cada policy, criar fix específico

---

### 5. Aplicar Fixes (se necessário)

#### Se precisa criar migration:
1. Criar arquivo: `supabase/migrations/20260121000000_fix_rls_[table].sql`
2. Copiar SQL do fix
3. Aplicar via Supabase Dashboard (SQL Editor)
4. Verificar com query #1 novamente

#### Se precisa testar manualmente:
1. Criar 2 orgs: Org A, Org B
2. Criar user em cada org
3. Login como User A → verificar vê apenas dados Org A
4. Login como User B → verificar vê apenas dados Org B

---

## ⏱️ TEMPO ESPERADO

- Query #1: 1 minuto
- Query #8: 1 minuto
- Query #9: 1 minuto
- Query #10: 1 minuto
- Análise: 5 minutos
- Documentar: 5 minutos
- **TOTAL: ~15 minutos** (se tudo OK)

Se precisar criar fix:
- Criar migration: 10 minutos
- Aplicar: 2 minutos
- Testar: 5 minutos
- **TOTAL COM FIX: ~35 minutos**

---

## ✅ CHECKLIST

Antes de executar:
- [ ] Acesso ao Supabase Dashboard
- [ ] Arquivo CHECK_RLS_POLICIES.sql aberto
- [ ] RLS_AUDIT_RESULTS.txt pronto para anotar

Durante execução:
- [ ] Query #1 executada
- [ ] Query #8 executada (zebra_printers)
- [ ] Query #9 executada
- [ ] Query #10 executada
- [ ] Resultados anotados

Depois de executar:
- [ ] Resultados analisados
- [ ] Issues identificados
- [ ] Fixes criados (se necessário)
- [ ] Fixes aplicados (se necessário)
- [ ] BLOCO_1_RLS_AUDIT.md atualizado

---

## 🚀 PRÓXIMO PASSO APÓS AUDIT

**Se RLS OK:**
→ Continuar para Production Testing (DIA 2)

**Se RLS tem issues:**
→ Fix BLOCKER issues primeiro
→ Depois continuar para Production Testing

---

**ARQUIVO REFERÊNCIA:** `docs/CHECK_RLS_POLICIES.sql`  
**DOCUMENTAÇÃO:** `docs/BLOCO_1_RLS_AUDIT.md`  
**RESULTADOS:** `docs/RLS_AUDIT_RESULTS.txt` (criar)
