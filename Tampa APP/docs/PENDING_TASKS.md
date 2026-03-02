# 📋 TASKS PENDENTES - Sprint 3 & 4

**Data:** 17 de Fevereiro de 2026  
**Status Atual:** 88% completo (15/17 tasks)  
**Ignoradas:** T12.1, T12.2 (por solicitação do cliente)

---

## 🔄 TASKS RESTANTES (5 tasks)

### BLOCO 10: Print

#### 🟡 T10.1 - Mover Botão Print para Baixo
**Prioridade:** ALTA  
**Objetivo:** Botão Print deve estar na parte inferior da tela

**Arquivos a Modificar:**
- `src/components/labels/LabelForm.tsx`

**Implementação:**
```typescript
// Mover botões "Print Now" e "Add to Queue" para sticky footer
<div className="sticky bottom-0 left-0 right-0 p-4 bg-background border-t">
  <div className="flex gap-3">
    <Button onClick={handlePrint}>Print Now</Button>
    <Button onClick={handleAddToQueue}>Add to Queue</Button>
  </div>
</div>
```

**Benefícios:**
- ✅ Sempre visível (mesmo com scroll)
- ✅ Padrão mobile-first
- ✅ Não sobrepõe conteúdo do form
- ✅ Melhor ergonomia para tablets

**Critério de Aceite:**
- [ ] Botões na parte inferior
- [ ] Sticky/fixed position
- [ ] Não sobrepõe conteúdo
- [ ] Funciona em mobile e tablet

**Estimativa:** 15 minutos

---

#### 🟡 T10.2 - Remover "Estimated Time Print Queue"
**Prioridade:** MÉDIA  
**Objetivo:** Simplificar UI da fila de impressão

**Arquivos a Modificar:**
- `src/components/shopping/PrintQueue.tsx`

**Implementação:**
```typescript
// Procurar e remover elementos que mostram tempo estimado:
// - "Estimated time: X minutes"
// - Cálculos de tempo
// - Badges com duração

// Simplificar para mostrar apenas:
// - Número de itens na fila
// - Botão "Print All"
```

**Benefícios:**
- ✅ UI mais limpa
- ✅ Remove informação não essencial
- ✅ Reduz manutenção (cálculos de tempo)

**Critério de Aceite:**
- [ ] Tempo estimado removido completamente
- [ ] Layout ajustado
- [ ] Sem elementos órfãos ou espaços vazios

**Estimativa:** 10 minutos

---

### BLOCO 11: Product Cards

#### 🟡 T11.1 - Remover Badge "Expired" dos Cards
**Prioridade:** MÉDIA  
**Objetivo:** Evitar confusão visual, remover badge redundante

**Arquivos a Procurar:**
- `src/components/dashboard/ExpiringTodayCard.tsx`
- `src/components/dashboard/ExpiringTomorrowCard.tsx`
- Qualquer outro component de Product Card

**Investigação Necessária:**
- Verificar se existe badge "Expired" nos cards
- Pode não estar implementado ainda

**Implementação:**
```typescript
// Se existir:
// REMOVER:
{isExpired && <Badge variant="destructive">Expired</Badge>}

// MANTER apenas indicador sutil:
// - Cor do card diferente
// - Opacity reduzida
// - Ícone pequeno
```

**Benefícios:**
- ✅ Menos poluição visual
- ✅ Evita redundância (cor já indica status)
- ✅ Cards mais limpos

**Critério de Aceite:**
- [ ] Badge "Expired" removido
- [ ] Indicador visual sutil mantido (cor/opacity)
- [ ] Status ainda distinguível

**Estimativa:** 10 minutos

---

### BLOCO 13: Admin

#### 🟡 T13.1 - Modal "Nova Categoria" (PARCIAL)
**Prioridade:** MÉDIA  
**Status:** BOTÃO CRIADO ✅ | MODAL FALTANDO ❌

**O que já foi feito:**
- ✅ Botão "New Category" adicionado em Labeling.tsx
- ✅ Visível apenas para Admin
- ✅ Atualmente navega para `/admin/categories`

**O que falta fazer:**
Criar modal inline para criar categoria SEM sair da página de Labels

**Arquivos a Modificar:**
- `src/pages/Labeling.tsx` (mudar onClick do botão)
- Criar novo component: `src/components/labels/CreateCategoryDialog.tsx`

**Implementação:**
```typescript
// 1. Criar CreateCategoryDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateCategoryDialog({ 
  open, 
  onOpenChange, 
  onCreateCategory 
}) {
  const [categoryName, setCategoryName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('label_categories')
        .insert([{ name: categoryName }])
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Category Created",
        description: `"${categoryName}" has been added.`,
      });
      
      onCreateCategory(data);
      onOpenChange(false);
      setCategoryName("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Category Name</Label>
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g., Meats, Vegetables, Dairy..."
              className="text-lg h-12"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!categoryName.trim() || creating}
          >
            {creating ? "Creating..." : "Create Category"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 2. Modificar Labeling.tsx
// Adicionar state:
const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

// Modificar botão:
<Button 
  variant="outline"
  onClick={() => setCreateCategoryOpen(true)} // MUDAR AQUI
  className="flex items-center gap-2"
>
  <Plus className="w-4 h-4" />
  New Category
</Button>

// Adicionar dialog:
<CreateCategoryDialog
  open={createCategoryOpen}
  onOpenChange={setCreateCategoryOpen}
  onCreateCategory={(newCategory) => {
    // Refresh categories list if needed
    console.log('New category created:', newCategory);
  }}
/>
```

**Benefícios:**
- ✅ Admin cria categoria sem sair do contexto
- ✅ Workflow mais rápido
- ✅ Melhor UX (não perde estado da página)
- ✅ Modal inline mais moderno

**Critério de Aceite:**
- [ ] Modal abre ao clicar no botão
- [ ] Input para nome da categoria
- [ ] Validação (nome obrigatório)
- [ ] Salva no banco (label_categories)
- [ ] Feedback de sucesso/erro
- [ ] Modal fecha após criação
- [ ] Categoria aparece imediatamente nas dropdowns

**Estimativa:** 30 minutos

---

### BLOCO 14: UX Geral

#### 🟡 T14.1 - Aumentar Tamanho dos Modais
**Prioridade:** MÉDIA  
**Objetivo:** Modais maiores para melhor usabilidade em tablet

**Arquivos a Modificar:**
- `src/components/ui/dialog.tsx`

**Implementação:**
```typescript
// Modificar DialogContent defaultProps:

// ANTES:
className="sm:max-w-[425px]"

// DEPOIS:
className="sm:max-w-[540px] md:max-w-[720px]"

// Também aumentar padding:
// ANTES: p-6
// DEPOIS: p-6 sm:p-8
```

**Benefícios:**
- ✅ Melhor legibilidade em tablets
- ✅ Menos scroll dentro de modais
- ✅ Inputs e botões mais espaçados
- ✅ Mais profissional

**Critério de Aceite:**
- [ ] Modais maiores em tablet (720px max-width)
- [ ] Mobile continua responsivo (540px)
- [ ] Padding aumentado (48px em tablet)
- [ ] Não quebra em telas pequenas
- [ ] Testado em todos os modais existentes

**Estimativa:** 15 minutos

---

## 📊 RESUMO

### Por Prioridade:
- **ALTA:** 1 task (T10.1)
- **MÉDIA:** 4 tasks (T10.2, T11.1, T13.1, T14.1)

### Por Complexidade:
- **Simples:** 3 tasks (T10.1, T10.2, T11.1) - ~35 min total
- **Moderada:** 2 tasks (T13.1, T14.1) - ~45 min total

### Estimativa Total:
**~80 minutos (1h20min)** para completar todas as 5 tasks

---

## 🎯 ORDEM SUGERIDA DE IMPLEMENTAÇÃO

### Rápidas Primeiro (Quick Wins):
1. ✅ **T10.2** - Remove estimated time (10 min)
2. ✅ **T11.1** - Remove expired badge (10 min)
3. ✅ **T14.1** - Increase modal size (15 min)
4. ✅ **T10.1** - Move print button (15 min)

### Moderada por Último:
5. ✅ **T13.1** - Create category modal (30 min)

---

## 📁 ARQUIVOS QUE SERÃO MODIFICADOS

1. `src/components/labels/LabelForm.tsx` - Print buttons (T10.1)
2. `src/components/shopping/PrintQueue.tsx` - Estimated time (T10.2)
3. `src/components/dashboard/*.tsx` - Expired badge (T11.1)
4. `src/components/ui/dialog.tsx` - Modal size (T14.1)
5. `src/pages/Labeling.tsx` - Category modal (T13.1)
6. `src/components/labels/CreateCategoryDialog.tsx` - NEW FILE (T13.1)

**Total:** 6 arquivos (5 edições + 1 novo)

---

## ✅ APÓS COMPLETAR ESTAS 5 TASKS

**Sprint 3 + 4:** 20/22 tasks (91% completo)

**Todas as prioridades altas resolvidas!** ✅

---

**Documento Criado:** 17 de Fevereiro de 2026  
**Próxima Ação:** Começar por T10.2 (quick win de 10 minutos)
