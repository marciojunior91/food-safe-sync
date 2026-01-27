# 🔍 Análise de Campos Obrigatórios - Database Integrity Check

## 📋 Campos que Devem Ser Sempre Preenchidos

### 1. **`printed_labels` Table**

#### ❌ Problema Encontrado:
Os campos `product_id` e `subcategory_id` são **nullable** no código, mas deveriam ser **obrigatórios** para manter integridade referencial.

#### 📊 Schema Atual:
```typescript
Insert: {
  product_id?: string | null      // ❌ Opcional - DEVE SER OBRIGATÓRIO
  subcategory_id?: string | null  // ❌ Opcional - DEVE SER OBRIGATÓRIO
  category_id?: string | null     // OK - Pode ser derivado do product
  // ... outros campos
}
```

#### ✅ Locais Onde `printed_labels` São Criados:

**1. `src/utils/zebraPrinter.ts` - Linha 212**
```typescript
const { data: insertedData, error } = await supabase
  .from("printed_labels")
  .insert({
    product_id: productId,      // ⚠️ Pode ser null se vazio
    category_id: categoryId,
    // subcategory_id: AUSENTE! ❌
    // ...
  })
```

**Problemas:**
- ❌ `subcategory_id` **não está sendo inserido**
- ⚠️ `product_id` pode ser `null` se string vazia
- ⚠️ Conversão de string vazia para null na linha 209

---

### 2. **`products` Table**

#### ❌ Problema Encontrado:
O campo `measuring_unit_id` é **nullable** no código, mas deveria ser **obrigatório**.

#### 📊 Schema Atual:
```typescript
Insert: {
  measuring_unit_id?: string | null  // ❌ Opcional - DEVE SER OBRIGATÓRIO
  subcategory_id?: string | null     // OK - Subcategoria pode ser opcional
  category_id?: string | null        // ⚠️ Deveria ser obrigatório?
  // ... outros campos
}
```

#### ✅ Locais Onde `products` São Criados:

**1. `src/components/labels/LabelForm.tsx` - Linha 572**
```typescript
const { data, error } = await supabase
  .from("products")
  .insert({
    name: newProductName.trim(),
    category_id: newProductCategory,
    subcategory_id: newProductSubcategory || null,
    // measuring_unit_id: AUSENTE! ❌
    organization_id: organizationId
  })
```

**Problemas:**
- ❌ `measuring_unit_id` **não está sendo inserido**
- ✅ `category_id` é obrigatório (validado antes)
- ⚠️ `subcategory_id` é opcional (pode ser null)

---

## 🔧 Correções Necessárias

### ✅ Correção 1: `zebraPrinter.ts` - Adicionar `subcategory_id`

**Localização:** `src/utils/zebraPrinter.ts:212`

**Problema:**
```typescript
// ❌ ATUAL - subcategory_id está faltando
.insert({
  product_id: productId,
  category_id: categoryId,
  // ...
})
```

**Solução:**
```typescript
// ✅ CORRIGIDO - Adicionar subcategory_id
.insert({
  product_id: productId,
  category_id: categoryId,
  subcategory_id: data.subcategoryId || null, // Adicionar!
  // ...
})
```

**Mas antes:** Precisamos garantir que `data.subcategoryId` existe na interface `LabelData`

---

### ✅ Correção 2: `zebraPrinter.ts` - Garantir `product_id` obrigatório

**Localização:** `src/utils/zebraPrinter.ts:209`

**Problema:**
```typescript
// ❌ ATUAL - Permite null
const productId = data.productId && data.productId.trim() !== '' 
  ? data.productId 
  : null;
```

**Solução:**
```typescript
// ✅ CORRIGIDO - Validar antes de inserir
if (!data.productId || data.productId.trim() === '') {
  throw new Error('product_id is required for printed_labels');
}
const productId = data.productId;
```

---

### ✅ Correção 3: `LabelForm.tsx` - Adicionar `measuring_unit_id`

**Localização:** `src/components/labels/LabelForm.tsx:572`

**Problema:**
```typescript
// ❌ ATUAL - measuring_unit_id está faltando
.insert({
  name: newProductName.trim(),
  category_id: newProductCategory,
  subcategory_id: newProductSubcategory || null,
  organization_id: organizationId
})
```

**Solução:**
```typescript
// ✅ CORRIGIDO - Adicionar measuring_unit_id obrigatório
.insert({
  name: newProductName.trim(),
  category_id: newProductCategory,
  subcategory_id: newProductSubcategory || null,
  measuring_unit_id: newProductMeasuringUnit, // Adicionar!
  organization_id: organizationId
})
```

**Mas antes:** Precisamos:
1. Adicionar campo no formulário para selecionar measuring unit
2. Validar que measuring_unit foi selecionado
3. Adicionar estado `newProductMeasuringUnit`

---

## 📝 Interface `LabelData` - Verificação

**Localização:** `src/utils/zebraPrinter.ts:22` e `src/types/zebraPrinter.ts:76`

**Verificar se existe:**
```typescript
interface LabelData {
  productId: string;       // ✅ Existe
  categoryId?: string;     // ✅ Existe
  subcategoryId?: string;  // ❓ VERIFICAR SE EXISTE
  // ...
}
```

---

## 🎯 Plano de Ação

### Prioridade Alta (Quebra funcionalidade):

1. **✅ Adicionar `subcategoryId` ao `LabelData` interface**
   - Verificar em `src/utils/zebraPrinter.ts`
   - Verificar em `src/types/zebraPrinter.ts`
   - Verificar em `src/components/labels/LabelForm.tsx`

2. **✅ Adicionar `subcategory_id` ao insert de `printed_labels`**
   - Arquivo: `src/utils/zebraPrinter.ts:212`
   - Garantir que subcategory_id é passado

3. **✅ Validar `product_id` obrigatório**
   - Arquivo: `src/utils/zebraPrinter.ts:209`
   - Adicionar validação antes de insert

4. **✅ Adicionar campo `measuring_unit` ao formulário de criar produto**
   - Arquivo: `src/components/labels/LabelForm.tsx`
   - Adicionar select de measuring units
   - Validar antes de submit
   - Incluir no insert

### Prioridade Média (Melhorias):

5. **✅ Atualizar schema no banco para NOT NULL**
   - `printed_labels.product_id` → NOT NULL
   - `printed_labels.subcategory_id` → NOT NULL
   - `products.measuring_unit_id` → NOT NULL

6. **✅ Adicionar constraints no banco**
   - Foreign keys já existem
   - Adicionar CHECK constraints se necessário

---

## 🧪 Testes Necessários

### Teste 1: Criar Label sem Product ID
```typescript
// Deve falhar com erro claro
await saveLabelToDatabase({ 
  productId: '',  // ❌ Vazio
  // ...
});
// Esperado: Error('product_id is required')
```

### Teste 2: Criar Label com Product ID válido
```typescript
// Deve funcionar
await saveLabelToDatabase({ 
  productId: 'uuid-válido',
  subcategoryId: 'uuid-válido',  // ✅ Adicionado
  // ...
});
// Esperado: Label criado com sucesso
```

### Teste 3: Criar Product sem Measuring Unit
```typescript
// Deve falhar
await createProduct({
  name: 'Test Product',
  category_id: 'uuid',
  // measuring_unit_id: undefined ❌
});
// Esperado: Error ou validação de formulário
```

### Teste 4: Criar Product com Measuring Unit
```typescript
// Deve funcionar
await createProduct({
  name: 'Test Product',
  category_id: 'uuid',
  measuring_unit_id: 'uuid',  // ✅ Presente
});
// Esperado: Product criado com sucesso
```

---

## 📊 Resumo de Mudanças

| Arquivo | Linha | Mudança | Status |
|---------|-------|---------|--------|
| `zebraPrinter.ts` | 209 | Validar `product_id` obrigatório | ⏳ Pendente |
| `zebraPrinter.ts` | 212 | Adicionar `subcategory_id` | ⏳ Pendente |
| `zebraPrinter.ts` | ~20 | Verificar interface `LabelData` | ⏳ Pendente |
| `LabelForm.tsx` | ~550 | Adicionar campo measuring unit | ⏳ Pendente |
| `LabelForm.tsx` | 572 | Incluir `measuring_unit_id` no insert | ⏳ Pendente |

---

## 🚨 Impacto

### Baixo Risco:
- ✅ Adicionar campos ao insert (se dados existem)
- ✅ Validações antes de insert

### Médio Risco:
- ⚠️ Mudança em interface TypeScript (pode quebrar compilação)
- ⚠️ Adicionar campo obrigatório no formulário (UX)

### Alto Risco:
- ❌ Alterar schema do banco para NOT NULL (requer migração de dados existentes)

---

## ✅ Recomendação

**Ordem de Execução:**

1. ✅ Primeiro: Adicionar campos aos inserts (sem validação estrita)
2. ✅ Segundo: Verificar que dados estão sendo salvos corretamente
3. ✅ Terceiro: Adicionar validações para novos registros
4. ⏳ Quarto: Limpar dados existentes com nulls
5. ⏳ Quinto: Aplicar constraints NOT NULL no banco

**Próximo Passo Imediato:**
Verificar se `subcategoryId` existe na interface `LabelData` e como é passado quando labels são criados.

---

**Status:** 📋 **ANÁLISE COMPLETA - CORREÇÕES PENDENTES**  
**Data:** 27 de Janeiro de 2026  
**Prioridade:** 🔴 **ALTA** (Integridade de dados)
