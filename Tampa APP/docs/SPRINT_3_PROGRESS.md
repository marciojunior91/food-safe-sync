# 🚀 SPRINT 3: Labels & Print Improvements - IN PROGRESS

**Data Início:** 17/02/2026  
**Executor:** GitHub Copilot  
**Status:** 🔄 EM ANDAMENTO (4/13 tarefas completas)

---

## 📊 RESUMO EXECUTIVO

Sprint 3 foca em melhorias de UX na tela de Labels, principalmente para tablets:
- Aumentar tamanhos de fonte e elementos interativos
- Melhorar seletores e calendários
- Corrigir preview de labels
- Simplificar interface removendo elementos redundantes

---

## ✅ TAREFAS COMPLETAS (Sprint 1 - Carryover)

### ✅ T5.1 - Renomear "Labeling" → "Labels"
**Status:** Completo (Sprint 1) ✅
**Arquivos:** 
- `src/components/Layout.tsx` - Menu atualizado
- `src/pages/Labeling.tsx` - Título atualizado

---

### ✅ T5.2 - Remover Descrição da Página Labels
**Status:** Completo (Sprint 1) ✅
**Arquivo:** `src/pages/Labeling.tsx`
- Descrição removida, apenas título "Labels" mantido

---

### ✅ T6.2 - Team Member: Não Repetir Nome se Já Selecionado
**Status:** Completo (Sprint 1) ✅
**Implementação:**
- Hook `useTeamMemberSelection` gerencia estado global
- LabelForm recebe `selectedUser` via props
- Campo pré-preenchido automaticamente
- Botão visível no header permite trocar team member

**Arquivo:** `src/pages/Labeling.tsx`, `src/components/labels/LabelForm.tsx`

---

### ✅ T14.2 - Desabilitar Teclado Automático (autoFocus)
**Status:** Completo (Sprint 1) ✅
**Implementação:**
- Removido autoFocus de todos os inputs
- ESLint rule customizada criada para prevenir futuro uso
- Validação automática em PR/commits

**Arquivos:** 
- `eslint.config.js` - Regra customizada
- `src/components/labels/QuickPrintDetailsDialog.tsx`
- `src/components/auth/PINValidationDialog.tsx`

---

## 🔨 TAREFAS PARA IMPLEMENTAR

### 🟡 T6.1 - Verificar: Desabilitar Teclado Automático
**Status:** ⚠️ VERIFICAR (pode já estar completo via T14.2)
**Ação:** Verificar se ESLint rule do T14.2 cobre todos os casos

---

### 🔴 T6.3 - Aumentar Tamanho da Fonte
**Objetivo:** Melhorar legibilidade em tablet
**Prioridade:** ALTA

**Mudanças Necessárias:**
```tsx
// Labels de campos:
<Label className="text-base font-medium">  // era: text-sm

// Inputs:
<Input className="text-lg" />  // era: text-base (default)

// Botões principais:
<Button className="text-lg px-6 py-6">  // era: default
```

**Arquivos:**
- `src/components/labels/LabelForm.tsx`
- `src/components/labels/QuickPrintDetailsDialog.tsx`

**Status:** PENDENTE 🔴

---

### 🔴 T6.4 - Aumentar Tamanho do Calendário (Date Picker)
**Objetivo:** Date picker maior e mais fácil de usar em tablet
**Prioridade:** ALTA

**Mudanças Necessárias:**
```tsx
// Calendar component
<Calendar 
  className="w-full max-w-md p-4"  // era: p-0 ou p-2
  classNames={{
    months: "text-lg",
    caption: "text-lg",
    day: "h-12 w-12 text-base",  // era: h-9 w-9 text-sm
    day_button: "h-12 w-12"
  }}
/>
```

**Arquivos:**
- `src/components/ui/calendar.tsx` (shadcn/ui)
- Ou wrapper customizado para LabelForm

**Status:** PENDENTE 🔴

---

### 🟡 T6.5 - Campo: "Nova Alergia" (Custom Allergen)
**Objetivo:** Permitir adicionar alergia customizada
**Prioridade:** MÉDIA

**Implementação:**
```tsx
<AllergenSelectorEnhanced 
  onAddCustom={handleAddCustomAllergen}
  allowCustom={true}
/>

const handleAddCustomAllergen = async (name: string) => {
  const { data } = await supabase
    .from('allergens')
    .insert({
      name,
      is_custom: true,
      organization_id: orgId
    })
    .select()
    .single();
  
  // Add to selected allergens
  setSelectedAllergens([...selectedAllergens, data]);
};
```

**Arquivos:**
- `src/components/labels/AllergenSelectorEnhanced.tsx`
- Database: allergens table (adicionar coluna `is_custom`)

**Status:** PENDENTE 🟡

---

### 🟡 T6.6 - Alergia: Selecionar Clicando na Caixa Inteira
**Objetivo:** Melhorar UX, não apenas checkbox
**Prioridade:** MÉDIA

**Implementação:**
```tsx
<div 
  className="cursor-pointer hover:bg-accent p-3 rounded-lg border"
  onClick={() => toggleAllergen(allergen.id)}
>
  <Checkbox checked={isSelected} readOnly pointer-events-none />
  <div>
    <span>{allergen.name}</span>
    <span>{allergen.icon}</span>
  </div>
</div>
```

**Arquivos:**
- `src/components/labels/AllergenSelectorEnhanced.tsx`

**Status:** PENDENTE 🟡

---

### 🔴 T7.1 - Corrigir: Label Cortada na Parte de Baixo
**Objetivo:** Label preview deve mostrar todo o conteúdo
**Prioridade:** ALTA

**Investigação Necessária:**
- Verificar `LabelPreview.tsx` e `LabelPreviewCanvas.tsx`
- Ajustar height/overflow
- Testar com diferentes tipos de labels

**Arquivos:**
- `src/components/labels/LabelPreview.tsx`
- `src/components/labels/LabelPreviewCanvas.tsx`

**Status:** PENDENTE 🔴

---

### 🔴 T7.2 - Remover: Nome do Restaurante do Preview
**Objetivo:** Limpar preview, remover info redundante
**Prioridade:** MÉDIA

**Implementação:**
```tsx
// LabelPreview.tsx - REMOVER linha:
{/* <Text>{organizationDetails?.name}</Text> */}
```

**Arquivos:**
- `src/components/labels/LabelPreview.tsx`
- Templates de impressão (Zebra, PDF, etc.)

**Status:** PENDENTE 🟡

---

### 🔴 T7.3 - Trocar: "Manufacture Date" → "Prep Date"
**Objetivo:** Nomenclatura mais adequada para restaurante
**Prioridade:** ALTA

**Implementação:**
```tsx
// Preview e Print templates:
// ANTES: "Manufacture Date" ou "Mfg Date"
// DEPOIS: "Prep Date"

// Database: campo já se chama prep_date (OK ✅)
```

**Arquivos:**
- `src/components/labels/LabelPreview.tsx`
- `src/lib/printers/*.ts` (todos os print templates)

**Status:** PENDENTE 🔴

---

### 🟡 T10.1 - Mover: Botão Print para Baixo
**Objetivo:** Botão Print na parte inferior da tela
**Prioridade:** MÉDIA

**Implementação:**
```tsx
// Sticky footer no LabelForm
<div className="sticky bottom-0 bg-background border-t p-4 mt-8">
  <div className="flex gap-3 justify-end">
    <Button variant="outline" onClick={onCancel}>Cancel</Button>
    <Button onClick={onPrint}>Print Now</Button>
  </div>
</div>
```

**Arquivos:**
- `src/components/labels/LabelForm.tsx`

**Status:** PENDENTE 🟡

---

### 🟢 T10.2 - Remover: "Estimated Time Print Queue"
**Objetivo:** Simplificar UI
**Prioridade:** BAIXA

**Arquivos:**
- `src/components/shopping/PrintQueue.tsx`
- Procurar e remover elemento de tempo estimado

**Status:** PENDENTE 🟢

---

### 🟡 T11.1 - Remover: Badge "Expired" dentro do Card
**Objetivo:** Evitar confusão, remover badge redundante
**Prioridade:** MÉDIA

**Implementação:**
```tsx
// ProductCard - remover badge, manter apenas cor de fundo diferente
// ANTES:
{isExpired && <Badge variant="destructive">Expired</Badge>}

// DEPOIS:
<Card className={cn(isExpired && "opacity-75 bg-destructive/5")}>
```

**Arquivos:**
- `src/components/labels/QuickPrintGrid.tsx` (product cards)
- Ou component separado de ProductCard

**Status:** PENDENTE 🟡

---

## 📊 PROGRESSO DO SPRINT

**Completas:** 4/13 tarefas (31%)  
**Pendentes ALTA Prioridade:** 4 tarefas (T6.3, T6.4, T7.1, T7.3)  
**Pendentes MÉDIA Prioridade:** 4 tarefas (T6.5, T6.6, T7.2, T10.1, T11.1)  
**Pendentes BAIXA Prioridade:** 1 tarefa (T10.2)

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### Fase 1: UI/UX Crítico (Prioridade ALTA)
1. ✅ T6.3: Aumentar fontes no LabelForm
2. ✅ T6.4: Aumentar calendário
3. ✅ T7.1: Corrigir preview cortado
4. ✅ T7.3: "Prep Date" nomenclature

### Fase 2: Melhorias UX (Prioridade MÉDIA)
5. T6.5: Custom allergen field
6. T6.6: Click whole allergen card
7. T7.2: Remove organization name
8. T10.1: Move print button to bottom
9. T11.1: Remove expired badge

### Fase 3: Polish (Prioridade BAIXA)
10. T10.2: Remove estimated time

---

## 📝 NOTAS TÉCNICAS

### Tamanhos de Fonte - Guidelines
```css
/* Tablets (768px+) */
- Labels: text-base (16px)
- Inputs: text-lg (18px)
- Buttons: text-lg (18px) com py-6
- Headings: text-2xl ou text-3xl

/* Mobile (< 768px) */
- Labels: text-sm (14px)
- Inputs: text-base (16px)
- Buttons: text-base com py-3
```

### Calendário - Touch Targets
```css
/* Minimum touch target: 44x44px (iOS guideline) */
.calendar-day {
  min-width: 48px;
  min-height: 48px;
  padding: 12px;
}
```

---

**Sprint 3 Status:** 🔄 31% Complete  
**Ready for:** Implementação das tarefas de alta prioridade  
**Bloqueios:** Nenhum
