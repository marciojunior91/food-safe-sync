# 🧪 GUIA DE TESTING - DIA 2 LABELING

**Data:** 22 Jan 2026  
**Status:** 🔄 EM ANDAMENTO  
**Tempo Estimado:** 10 horas (8h testing + 2h bug fixes)  

---

## 📊 PRÉ-REQUISITOS

### ✅ CHECKLIST ANTES DE COMEÇAR:

- [x] BUG-004 fixed (stats org filter)
- [ ] Build rodando sem erros (`npm run dev`)
- [ ] Logged in como user válido
- [ ] Organization_id existe no profile
- [ ] Database tem produtos cadastrados
- [ ] Console DevTools aberto (F12)

---

## 🎯 TEST #1: LABELING PAGE LOAD (30min)

### 📋 Objetivo:
Verificar que a página Labeling carrega corretamente e mostra dados da organização correta.

### 🔧 Passos:

1. **Abrir aplicação:**
   ```
   npm run dev
   ```
   - Aguardar servidor iniciar
   - Abrir: http://localhost:5173

2. **Login:**
   - Email: `marciojunior@tampaapp.vercel.app` (ou seu user)
   - Password: sua senha
   - Clicar "Sign In"

3. **Navegar para Labeling:**
   - Sidebar → "Etiquetas" 📄
   - Ou URL direta: `/labeling`

4. **Observar no Console (F12):**
   - [ ] ❌ Nenhum erro vermelho
   - [ ] ✅ "Fetching products..." log
   - [ ] ✅ "Organization ID: xxx" log

5. **Verificar Dashboard Stats (topo da página):**
   - [ ] **"Impressas Hoje"** - número aparece (pode ser 0)
   - [ ] **"Total de Etiquetas"** - número aparece
   - [ ] **"Expiram em 24h"** - número aparece

6. **Verificar Products Grid:**
   - [ ] Products aparecem (cards ou tabela)
   - [ ] Nome do produto visível
   - [ ] Categoria visível
   - [ ] Allergen badges aparecem (se produto tem)

### ✅ Resultado Esperado:
- Página carrega sem erros
- Stats mostram números (mesmo que zeros)
- Products da SUA organização aparecem
- Nenhum erro no console

### ❌ Se falhar:
- Screenshot do erro
- Copy do console log
- Anotar mensagem de erro
- Continuar para próximo test

---

## 🧪 TEST #2: DASHBOARD STATS VALIDATION (30min)

### 📋 Objetivo:
**CRÍTICO** - Validar BUG-004 fix: Stats devem mostrar APENAS dados da sua org.

### 🔧 Passos:

1. **Abrir Supabase Dashboard:**
   - Ir para: https://supabase.com/dashboard
   - Selecionar projeto Tampa APP
   - Sidebar → SQL Editor

2. **Query 1 - Confirmar seu organization_id:**
   ```sql
   SELECT 
     user_id,
     organization_id,
     display_name
   FROM profiles
   WHERE user_id = auth.uid();
   ```
   - Copiar o `organization_id` (UUID)

3. **Query 2 - Count manual de labels TODAY:**
   ```sql
   SELECT COUNT(*) as labels_today
   FROM printed_labels
   WHERE organization_id = 'SEU_ORG_ID_AQUI'
     AND created_at >= CURRENT_DATE
     AND created_at < CURRENT_DATE + INTERVAL '1 day';
   ```
   - Anotar resultado

4. **Query 3 - Count manual TOTAL:**
   ```sql
   SELECT COUNT(*) as total_labels
   FROM printed_labels
   WHERE organization_id = 'SEU_ORG_ID_AQUI';
   ```
   - Anotar resultado

5. **Query 4 - Count manual EXPIRING:**
   ```sql
   SELECT COUNT(*) as expiring_labels
   FROM printed_labels
   WHERE organization_id = 'SEU_ORG_ID_AQUI'
     AND expiry_date >= CURRENT_DATE
     AND expiry_date <= CURRENT_DATE + INTERVAL '1 day';
   ```
   - Anotar resultado

6. **Comparar com UI:**
   - Voltar para app (Labeling page)
   - Refresh a página (F5)
   - Comparar números:
     * "Impressas Hoje" = labels_today?
     * "Total de Etiquetas" = total_labels?
     * "Expiram em 24h" = expiring_labels?

### ✅ Resultado Esperado:
- Números da UI **EXATAMENTE IGUAIS** aos do database
- Stats filtrados por organization_id (BUG-004 fix confirmado)

### ❌ Se números diferentes:
- 🔴 **BUG-004 NÃO FIXED** ou outro problema
- Screenshot dos 2 lugares (UI + SQL result)
- Anotar diferenças
- Reportar imediatamente

---

## 🔍 TEST #3: PRODUCTS LIST (30min)

### 📋 Objetivo:
Verificar que lista de produtos mostra APENAS produtos da sua org.

### 🔧 Passos:

1. **Query manual no Supabase:**
   ```sql
   SELECT 
     id,
     name,
     category_id,
     organization_id
   FROM products
   WHERE organization_id = 'SEU_ORG_ID_AQUI'
   ORDER BY name;
   ```
   - Copiar lista de nomes

2. **Comparar com UI:**
   - Voltar para app
   - Verificar se TODOS produtos da query aparecem
   - Verificar se NÃO aparecem produtos de outras orgs

3. **Test Search:**
   - Digitar nome de produto no search box
   - Verificar filtragem funciona
   - Limpar search

4. **Test Allergen Badges:**
   - Encontrar produto COM allergens
   - Verificar badges aparecem (ex: 🥛 Leite, 🥜 Amendoim)
   - Cores certas (amarelo = warning, vermelho = danger)

### ✅ Resultado Esperado:
- Lista mostra APENAS produtos da sua org
- Search funciona
- Allergen badges renderizam

### ❌ Se falhar:
- Produto de outra org aparece? → 🔴 RLS PROBLEM
- Badge não aparece? → 🟡 Styling issue
- Search não funciona? → 🟡 Filter bug

---

## 🖨️ TEST #4: QUICK PRINT GRID (45min)

### 📋 Objetivo:
Testar grid 2x3 de categorias para quick printing.

### 🔧 Passos:

1. **Abrir Quick Print:**
   - Clicar botão "Impressão Rápida" (ou similar)
   - Verificar modal/panel abre

2. **Verificar Grid Layout:**
   - [ ] 6 categorias principais aparecem
   - [ ] Layout 2x3 (2 colunas, 3 linhas)
   - [ ] Ícone por categoria
   - [ ] Product count por categoria

3. **Test Navigation:**
   - Clicar em 1 categoria
   - Verificar subcategorias aparecem
   - Clicar em subcategoria
   - Verificar produtos aparecem
   - Clicar breadcrumb para voltar

4. **Test Product Selection:**
   - Selecionar 1 produto
   - Verificar checkbox marca
   - Selecionar mais 2 produtos
   - Clicar "Adicionar à fila" (ou similar)

5. **Verificar Print Queue:**
   - Badge com número de items (ex: "3")
   - Abrir print queue
   - Verificar 3 produtos na fila

### ✅ Resultado Esperado:
- Grid renderiza 6 categorias
- Navigation funciona (categoria → sub → produto)
- Selection funciona
- Print queue atualiza

### ❌ Se falhar:
- Grid não aparece? → Check data loading
- Navigation quebrada? → Check state management
- Queue não atualiza? → Check usePrintQueue hook

---

## 🎨 TEST #5: PDF GENERATION (60min)

### 📋 Objetivo:
Testar geração de PDF com jsPDF + html2canvas.

### 🔧 Passos:

1. **Select Product:**
   - Na lista de produtos, clicar "Imprimir" em 1 produto

2. **Fill Form:**
   - Production Date: hoje
   - Expiry Date: amanhã
   - Condition: Refrigerado (ou outro)
   - Team Member: selecionar um
   - Clicar "Gerar Etiqueta"

3. **Observe:**
   - [ ] PDF preview aparece
   - [ ] Layout label 101x152mm
   - [ ] QR code renderiza
   - [ ] Logo Tampa aparece
   - [ ] Product name visível
   - [ ] Dates corretas
   - [ ] Allergen badges (se tem)

4. **Download PDF:**
   - Clicar "Download" ou "Salvar"
   - Verificar arquivo .pdf baixa
   - Abrir PDF
   - Verificar qualidade (texto legível, QR code escaneável)

5. **Test Print:**
   - Clicar "Imprimir"
   - Dialog de impressão abre
   - Selecionar impressora (ou Save as PDF)
   - Confirmar

### ✅ Resultado Esperado:
- PDF gera sem erros
- Layout correto (101x152mm)
- QR code escaneável
- Print dialog funciona

### ❌ Se falhar:
- PDF vazio? → Check html2canvas
- QR code não aparece? → Check qrcode.react
- Layout quebrado? → Check CSS dimensions

---

## 🖨️ TEST #6: ZEBRA PRINTER FLOW (30min)

### 📋 Objetivo:
Verificar flow de registro e seleção de Zebra printer.

### 🔧 Passos:

1. **Abrir Settings:**
   - Sidebar → "Configurações" ⚙️
   - Tab "Impressoras Zebra"

2. **Verificar Printer Registered:**
   - [ ] Printer "DFJ253402166" aparece na lista
   - [ ] Status: "Disponível" ou "Offline"
   - [ ] Model: ZD411

3. **Select Printer:**
   - Se múltiplas, selecionar DFJ253402166
   - Verificar badge "Selecionada"

4. **Test Print (SE TIVER TABLET):**
   - Voltar para Labeling
   - Gerar 1 label
   - Clicar "Enviar para Zebra"
   - Verificar:
     * [ ] Label enviada via Bluetooth
     * [ ] Printer imprime
     * [ ] Layout correto no papel

5. **Test Print (SEM TABLET):**
   - Verificar mensagem "Aguardando tablet Android"
   - Confirmar flow até envio funciona
   - PDF fallback disponível

### ✅ Resultado Esperado:
- Printer listada
- Selection funciona
- Send to Zebra flow completo (mesmo sem print físico)

### ❌ Se falhar:
- Printer não aparece? → Check database insert
- Selection não salva? → Check localStorage
- Send falha? → Check Bluetooth API (precisa tablet)

---

## 📊 TEST #7: PRINT HISTORY (30min)

### 📋 Objetivo:
Verificar histórico de labels impressos.

### 🔧 Passos:

1. **Gerar Labels:**
   - Imprimir 3 labels diferentes
   - Anotar products usados

2. **Abrir History:**
   - Tab "Histórico" (se existir)
   - Ou sidebar → "Histórico de Impressões"

3. **Verificar List:**
   - [ ] 3 labels aparecem
   - [ ] Ordem: mais recente primeiro
   - [ ] Cada item mostra:
     * Product name
     * Date/time
     * Team member
     * Status (printed/pending)

4. **Test Filters:**
   - Filter por data (hoje)
   - Filter por produto
   - Filter por team member

5. **Test Reprint:**
   - Clicar "Re-imprimir" em 1 label
   - Verificar PDF gera novamente
   - Verificar nova entry no history

### ✅ Resultado Esperado:
- History mostra labels
- Filters funcionam
- Reprint funciona

### ❌ Se falhar:
- History vazio? → Check printed_labels table insert
- Filters não funcionam? → Check query logic
- Reprint falha? → Check label data retrieval

---

## ⚡ TEST #8: PERFORMANCE (30min)

### 📋 Objetivo:
Verificar performance com muitos produtos (BUG-005).

### 🔧 Passos:

1. **Open DevTools:**
   - F12 → Network tab
   - Enable "Preserve log"

2. **Reload Labeling Page:**
   - F5
   - Observar Network requests

3. **Count Queries:**
   - Quantas requests para `printed_labels`?
   - Se 1 product → 1 request? ✅
   - Se 100 products → 100 requests? ❌ (BUG-005)

4. **Measure Load Time:**
   - F12 → Performance tab
   - Start recording
   - Reload page (F5)
   - Stop recording
   - Check "Load" time (deve ser <3s)

5. **Check Memory:**
   - F12 → Memory tab
   - Take heap snapshot
   - Check size (<50MB ideal)

### ✅ Resultado Esperado:
- Load time <3s
- Queries otimizadas (não N+1)
- Memory usage razoável

### ❌ Se falhar:
- >100 queries? → BUG-005 presente
- >5s load? → Performance issue
- >100MB memory? → Memory leak

---

## 🎨 TEST #9: UI/UX (30min)

### 📋 Objetivo:
Verificar responsividade e acessibilidade.

### 🔧 Passos:

1. **Test Responsive:**
   - F12 → Device toolbar (Ctrl+Shift+M)
   - iPhone 12 (390x844)
   - iPad (768x1024)
   - Desktop (1920x1080)
   - Verificar layout adapta

2. **Test Keyboard Navigation:**
   - Tab através dos forms
   - Enter para submit
   - Esc para close dialogs

3. **Test Dark Mode (se existir):**
   - Toggle dark mode
   - Verificar contraste
   - Verificar badges legíveis

4. **Test Accessibility:**
   - F12 → Lighthouse
   - Run audit (Accessibility only)
   - Target score: >90

### ✅ Resultado Esperado:
- Responsive em 3 breakpoints
- Keyboard navigation funciona
- Lighthouse >90

### ❌ Se falhar:
- Layout quebrado mobile? → Fix CSS
- Tab navigation ruim? → Add tabIndex
- Low score? → Check aria-labels

---

## 🐛 TEST #10: BUG HUNTING (60min)

### 📋 Objetivo:
Encontrar bugs não documentados.

### 🔧 Cenários de Edge Cases:

1. **Empty States:**
   - [ ] Org sem produtos → mensagem "Nenhum produto"
   - [ ] Org sem labels → stats mostram 0
   - [ ] Print queue vazia → mensagem adequada

2. **Error Handling:**
   - [ ] Disconnect internet → error message
   - [ ] Invalid product data → não quebra
   - [ ] Expired session → redirect login

3. **Concurrency:**
   - [ ] 2 tabs abertas → state sync?
   - [ ] Print em paralelo → queue funciona?

4. **Data Limits:**
   - [ ] Product name muito longo → truncate?
   - [ ] 100 allergens → UI aguenta?
   - [ ] 1000 labels no history → paginação?

5. **Duplicate Detection:**
   - [ ] Create produto similar → warning aparece
   - [ ] Similarity threshold correto
   - [ ] Warning não bloqueia

### 📝 Anotar bugs encontrados:
```
BUG-XXX: [Descrição]
Severidade: HIGH/MEDIUM/LOW
Steps to reproduce: ...
Expected: ...
Actual: ...
```

---

## 📊 RESULTADO FINAL

### ✅ Tests Passed: __/10

### 🐛 Bugs Found:
- BUG-004: ✅ FIXED (stats org filter)
- BUG-005: ⏸️ TODO (N+1 query performance)
- BUG-006: ...
- BUG-007: ...

### 🎯 Progress:
- Início: 35%
- Fim: __% (target 45%)

### ⏱️ Time Spent:
- Testing: __h
- Bug fixes: __h
- Total: __h

---

## 🚀 PRÓXIMOS PASSOS

**SE TODOS TESTS PASSARAM (8+/10):**
- ✅ Mark DIA_2 complete
- ✅ Update PROGRESS_TRACKER.md
- ✅ Git commit
- 🚀 Start DIA 3 (Team Members + Feed)

**SE BUGS CRÍTICOS ENCONTRADOS (<6/10):**
- 🔴 Fix blockers imediatamente
- 🟡 Document medium bugs
- 🟢 Defer low priority
- 🔄 Re-test até >8/10

---

**TESTING COMEÇANDO AGORA!** 🧪  
**MARCHA FIO!!!** 🚀
