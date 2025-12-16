# ✅ LABELING MODERNIZATION - Quick Checklist

## 🎯 Requisitos do Usuário

### Template Editor
- [ ] HIDE or DISABLE ZPL CODE field
- [ ] Oferecer interface visual mais amigável para criar templates
- [ ] Usuários não técnicos não devem ver ZPL

### Validação de Produtos
- [ ] Não permitir criar item já existente na mesma categoria
- [ ] Não permitir criar item já existente em outra categoria
- [ ] Web hint: sugerir produto existente em outra categoria
- [ ] Permitir selecionar produto sugerido ou criar novo

### Alérgenos
- [ ] Adicionar tags de alérgenos no preview label
- [ ] Badges visuais destacados
- [ ] Conformidade FDA/EU

### Permissões de Categorias
- [ ] Apenas owner, manager, leader_chef podem criar categorias
- [ ] Outros roles apenas visualizam e selecionam

### Preview de Templates
- [ ] Respeitar template "blank" no preview
- [ ] Corrigir bug que mostra sempre o default
- [ ] Preview deve refletir template selecionado

### Quick Print
- [ ] Redesenhar para ser touch-friendly
- [ ] Botões grandes e clicáveis (120px+)
- [ ] Grid view para tablets/smartphones
- [ ] Opção de lista também
- [ ] Gestures: swipe, long-press, double-tap

### Layout da Página
- [ ] Inverter ordem: Quick Print PRIMEIRO
- [ ] Contadores de etiquetas depois
- [ ] Dashboard stats visível mas não proeminente

### Impressoras
- [ ] Testar com impressora HP
- [ ] Suporte para impressão não-ZPL (PDF/PCL)
- [ ] Adaptador para diferentes tipos de impressora

### Subcategorias
- [ ] Adicionar subcategorias baseado na estrutura Suflex
- [ ] Hierarquia: Categoria > Subcategoria
- [ ] Exemplo: Proteínas > Carnes Vermelhas, Aves, Peixes

---

## 📋 Implementação por Prioridade

### 🔴 CRÍTICO (Fazer primeiro)
1. Sistema de subcategorias (Suflex)
2. Visual template editor (sem ZPL)
3. Quick print touch-friendly
4. Validação de produtos duplicados
5. Corrigir preview de templates

### 🟡 IMPORTANTE (Fazer em seguida)
6. Tags de alérgenos no preview
7. Permissões de categoria por role
8. Reorganizar layout da página
9. Web hints para produtos existentes

### 🟢 DESEJÁVEL (Fazer se houver tempo)
10. Suporte impressora HP
11. Gestures avançados (swipe, long-press)
12. Modo offline/cache
13. Histórico detalhado de impressões

---

## 🏗️ Ordem de Desenvolvimento Sugerida

### Semana 1: Backend & Estrutura
- [ ] Migration: label_subcategories
- [ ] Migration: allergens + product_allergens
- [ ] Função: check_duplicate_product
- [ ] Função: suggest_existing_products
- [ ] RLS: permissões de categoria por role
- [ ] Seeds: subcategorias padrão Suflex

### Semana 2: Template Editor Visual
- [ ] Componente: TemplateVisualEditor
- [ ] Drag-and-drop elements
- [ ] Preview em tempo real
- [ ] Conversão visual → ZPL
- [ ] Salvar config JSON
- [ ] Esconder ZPL para usuários comuns

### Semana 3: Quick Print & Mobile
- [ ] Componente: QuickPrintGrid
- [ ] Layout grid responsivo
- [ ] Botões touch-friendly (120px+)
- [ ] Toggle grid/list view
- [ ] Gestures básicos
- [ ] Reorganizar ordem da página

### Semana 4: Alérgenos & Validações
- [ ] AllergenBadge component
- [ ] Integrar alérgenos no preview
- [ ] ProductSuggestions component
- [ ] Web hints em tempo real
- [ ] Validação de duplicatas no form

### Semana 5: Impressoras & Testes
- [ ] HPPrinterAdapter
- [ ] Conversão HTML → PDF
- [ ] Seletor de tipo de impressora
- [ ] Testes com impressora HP real
- [ ] Testes E2E do fluxo completo

---

## 🧪 Casos de Teste Críticos

### CT-01: Criar etiqueta com produto duplicado
```
DADO que o produto "Chicken Breast" já existe em "Proteins"
QUANDO o usuário tenta criar "Chicken Breast" em "Vegetables"
ENTÃO o sistema deve:
  ✓ Mostrar aviso de duplicata
  ✓ Sugerir o produto existente
  ✓ Permitir "Usar Existente" ou "Criar Novo Anyway"
```

### CT-02: Quick print em tablet
```
DADO que o usuário está em um tablet
QUANDO acessa Quick Print
ENTÃO o sistema deve:
  ✓ Mostrar botões grandes (min 120px)
  ✓ Grid responsivo (2-3 colunas)
  ✓ Touch gestures funcionando
  ✓ Sem necessidade de zoom
```

### CT-03: Template visual sem ZPL
```
DADO que o usuário é um "chef" (não manager)
QUANDO cria/edita um template
ENTÃO o sistema deve:
  ✓ Mostrar apenas editor visual
  ✓ Esconder campo ZPL code
  ✓ Gerar ZPL automaticamente ao salvar
  ✓ Preview funcional
```

### CT-04: Preview com template blank
```
DADO que o usuário seleciona template "Blank"
QUANDO visualiza o preview
ENTÃO o sistema deve:
  ✓ Mostrar preview em branco (não default)
  ✓ Respeitar configuração do template selecionado
  ✓ Não fazer fallback para default
```

### CT-05: Criar categoria sem permissão
```
DADO que o usuário é um "staff" (não manager/chef)
QUANDO tenta criar nova categoria
ENTÃO o sistema deve:
  ✓ Desabilitar botão "Create Category"
  ✓ Mostrar tooltip explicativo
  ✓ Permitir apenas seleção de categorias existentes
```

### CT-06: Alérgenos no preview
```
DADO que o produto tem alérgenos "Glúten, Leite"
QUANDO visualiza preview da etiqueta
ENTÃO o sistema deve:
  ✓ Mostrar badges de alérgenos destacados
  ✓ Ícones visuais reconhecíveis
  ✓ Warning se alérgenos críticos presentes
```

---

## 📦 Componentes Novos a Criar

### React Components
- [ ] `QuickPrintGrid.tsx` - Grid touch-friendly
- [ ] `TemplateVisualEditor.tsx` - Editor visual drag-drop
- [ ] `AllergenBadge.tsx` - Badge visual de alérgeno
- [ ] `ProductSuggestions.tsx` - Sugestões de produtos
- [ ] `SubcategoryPicker.tsx` - Seletor hierárquico
- [ ] `PrinterSelector.tsx` - Escolher tipo de impressora

### Hooks
- [ ] `useProductSuggestions.ts` - Buscar produtos similares
- [ ] `useSubcategories.ts` - Carregar subcategorias
- [ ] `useAllergens.ts` - Gerenciar alérgenos
- [ ] `usePrinterAdapter.ts` - Selecionar adaptador correto

### Utils
- [ ] `printerAdapter.ts` - Interface para impressoras
- [ ] `hpPrinter.ts` - Adaptador HP
- [ ] `templateConverter.ts` - Visual → ZPL
- [ ] `htmlToPdf.ts` - Converter HTML para PDF

### Types
- [ ] `labels.types.ts` - Tipos centralizados
- [ ] `templates.types.ts` - Tipos de templates
- [ ] `printers.types.ts` - Tipos de impressoras

---

## 🔧 Migrations SQL Necessárias

1. `20251209_create_subcategories.sql`
2. `20251209_create_allergens.sql`
3. `20251209_add_visual_config_to_templates.sql`
4. `20251209_add_subcategory_to_products.sql`
5. `20251209_update_category_rls_policies.sql`
6. `20251209_add_duplicate_check_functions.sql`
7. `20251209_seed_suflex_subcategories.sql`
8. `20251209_seed_common_allergens.sql`

---

## 📱 Breakpoints Mobile

```css
/* Smartphone Portrait */
@media (max-width: 480px) {
  .quick-print-grid { grid-template-columns: repeat(2, 1fr); }
  .quick-print-button { min-height: 120px; font-size: 14px; }
}

/* Smartphone Landscape / Small Tablet */
@media (min-width: 481px) and (max-width: 768px) {
  .quick-print-grid { grid-template-columns: repeat(3, 1fr); }
  .quick-print-button { min-height: 140px; font-size: 16px; }
}

/* Tablet Portrait */
@media (min-width: 769px) and (max-width: 1024px) {
  .quick-print-grid { grid-template-columns: repeat(4, 1fr); }
  .quick-print-button { min-height: 160px; font-size: 18px; }
}

/* Desktop */
@media (min-width: 1025px) {
  .quick-print-grid { grid-template-columns: repeat(6, 1fr); }
  .quick-print-button { min-height: 140px; font-size: 16px; }
}
```

---

## 🎨 Design System Guidelines

### Touch Targets
- Mínimo: 44px x 44px (iOS guideline)
- Recomendado: 48px x 48px (Android guideline)
- Quick Print: **120px x 120px** (touch-friendly)

### Spacing
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- Touch spacing: **16px** (entre botões)

### Colors (Allergen Warnings)
- Critical: `bg-red-500` (Gluten, Peanuts, Shellfish)
- Warning: `bg-yellow-500` (Soy, Dairy, Eggs)
- Info: `bg-blue-500` (Sesame, Mustard)

### Typography
- Touch buttons: `text-base` (16px) minimum
- Headers: `text-2xl` (24px)
- Body: `text-sm` (14px)

---

## 🚀 Deploy Checklist

### Antes do Deploy
- [ ] Todos os testes passando
- [ ] Migrations rodadas em staging
- [ ] Backup do banco de dados
- [ ] Documentação atualizada
- [ ] Changelog criado

### Durante o Deploy
- [ ] Deploy em horário de baixo uso
- [ ] Monitorar logs em tempo real
- [ ] Rollback plan preparado
- [ ] Equipe de suporte avisada

### Após o Deploy
- [ ] Smoke tests no production
- [ ] Verificar impressões funcionando
- [ ] Monitorar erros 24h
- [ ] Coletar feedback inicial
- [ ] Atualizar documentação de usuário

---

**Status:** 📋 Planejamento Completo  
**Próximo Passo:** Aprovar e iniciar Fase 1 - Backend & Estrutura  
**Data:** Dezembro 9, 2025
