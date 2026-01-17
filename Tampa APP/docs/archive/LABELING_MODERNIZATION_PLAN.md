# 📋 Plano de Modernização do Módulo LABELING

**Data:** Dezembro 9, 2025  
**Versão:** 1.0  
**Status:** Planejamento  

---

## 🎯 Objetivo

Modernizar e melhorar o módulo de etiquetagem (Labeling) para torná-lo mais intuitivo, robusto e adequado para uso em dispositivos touch (tablets/smartphones), alinhado com padrões da indústria alimentícia.

---

## 📊 Situação Atual

### Componentes Existentes
- ✅ `LabelForm.tsx` - Formulário principal de criação de etiquetas
- ✅ `TemplateManagement.tsx` - Gerenciamento de templates ZPL
- ✅ `QuickPrintMenu.tsx` - Menu de impressão rápida
- ✅ `LabelPreview.tsx` - Preview de etiquetas
- ✅ `AllergenSelector.tsx` - Seletor de alérgenos (básico)
- ✅ `SubcategorySelector.tsx` - Seletor de subcategorias (existente)

### Estrutura do Banco de Dados
```sql
- label_categories (categorias principais)
- products (produtos com category_id)
- label_templates (templates ZPL)
- printed_labels (histórico de impressões)
- label_drafts (rascunhos)
- print_queue (fila de impressão)
```

---

## 🚀 Fases de Implementação

## **FASE 1: Estrutura de Dados e Backend** 🏗️

### 1.1 Sistema de Subcategorias (Suflex-style)
**Prioridade:** ALTA  
**Estimativa:** 2 dias  

#### Ações:
- [ ] Criar migration para tabela `label_subcategories`
  ```sql
  CREATE TABLE label_subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES label_categories(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [ ] Adicionar índices e constraints únicos
- [ ] Implementar RLS policies
- [ ] Atualizar tabela `products` para incluir `subcategory_id`
- [ ] Criar seeds com subcategorias padrão baseadas no Suflex

#### Estrutura Suflex de Referência:
```
Proteínas
  ├── Carnes Vermelhas
  ├── Aves
  ├── Peixes
  └── Frutos do Mar

Vegetais
  ├── Folhas
  ├── Raízes
  ├── Legumes
  └── Cogumelos

Laticínios
  ├── Queijos
  ├── Leites
  └── Cremes

Grãos & Cereais
  ├── Arroz
  ├── Massas
  └── Farinhas
```

---

### 1.2 Sistema de Alérgenos
**Prioridade:** ALTA  
**Estimativa:** 1.5 dias  

#### Ações:
- [ ] Criar tabela `allergens` com alérgenos padrão (FDA/EU compliant)
- [ ] Criar tabela de relacionamento `product_allergens`
- [ ] Adicionar campo `allergens` na tabela `printed_labels`
- [ ] Implementar funções para buscar alérgenos por produto
- [ ] Adicionar validação de alérgenos obrigatórios

#### Lista de Alérgenos Padrão:
```typescript
const COMMON_ALLERGENS = [
  'Glúten (trigo, centeio, cevada)',
  'Crustáceos',
  'Ovos',
  'Peixes',
  'Amendoim',
  'Soja',
  'Leite',
  'Nozes (amêndoas, castanhas, etc)',
  'Aipo',
  'Mostarda',
  'Gergelim',
  'Dióxido de enxofre/sulfitos',
  'Tremoço',
  'Moluscos'
];
```

---

### 1.3 Validação de Produtos Duplicados
**Prioridade:** MÉDIA-ALTA  
**Estimativa:** 1 dia  

#### Ações:
- [ ] Criar função PostgreSQL `check_duplicate_product(name, category_id, organization_id)`
- [ ] Implementar trigger para prevenir duplicatas na inserção
- [ ] Criar função `suggest_existing_products(name_search, organization_id)`
- [ ] Adicionar validação no frontend antes de criar produto

#### Lógica de Validação:
```sql
-- Retorna produtos similares em qualquer categoria
CREATE OR REPLACE FUNCTION suggest_existing_products(
  search_name TEXT,
  org_id UUID
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  category_name TEXT,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    lc.name,
    SIMILARITY(p.name, search_name) as score
  FROM products p
  LEFT JOIN label_categories lc ON p.category_id = lc.id
  WHERE p.organization_id = org_id
    AND SIMILARITY(p.name, search_name) > 0.3
  ORDER BY score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;
```

---

### 1.4 Permissões de Categoria por Role
**Prioridade:** MÉDIA  
**Estimativa:** 0.5 dias  

#### Ações:
- [ ] Atualizar RLS policies de `label_categories`
- [ ] Criar função helper `can_manage_categories(user_id)`
- [ ] Implementar validação no backend para INSERT/UPDATE/DELETE

---

## **FASE 2: Interface de Templates** 🎨

### 2.1 Visual Template Editor (Sem ZPL)
**Prioridade:** ALTA  
**Estimativa:** 4 dias  

#### Ações:
- [ ] Criar componente `TemplateVisualEditor.tsx`
- [ ] Implementar drag-and-drop para elementos da etiqueta
- [ ] Adicionar biblioteca de elementos pré-configurados:
  - Product Name (título)
  - Category/Subcategory
  - Dates (prep, expiry, use-by)
  - QR Code
  - Allergen warnings
  - Batch/Lot number
  - User/Chef signature
  - Storage instructions
- [ ] Criar preview em tempo real
- [ ] Gerar ZPL automaticamente a partir da configuração visual
- [ ] Salvar configuração JSON no banco (novo campo `visual_config`)

#### Estrutura do Visual Config:
```typescript
interface TemplateVisualConfig {
  size: { width: number; height: number }; // mm
  elements: TemplateElement[];
}

interface TemplateElement {
  id: string;
  type: 'text' | 'qrcode' | 'barcode' | 'image' | 'allergen-badge';
  position: { x: number; y: number };
  size: { width: number; height: number };
  properties: {
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    alignment?: 'left' | 'center' | 'right';
    dataSource: string; // ${productName}, ${expiryDate}, etc
    static?: boolean;
    staticValue?: string;
  };
}
```

#### Biblioteca de Componentes:
- **react-dnd** - Para drag and drop
- **react-konva** ou **fabric.js** - Canvas de edição visual
- **@zpl-image/render** - Converter visual para ZPL

---

### 2.2 Esconder/Desabilitar Campo ZPL Code
**Prioridade:** MÉDIA  
**Estimativa:** 0.5 dias  

#### Ações:
- [ ] Adicionar toggle "Advanced Mode" em `TemplateManagement`
- [ ] Mostrar campo ZPL apenas para `owner` e `manager`
- [ ] Adicionar warning ao editar ZPL diretamente
- [ ] Validar ZPL syntax antes de salvar

---

### 2.3 Corrigir Preview de Template
**Prioridade:** ALTA  
**Estimativa:** 1 dia  

#### Ações:
- [ ] Investigar bug no `LabelPreview.tsx`
- [ ] Garantir que estado do template selecionado seja respeitado
- [ ] Adicionar fallback apropriado quando template é "blank"
- [ ] Implementar preview para templates visuais (não apenas ZPL)

---

## **FASE 3: Interface Mobile-Friendly** 📱

### 3.1 Redesenhar Quick Print Menu
**Prioridade:** ALTA  
**Estimativa:** 3 dias  

#### Ações:
- [ ] Criar novo componente `QuickPrintGrid.tsx`
- [ ] Implementar layout de cards grandes (min 120px x 120px)
- [ ] Adicionar toggle Grid/List view
- [ ] Implementar busca e filtros visuais
- [ ] Adicionar indicadores visuais de status:
  - ✅ Produto selecionado
  - ⚠️ Faltam informações
  - 🖨️ Imprimindo
- [ ] Implementar gestures para touch:
  - Swipe para deletar
  - Long press para editar
  - Double tap para impressão rápida

#### Layout Proposto:
```
┌─────────────────────────────────────┐
│  🔍 Search Products...              │
├─────────────────────────────────────┤
│  [Grid] [List]    🔽Filters         │
├─────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │ 🥩     │ │ 🥗     │ │ 🧀     ││
│  │ Beef   │ │ Lettuce│ │ Cheese ││
│  │ Steaks │ │        │ │        ││
│  │  📦 5  │ │  📦 12 │ │  📦 3  ││
│  └─────────┘ └─────────┘ └─────────┘│
│  ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │ 🍗     │ │ 🥕     │ │ 🥛     ││
│  │ Chicken│ │ Carrots│ │ Milk   ││
│  └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────┘
```

---

### 3.2 Reorganizar Layout da Página
**Prioridade:** MÉDIA  
**Estimativa:** 1 dia  

#### Nova Estrutura:
```
1. 🖨️ QUICK PRINT (principal, topo)
2. 📊 Dashboard Stats (labels today, expiring, etc)
3. 📄 Recent Printed Labels (histórico)
4. ➕ Create New Label (formulário completo)
5. ⚙️ Template Management (link para página separada)
```

#### Ações:
- [ ] Refatorar `Labeling.tsx` para nova ordem
- [ ] Criar componente `LabelingDashboard.tsx` separado
- [ ] Implementar navegação por tabs ou sections
- [ ] Otimizar carregamento lazy de componentes pesados

---

## **FASE 4: Integração com Impressoras** 🖨️

### 4.1 Suporte para Impressoras HP (Não-ZPL)
**Prioridade:** MÉDIA  
**Estimativa:** 3 dias  

#### Ações:
- [ ] Criar adaptador `hpPrinter.ts` para PCL ou PDF
- [ ] Implementar conversão de template visual para HTML
- [ ] Adicionar library **html2canvas** + **jsPDF**
- [ ] Criar seletor de tipo de impressora nas configurações
- [ ] Salvar preferência de impressora por usuário
- [ ] Implementar preview antes de imprimir

#### Fluxo de Impressão:
```typescript
interface PrinterAdapter {
  type: 'zebra' | 'hp' | 'generic';
  print(labelData: LabelData, template: Template): Promise<void>;
}

class HPPrinterAdapter implements PrinterAdapter {
  type = 'hp';
  
  async print(labelData: LabelData, template: Template) {
    // 1. Render template to HTML
    const html = renderTemplateToHTML(labelData, template);
    
    // 2. Convert to PDF
    const pdf = await htmlToPDF(html);
    
    // 3. Send to printer
    await window.electron.print(pdf);
  }
}
```

---

## **FASE 5: Features Adicionais** ✨

### 5.1 Integração de Alérgenos no Preview
**Prioridade:** ALTA  
**Estimativa:** 1 dia  

#### Ações:
- [ ] Adicionar seção de alérgenos no `LabelPreview`
- [ ] Criar badges visuais destacados (vermelho/amarelo)
- [ ] Implementar ícones para cada alérgeno comum
- [ ] Adicionar warning prominente se alérgenos estão presentes

---

### 5.2 Web Hints para Produtos Existentes
**Prioridade:** MÉDIA  
**Estimativa:** 1.5 dias  

#### Ações:
- [ ] Adicionar `Combobox` com sugestões em tempo real
- [ ] Mostrar categoria atual do produto sugerido
- [ ] Adicionar opção "Use existing" ou "Create new"
- [ ] Implementar debounce na busca (300ms)
- [ ] Destacar diferenças entre produto existente e novo

#### UI Proposta:
```
┌──────────────────────────────────────┐
│ Product Name: [Chicken Breas____]   │
├──────────────────────────────────────┤
│ ⚠️ Similar products found:           │
│                                      │
│ ✓ Chicken Breast (in Proteins)      │
│   [Use This] [Create New Anyway]    │
│                                      │
│ ≈ Chicken Legs (in Proteins)        │
│   [View Details]                     │
└──────────────────────────────────────┘
```

---

## 📐 Padrões e Convenções

### Naming Conventions
- **Componentes:** PascalCase (`QuickPrintGrid.tsx`)
- **Hooks:** camelCase com `use` prefix (`useProductSuggestions.ts`)
- **Utils:** camelCase (`printerAdapter.ts`)
- **Tipos:** PascalCase com `I` prefix para interfaces (`ILabelTemplate`)

### Estrutura de Arquivos
```
src/
  components/
    labels/
      ├── QuickPrintGrid.tsx          (NOVO)
      ├── TemplateVisualEditor.tsx    (NOVO)
      ├── AllergenBadge.tsx           (NOVO)
      ├── ProductSuggestions.tsx      (NOVO)
      └── ... (existentes)
  hooks/
    └── useProductSuggestions.ts      (NOVO)
  utils/
    printers/
      ├── zebraPrinter.ts             (existente)
      ├── hpPrinter.ts                (NOVO)
      └── printerAdapter.ts           (NOVO)
  types/
    └── labels.types.ts               (NOVO)
```

---

## 🧪 Testing Strategy

### Testes Unitários
- [ ] Validação de produtos duplicados
- [ ] Conversão de template visual para ZPL
- [ ] Cálculo de datas de expiração
- [ ] Sugestões de produtos existentes

### Testes de Integração
- [ ] Fluxo completo de criação de etiqueta
- [ ] Quick print com diferentes templates
- [ ] Impressão em Zebra e HP
- [ ] Sincronização com banco de dados

### Testes de UI/UX (Manual)
- [ ] Touch gestures em tablet
- [ ] Responsividade mobile
- [ ] Acessibilidade (keyboard navigation)
- [ ] Performance com 100+ produtos

---

## 📦 Dependências Novas

```json
{
  "dependencies": {
    "react-dnd": "^16.0.1",
    "react-dnd-html5-backend": "^16.0.1",
    "react-konva": "^18.2.10",
    "konva": "^9.2.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.1",
    "date-fns": "^3.0.0",         // já existe?
    "zod": "^3.22.4"               // para validação
  }
}
```

---

## 🎯 Métricas de Sucesso

### Quantitativas
- ✅ Reduzir tempo de criação de etiqueta em 50%
- ✅ Aumentar taxa de uso do Quick Print em 70%
- ✅ Reduzir erros de impressão em 80%
- ✅ Suportar 95%+ dos casos de uso sem edição ZPL

### Qualitativas
- ✅ Interface intuitiva para usuários não técnicos
- ✅ Compatível com tablets e smartphones
- ✅ Conformidade com regulamentações alimentícias
- ✅ Feedback positivo de chefs e gerentes

---

## 📅 Timeline Estimado

| Fase | Duração | Data Início | Data Fim |
|------|---------|-------------|----------|
| Fase 1: Backend & Estrutura | 5 dias | Dez 10 | Dez 14 |
| Fase 2: Templates | 5.5 dias | Dez 15 | Dez 21 |
| Fase 3: Mobile UI | 4 dias | Dez 22 | Dez 27 |
| Fase 4: Impressoras | 3 dias | Dez 28 | Dez 30 |
| Fase 5: Features Extras | 2.5 dias | Dez 31 | Jan 02 |
| **Testing & Ajustes** | 3 dias | Jan 03 | Jan 05 |
| **TOTAL** | **23 dias** | | **~Jan 05** |

---

## 🚨 Riscos e Mitigações

### Risco 1: Complexidade do Visual Editor
**Probabilidade:** Alta  
**Impacto:** Alto  
**Mitigação:**
- Começar com MVP limitado (3-4 elementos apenas)
- Usar biblioteca madura (Konva/Fabric)
- Ter fallback para edição ZPL manual

### Risco 2: Compatibilidade de Impressoras
**Probabilidade:** Média  
**Impacto:** Alto  
**Mitigação:**
- Testar com hardware real desde o início
- Implementar modo de debug/preview
- Documentar modelos de impressora suportados

### Risco 3: Performance Mobile
**Probabilidade:** Média  
**Impacto:** Médio  
**Mitigação:**
- Lazy loading de componentes
- Virtualização de listas longas
- Otimização de queries do Supabase

---

## 📚 Referências

- [FDA Food Labeling Guide](https://www.fda.gov/food/guidance-regulation-food-and-dietary-supplements/food-labeling-nutrition)
- [EU Food Allergen Guidelines](https://ec.europa.eu/food/safety/labelling-and-nutrition/allergens_en)
- [Zebra ZPL Programming Guide](https://www.zebra.com/us/en/support-downloads/knowledge-articles/zpl-programming-guide.html)
- [React DnD Documentation](https://react-dnd.github.io/react-dnd/)
- [Konva.js Docs](https://konvajs.org/docs/)

---

## 📝 Notas Finais

Este plano é um documento vivo e deve ser atualizado conforme o progresso e descobertas durante a implementação. Prioridades podem mudar baseadas em feedback dos usuários e necessidades do negócio.

**Próximo Passo:** Revisar e aprovar o plano com stakeholders antes de iniciar Fase 1.

---

**Autor:** GitHub Copilot  
**Revisão Necessária:** Product Owner, Tech Lead, Chef Principal  
**Versão do Sistema:** Tampa APP v2.0 (Branch: TAMPAAPP_10_11_RECIPES_FUNCIONALITY)
