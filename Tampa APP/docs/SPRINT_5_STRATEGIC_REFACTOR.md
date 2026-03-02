# 🏗️ Sprint 5 - Strategic Refactor Plan

**Início:** 21 de Fevereiro de 2026  
**Estratégia:** Resolver múltiplos bugs através de refactors arquiteturais  
**Status:** 🟢 Em Progresso

---

## 📋 OVERVIEW

**Filosofia:** Em vez de corrigir bugs isoladamente, vamos refatorar sistemas inteiros que resolvem múltiplos problemas simultaneamente e melhoram a arquitetura geral.

**Benefícios:**
- ✅ Resolve 5 bugs críticos de uma vez
- ✅ Melhora qualidade do código
- ✅ Adiciona features robustas (frequências customizáveis, subtasks avançadas)
- ✅ Facilita manutenção futura
- ✅ Reduz débito técnico

---

## 🎯 FASE 1: RECURRING TASKS REFACTOR (12-15h)

### **Problemas Resolvidos:**
- 🔴 **TASKS-16:** Task recorrente marca como completa (BUG CRÍTICO)
- 🟡 **TASKS-18:** Date picker touch-friendly
- 🟢 **TASKS-8:** Renomear "Biweekly" → "Fortnightly"

### **Features Adicionadas:**
- ✅ Modelo Série + Ocorrências (Microsoft Teams)
- ✅ Modal de contexto (editar/deletar ocorrência vs série)
- ✅ Frequências customizáveis:
  - Every X days
  - Specific weekdays (Mon/Wed/Fri)
  - Day of month (todo dia 15)
- ✅ Criação sob demanda (rolling window)
- ✅ Cadência mantida independente de conclusão

---

### **CHECKLIST - FASE 1**

#### **1.1 Database Schema** ✅ COMPLETO
- [x] Criar migration `20260221_recurring_tasks_refactor.sql` ✅
- [x] Criar tabela `task_series` ✅
- [x] Criar tabela `task_occurrences` ✅
- [x] Adicionar índices de performance ✅
- [x] Criar função `generate_task_occurrences()` ✅
- [x] Criar trigger para auto-geração ✅
- [x] Migration de dados existentes (`20260221_migrate_routine_tasks_data.sql`) ✅
- [x] RLS Policies criadas ✅
- [x] Documentação completa (comments) ✅

#### **1.2 Backend Types & Queries** ⏳
- [ ] Criar tipos TypeScript (`TaskSeries`, `TaskOccurrence`)
- [ ] Atualizar `src/lib/types.ts`
- [ ] Criar queries Supabase:
  - `createTaskSeries()`
  - `createTaskOccurrence()`
  - `updateTaskOccurrence()`
  - `updateTaskSeries()`
  - `deleteTaskOccurrence()`
  - `deleteTaskSeries()`
  - `getTaskOccurrences(dateRange)`

#### **1.3 UI Components** ⏳
- [ ] Criar `RecurrenceConfigModal.tsx`
- [ ] Criar `EditDeleteContextModal.tsx`
- [ ] Criar `FrequencySelector.tsx`
- [ ] Criar `WeekdaySelector.tsx`
- [ ] Atualizar `CreateTaskForm.tsx`
- [ ] Atualizar `TaskCard.tsx` (indicador de série)
- [ ] Criar hook `useRecurringTasks()`

#### **1.4 Business Logic** ⏳
- [ ] Criar `generateOccurrences()` algorithm
- [ ] Criar `shouldCreateOccurrence()` checker
- [ ] Criar `getNextDate()` calculator
- [ ] Implementar rolling window (30 dias)
- [ ] Implementar cadência independente de conclusão

#### **1.5 Migration & Testing** ⏳
- [ ] Migrar tasks existentes
- [ ] Testar criação de séries
- [ ] Testar edição (ocorrência vs série)
- [ ] Testar deleção (ocorrência vs série)
- [ ] Testar todas frequências
- [ ] Validar performance (índices)

---

## 🎯 FASE 2: DATE CALCULATION AUDIT (6-8h)

### **Problemas Resolvidos:**
- 🔴 **EXPIRING-10:** Cálculo de datas incorreto (BUG CRÍTICO)
- 🔴 **RECIPES-12:** Data não recalcula ao mudar condition (BUG CRÍTICO)
- 🔴 **RECIPES-17:** Auditoria geral de datas (CRÍTICA)

### **Escopo:**
- ✅ Auditar TODA lógica de cálculo de datas
- ✅ Criar testes unitários
- ✅ Documentar regras de negócio
- ✅ Centralizar lógica em utility functions

---

### **CHECKLIST - FASE 2**

#### **2.1 Auditoria de Código** ✅
- [ ] Mapear todos os locais onde datas são calculadas:
  - `LabelForm.tsx` (print label)
  - `RecipeForm.tsx` (print label from recipe)
  - `ExpiringSoon.tsx` (extend date)
  - `QuickPrint.tsx` (quick print)
- [ ] Identificar inconsistências
- [ ] Documentar regras atuais

#### **2.2 Regras de Negócio** ⏳
- [ ] Documentar shelf life por storage condition:
  - Frozen: +30 dias
  - Refrigerated: +7 dias
  - Room Temperature (Ambient): +3 dias
  - Hot: +4 horas
- [ ] Documentar modificadores por categoria
- [ ] Definir prioridades (condition vs category vs recipe default)

#### **2.3 Utility Functions** ⏳
- [ ] Criar `src/utils/dateCalculations.ts`
- [ ] Função `calculateExpiryDate(prepDate, storageCondition, shelfLifeDays)`
- [ ] Função `getStorageConditionModifier(condition)`
- [ ] Função `recalculateOnConditionChange(currentDate, oldCondition, newCondition)`
- [ ] Adicionar validações de edge cases

#### **2.4 Refactor Componentes** ⏳
- [ ] Atualizar `LabelForm.tsx` para usar utilities
- [ ] Atualizar `RecipeForm.tsx` para usar utilities
- [ ] Atualizar `ExpiringSoon.tsx` para usar utilities
- [ ] Atualizar `QuickPrint.tsx` para usar utilities
- [ ] Garantir recálculo automático ao mudar condition

#### **2.5 Testes Unitários** ⏳
- [ ] Criar `dateCalculations.test.ts`
- [ ] Testar cada storage condition
- [ ] Testar mudanças de condition
- [ ] Testar edge cases (meia-noite, DST, etc)
- [ ] Testar extend dates
- [ ] Documentar casos de teste

---

## 🎯 FASE 3: BUGS RESTANTES (8-10h)

Após refactors, atacar bugs menores em sequência:

### **3.1 Expiring Soon Bugs** (3h)
- [ ] **EXPIRING-6:** Produto descartado não some
- [ ] **EXPIRING-9:** Extended não atualiza urgência

### **3.2 Routine Tasks Bugs** (5h)
- [ ] **TASKS-12:** Subtasks não aparecem (refactor completo)
- [ ] **TASKS-6:** Schedule Time não funciona (desktop)
- [ ] **TASKS-13:** Upload de foto falha
- [ ] **TASKS-14:** Task não aparece em lista

### **3.3 Recipes Bug** (1h)
- [ ] **RECIPES-5:** Filtro "Mains" não funciona

---

## 📊 PROGRESSO GERAL

### **Tempo Estimado Total:** 26-33 horas

- **Fase 1 (Recurring Tasks):** 12-15h ⏳ EM PROGRESSO
- **Fase 2 (Date Audit):** 6-8h ⏳ AGUARDANDO
- **Fase 3 (Bugs Restantes):** 8-10h ⏳ AGUARDANDO

### **Bugs Resolvidos:**
- **Críticos:** 5/13 (após Fase 1+2)
- **Total:** 5/48

### **Features Adicionadas:**
- Recurring tasks modelo Teams ✨
- Frequências customizáveis ✨
- Date calculation utilities ✨
- Subtasks avançadas (Fase 3) ✨

---

## 🚀 PRÓXIMA AÇÃO

**AGORA:** Começar Fase 1.1 - Database Schema

Vou criar:
1. Migration SQL completa
2. Função de geração de ocorrências
3. Trigger automático
4. Migration de dados existentes

**Pronto para começar?** ✅
