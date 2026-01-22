# 🎯 PLANO DE FEATURES - REORGANIZAÇÃO DO MENU

**Data:** 22 Jan 2026  
**Status:** 🔄 EM ANDAMENTO  

---

## 🗑️ MÓDULOS PARA REMOVER

### 1. **Drafts** (Draft Management)
- **Arquivo:** `src/pages/DraftManagement.tsx`
- **Rota:** `/drafts`
- **Menu:** "Drafts" (FileText icon)
- **Motivo:** Feature descontinuada, não será usada no MVP

### 2. **Product Traffic Light**
- **Arquivo:** `src/pages/ProductTrafficLight.tsx`
- **Rota:** `/traffic-light`
- **Menu:** "Product Traffic Light" (Lightbulb icon)
- **Motivo:** Feature descontinuada, substituída por Expiring Soon

**Observação:** Os **utils** de traffic light (`@/utils/trafficLight`) serão **MANTIDOS** pois são usados em Labeling e QuickPrintGrid para badges de status.

---

## ✨ FEATURES NOVAS PARA ADICIONAR

### 3. **Expiring Soon** 🆕
- **Rota:** `/expiring-soon`
- **Menu:** Logo APÓS "Labeling"
- **Icon:** AlertTriangle (laranja/vermelho)
- **Descrição:** Produtos expirando em 24-72h
- **Features:**
  - Lista produtos por urgência
  - Filter por categoria
  - Traffic light status
  - Quick actions (reprint, waste)

### 4. **Knowledge Base** 🆕
- **Rota:** `/knowledge-base`
- **Menu:** Próximo ao "Training"
- **Icon:** BookOpen
- **Descrição:** Wiki/docs interno
- **Features:**
  - Articles por categoria
  - Search full-text
  - Favorites
  - Recent articles

### 5. **Training Center** (renomear atual)
- **Rota:** `/training` (mantém)
- **Menu:** "Training Center" (expandir nome)
- **Icon:** GraduationCap (mantém)
- **Features:**
  - Vídeos tutoriais
  - Quizzes
  - Certificates
  - Progress tracking

---

## 📋 NOVA ORDEM DO MENU LATERAL

### Proposta de Reorganização (Lógica de Workflow):

```
1. 📊 Dashboard              (BarChart3)
2. 🏷️ Labeling               (Tags)
3. ⚠️ Expiring Soon          (AlertTriangle) 🆕
4. 📦 Inventory              (Package)
5. 🍳 Recipes                (ClipboardList)
6. 📅 Routine Tasks          (Calendar)
7. 👥 People                 (Users)
8. 🔔 Feed                   (Bell)
9. 📚 Knowledge Base         (BookOpen) 🆕
10. 🎓 Training Center       (GraduationCap)
11. 📈 Analytics             (BarChart3)
12. ⚙️ Settings              (Settings)
```

**Rationale:**
- **Labeling → Expiring Soon** - Workflow natural (imprimir → monitorar expiry)
- **Inventory → Recipes** - Gestão de produtos
- **Routine Tasks** - Operacional diário
- **People → Feed** - Colaboração e comunicação
- **Knowledge Base → Training** - Aprendizado agrupado
- **Analytics → Settings** - Admin no final

---

## 🔧 IMPLEMENTAÇÃO

### FASE 1: Remoção (15min)
- [ ] Remover rota `/drafts` de App.tsx
- [ ] Remover rota `/traffic-light` de App.tsx
- [ ] Remover imports de DraftManagement e ProductTrafficLight
- [ ] Remover items "Drafts" e "Product Traffic Light" do navigation array
- [ ] Manter utils/trafficLight.ts (usado em Labeling)

### FASE 2: Reorganizar Menu (10min)
- [ ] Reordenar navigation array conforme proposta
- [ ] Adicionar placeholder para Expiring Soon
- [ ] Adicionar placeholder para Knowledge Base
- [ ] Renomear "Training" → "Training Center"

### FASE 3: Criar Expiring Soon Page (60min)
- [ ] Criar `src/pages/ExpiringSoon.tsx`
- [ ] Lista produtos com expiry date < 72h
- [ ] Traffic light badges (vermelho < 24h, amarelo < 72h)
- [ ] Filters: categoria, urgência
- [ ] Actions: reprint label, mark as waste
- [ ] Org filtering (organization_id)

### FASE 4: Criar Knowledge Base Page (90min)
- [ ] Criar `src/pages/KnowledgeBase.tsx`
- [ ] Articles table no Supabase (ou usar existente)
- [ ] List/Grid view
- [ ] Search functionality
- [ ] Categories sidebar
- [ ] Article detail view
- [ ] Org filtering

### FASE 5: Expandir Training Center (60min)
- [ ] Verificar página atual `src/pages/Training.tsx`
- [ ] Adicionar vídeos embed (YouTube/Vimeo)
- [ ] Progress tracking
- [ ] Quiz component (se tempo permitir)

---

## 🎯 PRIORIDADES

**MUST HAVE (hoje):**
- ✅ Remover Drafts
- ✅ Remover Product Traffic Light
- ✅ Reorganizar menu
- ✅ Criar Expiring Soon page (básico)

**SHOULD HAVE (amanhã):**
- 🟡 Knowledge Base page (básico)
- 🟡 Training Center melhorias

**NICE TO HAVE (se tempo):**
- 🟢 Quiz no Training
- 🟢 Favorites no KB
- 🟢 Advanced filters no Expiring Soon

---

## 📊 ESTIMATIVA DE TEMPO

- Remoção: 15min
- Reorganizar menu: 10min
- Expiring Soon (básico): 60min
- Knowledge Base (básico): 90min
- Training improvements: 60min

**Total:** ~3.5 horas

---

**READY TO EXECUTE!** ✅  
**COMEÇANDO AGORA COM REMOÇÃO!** 🗑️
