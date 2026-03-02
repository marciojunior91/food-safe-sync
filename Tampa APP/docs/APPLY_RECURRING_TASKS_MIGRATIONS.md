# 🚀 Guia de Aplicação - Recurring Tasks Refactor

**Data:** 21 de Fevereiro de 2026  
**Migrations:** 20260221_recurring_tasks_refactor.sql + 20260221_migrate_routine_tasks_data.sql

---

## ⚠️ PRÉ-REQUISITOS

- [ ] Backup completo do banco de dados
- [ ] Acesso ao Supabase SQL Editor
- [ ] Permissões de administrador
- [ ] Ambiente de teste disponível (recomendado)

---

## 📝 PASSO A PASSO

### **1. Backup (CRÍTICO!)**

```sql
-- No Supabase Dashboard, vá em:
-- Database → Backups → Create Backup
-- Nome: "pre-recurring-tasks-refactor-2026-02-21"
```

### **2. Aplicar Schema Migration**

1. Abra Supabase SQL Editor
2. Copie o conteúdo de `supabase/migrations/20260221_recurring_tasks_refactor.sql`
3. Cole no editor
4. Clique em "Run"
5. Aguarde confirmação de sucesso

**Tempo estimado:** 30 segundos - 1 minuto

**Validações:**
```sql
-- Verificar se tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('task_series', 'task_occurrences');

-- Resultado esperado: 2 linhas (task_series, task_occurrences)

-- Verificar função
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'generate_task_occurrences';

-- Resultado esperado: 1 linha
```

---

### **3. Aplicar Data Migration**

1. No mesmo SQL Editor
2. Copie o conteúdo de `supabase/migrations/20260221_migrate_routine_tasks_data.sql`
3. Cole no editor
4. Clique em "Run"
5. **LEIA AS MENSAGENS DE LOG** (RAISE NOTICE)

**Tempo estimado:** 1-3 minutos (depende do volume de dados)

**Mensagens Esperadas:**
```
====================================
MIGRATION PRE-CHECK
====================================
Total tasks: X
Recurring tasks: Y
One-time tasks: Z
====================================

Migrated X task series

====================================
MIGRATION RESULTS
====================================
Total occurrences migrated: X
Recurring occurrences: Y
One-time occurrences: Z
====================================

Series [UUID]: created X future occurrences
...

====================================
Total future occurrences created: X
====================================

Data validation: PASSED ✓
```

---

### **4. Validação Pós-Migration**

Execute as queries de validação:

```sql
-- 1. Verificar total de séries criadas
SELECT COUNT(*) AS total_series FROM task_series;

-- 2. Verificar total de ocorrências criadas
SELECT COUNT(*) AS total_occurrences FROM task_occurrences;

-- 3. Verificar ocorrências com série vs sem série
SELECT 
  CASE 
    WHEN series_id IS NOT NULL THEN 'Recurring'
    ELSE 'One-time'
  END AS task_type,
  COUNT(*) AS count
FROM task_occurrences
GROUP BY 1;

-- 4. Verificar distribuição por tipo de recorrência
SELECT 
  recurrence_type,
  COUNT(*) AS count
FROM task_series
GROUP BY recurrence_type
ORDER BY count DESC;

-- 5. Verificar ocorrências futuras (próximos 30 dias)
SELECT 
  scheduled_date,
  COUNT(*) AS tasks_count
FROM task_occurrences
WHERE scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
GROUP BY scheduled_date
ORDER BY scheduled_date;

-- 6. Verificar integridade (não deve retornar nenhuma linha)
SELECT 'Orphaned occurrences' AS issue, COUNT(*) AS count
FROM task_occurrences
WHERE series_id IS NOT NULL 
  AND series_id NOT IN (SELECT id FROM task_series)
UNION ALL
SELECT 'Missing organization_id', COUNT(*)
FROM task_occurrences
WHERE organization_id IS NULL;
```

---

### **5. Teste no Ambiente de Staging (se disponível)**

**Antes de atualizar o código:**

1. Testar queries manualmente:
   ```sql
   -- Listar ocorrências de hoje
   SELECT * FROM task_occurrences 
   WHERE scheduled_date = CURRENT_DATE;
   
   -- Listar séries ativas
   SELECT * FROM task_series 
   WHERE series_end_date IS NULL OR series_end_date > CURRENT_DATE;
   
   -- Gerar ocorrências para série específica
   SELECT generate_task_occurrences(
     '[SERIES_UUID]'::uuid,
     CURRENT_DATE,
     CURRENT_DATE + 7
   );
   ```

2. Verificar RLS policies:
   ```sql
   -- Testar como usuário autenticado (usar Supabase client)
   -- Não deve retornar tasks de outras organizações
   ```

---

### **6. Rollback (se necessário)**

**Se algo der errado:**

```sql
-- 1. Restaurar backup
-- No Supabase Dashboard:
-- Database → Backups → Restore "pre-recurring-tasks-refactor-2026-02-21"

-- OU deletar manualmente as novas tabelas:
DROP TABLE IF EXISTS task_occurrences CASCADE;
DROP TABLE IF EXISTS task_series CASCADE;
DROP FUNCTION IF EXISTS generate_task_occurrences CASCADE;
DROP FUNCTION IF EXISTS update_task_updated_at CASCADE;

-- routine_tasks ainda existe (não foi deletada)
-- Aplicação volta a funcionar com tabela antiga
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Antes de atualizar o código da aplicação:

- [ ] Todas queries de validação executadas com sucesso
- [ ] Contagem de tasks antes = contagem de occurrences depois
- [ ] Séries recorrentes criadas corretamente
- [ ] Ocorrências futuras geradas (próximos 30 dias)
- [ ] RLS policies funcionando (testar com usuário real)
- [ ] Índices criados e funcionando
- [ ] Nenhum erro de integridade referencial
- [ ] Backup confirmado e acessível
- [ ] Log de migration salvo para documentação

---

## 📊 MÉTRICAS ESPERADAS

**Ambiente Tampa Test Restaurant (exemplo):**

- **routine_tasks existentes:** ~50 tasks
- **task_series criadas:** ~10-15 séries
- **task_occurrences migradas:** ~50 (históricas)
- **task_occurrences futuras:** ~100-150 (próximos 30 dias)
- **Total final occurrences:** ~150-200

---

## 🚨 TROUBLESHOOTING

### **Erro: "duplicate key value violates unique constraint"**
**Causa:** Migration rodada mais de uma vez  
**Solução:** 
```sql
-- Limpar tabelas e rodar novamente
TRUNCATE task_occurrences CASCADE;
TRUNCATE task_series CASCADE;
-- Re-executar data migration
```

### **Erro: "function generate_task_occurrences does not exist"**
**Causa:** Schema migration não foi aplicada  
**Solução:** Aplicar `20260221_recurring_tasks_refactor.sql` primeiro

### **Erro: "relation 'routine_tasks' does not exist"**
**Causa:** Banco de dados sem dados de produção  
**Solução:** Normal em ambiente vazio, pular data migration

### **RAISE NOTICE não aparece**
**Causa:** SQL Editor não mostra NOTICE por padrão  
**Solução:** Verificar aba "Messages" ou usar queries de validação acima

---

## 📅 TIMELINE RECOMENDADA

- **Dia 1 (Hoje):** Aplicar migrations + validação
- **Dia 2-3:** Atualizar código TypeScript (types, queries)
- **Dia 4-5:** Implementar UI components
- **Dia 6:** Testes em staging
- **Dia 7:** Deploy para produção
- **Dia 8-21:** Monitoramento (2 semanas)
- **Dia 22:** Deletar tabela `routine_tasks` (se tudo OK)

---

## 🔄 PRÓXIMOS PASSOS

Após aplicar migrations com sucesso:

1. ✅ Atualizar `src/lib/types.ts` (TaskSeries, TaskOccurrence)
2. ✅ Criar queries Supabase (createTaskSeries, etc)
3. ✅ Implementar UI components (RecurrenceConfigModal, etc)
4. ✅ Atualizar RoutineTasks.tsx para usar novas tabelas
5. ✅ Testar fluxo completo
6. ✅ Deploy

---

**Status:** ⏳ Aguardando Aplicação das Migrations  
**Próxima Ação:** Aplicar migrations no Supabase SQL Editor
