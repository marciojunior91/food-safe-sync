# UI/UX Improvements - February 2026
**Cliente:** Nathalia Mello  
**Data:** 11/02/2026  
**Status:** 🔄 Em Execução  
**Tarefas:** 40 total

---

## 📋 ÍNDICE DE BLOCOS

1. [Fluxo de Navegação Principal](#bloco-1-fluxo-de-navegação-principal) - 3 tarefas
2. [Dashboard - Layout e Cards](#bloco-2-dashboard---layout-e-cards) - 7 tarefas
3. [Dashboard - Compliance Score Detalhado](#bloco-3-dashboard---compliance-score-detalhado) - 2 tarefas
4. [Dashboard - Seletores de Contexto (Fase 2 Ready)](#bloco-4-dashboard---seletores-de-contexto-fase-2-ready) - 1 tarefa
5. [Labels - Renomeação](#bloco-5-labels---renomeação) - 2 tarefas
6. [New Label - Melhorias UX](#bloco-6-new-label---melhorias-ux) - 6 tarefas
7. [Preview da Label](#bloco-7-preview-da-label) - 3 tarefas
8. [Label Preview Component - Nova Funcionalidade](#bloco-8-label-preview-component---nova-funcionalidade) - 2 tarefas
9. [QR Code](#bloco-9-qr-code) - 2 tarefas
10. [Print](#bloco-10-print) - 2 tarefas
11. [Product Cards](#bloco-11-product-cards) - 1 tarefa
12. [Team Member - Correções](#bloco-12-team-member---correções) - 2 tarefas
13. [Admin](#bloco-13-admin) - 1 tarefa
14. [UX Geral](#bloco-14-ux-geral) - 2 tarefas
15. [Alergias](#bloco-15-alergias) - 1 tarefa
16. [Design System](#bloco-16-design-system) - 3 tarefas

---

## 🎯 BLOCO 1: Fluxo de Navegação Principal
**Prioridade:** 🔴 CRÍTICA - Muda fluxo principal da aplicação

### ✅ T1.1 - Mudar Landing Page: Dashboard → Labels
**Objetivo:** Quando usuário faz login, deve abrir direto na tela de Labels (não Dashboard)

**Arquivos:**
- `src/App.tsx` ou router principal
- Redirect default após login

**Implementação:**
```typescript
// Após autenticação bem-sucedida:
// ANTES: navigate('/dashboard')
// DEPOIS: navigate('/labels')
```

**Critério de Aceite:**
- [ ] Login redireciona para `/labels`
- [ ] Breadcrumb/navegação reflete mudança
- [ ] Dashboard ainda acessível via menu

---

### ✅ T1.2 - Team Member Selection na Tela de Labels
**Objetivo:** Ao abrir Labels, usuário deve selecionar qual Team Member ele é (dentro do auth user logado)

**Contexto:** Um auth user pode representar múltiplos team members (turnos diferentes, etc.)

**Arquivos:**
- `src/pages/Labels.tsx` ou equivalente
- Component de seleção de Team Member

**Implementação:**
- Modal/Drawer ao entrar em Labels (se não selecionado ainda)
- Dropdown/selector persistente no header de Labels
- Salvar seleção em localStorage + context

**Critério de Aceite:**
- [ ] Modal abre automaticamente se team member não selecionado
- [ ] Seleção persiste durante sessão
- [ ] Pode trocar team member via header
- [ ] Labels filtradas pelo team member selecionado

---

### ✅ T1.3 - Adicionar Logo no Topo (Mobile e Tablet)
**Objetivo:** Logo da aplicação deve aparecer no header em dispositivos móveis

**Arquivos:**
- `src/components/Layout/Header.tsx` ou equivalente

**Implementação:**
- Adicionar logo no início do header
- Responsive: menor em mobile, maior em tablet
- Manter alinhamento com outros elementos

**Critério de Aceite:**
- [ ] Logo visível em mobile (≤768px)
- [ ] Logo visível em tablet (769px-1024px)
- [ ] Não quebra layout em telas pequenas
- [ ] Logo clicável retorna para home (Labels agora)

---

## 🎯 BLOCO 2: Dashboard - Layout e Cards
**Prioridade:** 🟡 ALTA - Dashboard continua importante para gestores

### ✅ T2.1 - Admin: Renomear "Kitchen Dashboard" → "Dashboard"
**Objetivo:** Simplificar nomenclatura para admin

**Arquivos:**
- `src/pages/Dashboard.tsx` ou equivalente
- Menu/sidebar entries

**Implementação:**
```typescript
// ANTES: "Kitchen Dashboard"
// DEPOIS: "Dashboard"
```

**Critério de Aceite:**
- [ ] Título da página = "Dashboard"
- [ ] Menu lateral = "Dashboard"
- [ ] Breadcrumb = "Dashboard"
- [ ] Apenas para role Admin

---

### ✅ T2.2 - Remover Card: "User Profile & Roles"
**Objetivo:** Limpar dashboard, remover card de perfil

**Arquivos:**
- `src/pages/Dashboard.tsx`
- `src/components/Dashboard/UserProfileCard.tsx` (se existir)

**Implementação:**
- Comentar/remover component
- Ajustar grid layout

**Critério de Aceite:**
- [ ] Card não aparece no dashboard
- [ ] Layout não quebra (grid ajustado)
- [ ] Funcionalidade acessível em outro lugar (Settings?)

---

### ✅ T2.3 - Remover Card: "Printer Management"
**Objetivo:** Limpar dashboard, remover card de impressora

**Arquivos:**
- `src/pages/Dashboard.tsx`
- `src/components/Dashboard/PrinterManagementCard.tsx` (se existir)

**Implementação:**
- Comentar/remover component
- Ajustar grid layout

**Critério de Aceite:**
- [ ] Card não aparece no dashboard
- [ ] Layout não quebra (grid ajustado)
- [ ] Funcionalidade acessível em Settings/Admin

---

### ✅ T2.4 - Novo Card: "Expiring Today"
**Objetivo:** Mostrar produtos que expiram hoje (até 23:59 do dia atual)

**Arquivos:**
- `src/components/Dashboard/ExpiringTodayCard.tsx` (novo)
- `src/pages/Dashboard.tsx`

**Implementação:**
```typescript
// Query: WHERE expiry_date::date = CURRENT_DATE
// Icon: ⚠️ ou similar
// Clicável: navega para /labels?filter=expiring-today
```

**Critério de Aceite:**
- [ ] Mostra contagem de produtos expirando hoje
- [ ] Clicável (navega para lista filtrada)
- [ ] Atualiza em tempo real
- [ ] Visual: ícone de alerta, cor warning

---

### ✅ T2.5 - Novo Card: "Expiring Tomorrow"
**Objetivo:** Mostrar produtos que expiram amanhã (dia seguinte)

**Arquivos:**
- `src/components/Dashboard/ExpiringTomorrowCard.tsx` (novo)
- `src/pages/Dashboard.tsx`

**Implementação:**
```typescript
// Query: WHERE expiry_date::date = CURRENT_DATE + INTERVAL '1 day'
// Icon: 📅 ou similar
// Clicável: navega para /labels?filter=expiring-tomorrow
```

**Critério de Aceite:**
- [ ] Mostra contagem de produtos expirando amanhã
- [ ] Clicável (navega para lista filtrada)
- [ ] Atualiza em tempo real
- [ ] Visual: ícone de calendário, cor info

---

### ✅ T2.6 - Manter Card: "Expiring Soon (Next 24h)"
**Objetivo:** Card existente continua (não conflita com T2.4)

**Nota:** "Expiring Today" = até fim do dia atual  
"Expiring Soon" = próximas 24h a partir de agora

**Critério de Aceite:**
- [ ] Card existente permanece funcional
- [ ] Lógica: próximas 24h a partir de `NOW()`
- [ ] Não confundir com "Expiring Today"

---

### ✅ T2.7 - Tornar TODOS os Cards Clicáveis
**Objetivo:** Cada card deve ter navegação/ação ao clicar

**Arquivos:**
- Todos os dashboard cards

**Implementação:**
```typescript
// Cada card deve ter:
<Card className="cursor-pointer hover:shadow-lg" onClick={handleNavigate}>
```

**Mapeamento de Navegação:**
- Labels Today → `/labels?filter=today`
- Total Labels → `/labels`
- Recent Labels → `/labels?sort=recent&limit=10`
- Expiring Soon → `/labels?filter=expiring-soon`
- Expiring Today → `/labels?filter=expiring-today`
- Expiring Tomorrow → `/labels?filter=expiring-tomorrow`
- Compliance Score → `/compliance` (nova rota, ver Bloco 3)

**Critério de Aceite:**
- [ ] Todos os cards têm `cursor: pointer`
- [ ] Hover effect visível
- [ ] Navegação funcional
- [ ] URL params aplicados corretamente

---

## 🎯 BLOCO 3: Dashboard - Compliance Score Detalhado
**Prioridade:** 🟡 ALTA - Métrica importante

### ✅ T3.1 - Atualizar Lógica: Compliance Score (Tasks + Labels)
**Objetivo:** Score deve considerar tanto lifecycle de Tasks quanto de Labels

**Arquivos:**
- `src/lib/compliance.ts` (ou onde está a lógica)
- Backend se necessário

**Implementação:**
```typescript
// Compliance Score = média ponderada de:
// 1. Task Completion Rate (tasks concluídas no prazo)
// 2. Label Usage Rate (produtos com label vs sem label)
// 3. Label Discard Rate (produtos descartados corretamente após expirar)
// 4. Label Registry Rate (produtos registrados corretamente)

interface ComplianceMetrics {
  taskCompletionRate: number; // %
  labelUsageRate: number; // %
  labelDiscardRate: number; // %
  labelRegistryRate: number; // %
  overallScore: number; // média ponderada
}
```

**Critério de Aceite:**
- [ ] Score reflete tasks E labels
- [ ] Cálculo documentado
- [ ] Atualiza em tempo real
- [ ] Histórico salvo (para comparação semanal)

---

### ✅ T3.2 - Nova Rota: `/compliance` (Detalhamento)
**Objetivo:** Página dedicada mostrando breakdown do compliance score

**Arquivos:**
- `src/pages/Compliance.tsx` (novo)
- `src/routes.tsx`

**Implementação:**
- Gráficos de breakdown por categoria
- Tabela de detalhes
- Filtros por período
- Export para PDF/Excel

**Critério de Aceite:**
- [ ] Rota acessível via card no dashboard
- [ ] Mostra detalhamento por categoria
- [ ] Gráficos visuais (chart.js ou recharts)
- [ ] Filtros funcionais
- [ ] Export funcional

---

## 🎯 BLOCO 4: Dashboard - Seletores de Contexto (Fase 2 Ready)
**Prioridade:** 🟢 MÉDIA - Preparação para Fase 2

### ✅ T4.1 - Preparar Estrutura: Seletor Venue e Station
**Objetivo:** Dashboard preparado para filtrar por local/ambiente (Fase 2)

**Arquivos:**
- `src/components/Dashboard/ContextSelector.tsx` (novo)
- `src/pages/Dashboard.tsx`
- Database: adicionar campo `station` em `products` table

**Implementação:**
```typescript
// Header do Dashboard (apenas Admin)
<ContextSelector 
  venues={venues} // lista de venues da org
  stations={stations} // ['Bar', 'Kitchen', 'Freezer', 'Storage']
  onVenueChange={handleVenueChange}
  onStationChange={handleStationChange}
/>

// Fase 1: UI pronta, não filtra ainda
// Fase 2: aplicar filtros nas queries
```

**Critério de Aceite:**
- [ ] Seletores visíveis no header (apenas Admin)
- [ ] UI/UX funcional
- [ ] Não quebra funcionalidade atual
- [ ] Preparado para Fase 2 (filtros comentados)
- [ ] Database schema atualizado (migration)

---

## 🎯 BLOCO 5: Labels - Renomeação
**Prioridade:** 🟡 ALTA - Consistência de nomenclatura

### ✅ T5.1 - Renomear: "Labeling" → "Labels"
**Objetivo:** Consistência em toda a aplicação

**Arquivos:**
- Menu/sidebar
- Breadcrumbs
- Page titles
- Todas as referências de texto

**Implementação:**
```typescript
// Global search & replace:
// "Labeling" → "Labels"
// "labeling" → "labels"
// Exceto: código/variáveis internas
```

**Critério de Aceite:**
- [ ] Menu = "Labels"
- [ ] Page title = "Labels"
- [ ] Breadcrumb = "Labels"
- [ ] URLs permanecem `/labels` (já correto)
- [ ] Nenhuma referência visual a "Labeling"

---

### ✅ T5.2 - Remover Descrição: "Label Management"
**Objetivo:** Limpar UI, remover texto descritivo dentro da página

**Arquivos:**
- `src/pages/Labels.tsx`

**Implementação:**
```typescript
// REMOVER algo como:
// <p className="text-muted">Monitor your kitchen operations and food safety</p>
```

**Critério de Aceite:**
- [ ] Descrição removida
- [ ] Layout não quebra
- [ ] Espaçamento ajustado

---

## 🎯 BLOCO 6: New Label - Melhorias UX
**Prioridade:** 🔴 CRÍTICA - Usabilidade em tablet

### ✅ T6.1 - Desabilitar Teclado Automático
**Objetivo:** Teclado NÃO deve abrir automaticamente ao entrar na tela

**Arquivos:**
- `src/pages/NewLabel.tsx`
- Todos os inputs da tela

**Implementação:**
```typescript
// Remover autoFocus de TODOS os inputs
// ANTES: <Input autoFocus {...} />
// DEPOIS: <Input {...} />
```

**Critério de Aceite:**
- [ ] Teclado não abre ao entrar na tela
- [ ] Teclado abre apenas ao clicar no input
- [ ] Aplicado em TODOS os inputs da tela

---

### ✅ T6.2 - Team Member: Não Repetir Nome se Já Selecionado
**Objetivo:** Se team member já foi selecionado (T1.2), não mostrar campo novamente

**Arquivos:**
- `src/pages/NewLabel.tsx`
- Context/state de team member

**Implementação:**
```typescript
// Se teamMember já selecionado:
// - Pré-preencher campo
// - Mostrar apenas como read-only ou ocultar
// - Adicionar botão "Change Team Member" (opcional)
```

**Critério de Aceite:**
- [ ] Campo pré-preenchido se team member selecionado
- [ ] Não pode editar (ou apenas via botão específico)
- [ ] Consistente com seleção do Bloco 1

---

### ✅ T6.3 - Aumentar Tamanho da Fonte
**Objetivo:** Melhorar legibilidade em tablet

**Arquivos:**
- `src/pages/NewLabel.tsx`
- CSS/Tailwind classes

**Implementação:**
```typescript
// Aumentar fonte de:
// - Labels dos campos: text-sm → text-base
// - Inputs: text-base → text-lg
// - Botões: text-base → text-lg
```

**Critério de Aceite:**
- [ ] Fonte maior em todos os campos
- [ ] Legível em tablet sem zoom
- [ ] Não quebra layout em mobile

---

### ✅ T6.4 - Aumentar Tamanho do Calendário (Date Picker)
**Objetivo:** Date picker maior e mais fácil de usar em tablet

**Arquivos:**
- Component de DatePicker (shadcn/ui ou equivalente)

**Implementação:**
```typescript
// Ajustar classes:
// - Calendar: w-auto → w-full max-w-md
// - Cells: p-2 → p-4
// - Font: text-sm → text-base
```

**Critério de Aceite:**
- [ ] Calendário maior (visualmente)
- [ ] Células mais espaçadas
- [ ] Fácil de clicar com dedo em tablet

---

### ✅ T6.5 - Campo: "Nova Alergia" (Custom Allergen)
**Objetivo:** Permitir adicionar alergia customizada no momento

**Arquivos:**
- `src/pages/NewLabel.tsx`
- Component de AllergenSelector
- Backend: allergens table

**Implementação:**
```typescript
// Adicionar botão "+ Nova Alergia" abaixo do selector
// Modal/Inline form:
<Input 
  placeholder="Nome da alergia (ex: Mostarda)" 
  onSubmit={handleAddCustomAllergen}
/>

// Backend: salvar em allergens table com flag `is_custom: true`
```

**Critério de Aceite:**
- [ ] Botão "+ Nova Alergia" visível
- [ ] Modal/form funcional
- [ ] Alergia adicionada aparece na lista
- [ ] Salva no banco com flag custom
- [ ] Disponível para próximas labels

---

### ✅ T6.6 - Alergia: Selecionar Clicando na Caixa Inteira
**Objetivo:** Melhorar UX, não apenas checkbox

**Arquivos:**
- Component de AllergenSelector

**Implementação:**
```typescript
// ANTES: onClick apenas no checkbox
// DEPOIS: onClick no card/container inteiro

<div 
  className="cursor-pointer hover:bg-accent"
  onClick={() => toggleAllergen(id)}
>
  <Checkbox checked={selected} readOnly />
  <span>{name}</span>
</div>
```

**Critério de Aceite:**
- [ ] Clicar em qualquer parte do card seleciona
- [ ] Hover effect visível
- [ ] Checkbox visual atualiza
- [ ] Acessibilidade mantida (keyboard nav)

---

## 🎯 BLOCO 7: Preview da Label
**Prioridade:** 🟡 ALTA - Correções visuais importantes

### ✅ T7.1 - Corrigir: Label Cortada na Parte de Baixo
**Objetivo:** Label preview deve mostrar todo o conteúdo

**Arquivos:**
- `src/components/LabelPreview.tsx` ou equivalente
- CSS do preview

**Implementação:**
```css
/* Verificar overflow, height, padding */
.label-preview {
  min-height: auto; /* ou valor adequado */
  overflow: visible;
  padding-bottom: adequate;
}
```

**Critério de Aceite:**
- [ ] Todo conteúdo visível
- [ ] Não corta texto/códigos
- [ ] Scroll funcional se necessário

---

### ✅ T7.2 - Remover: Nome do Restaurante (ex: "Tampa Restaurante")
**Objetivo:** Limpar preview, remover info redundante

**Arquivos:**
- `src/components/LabelPreview.tsx`
- Template de impressão

**Implementação:**
```typescript
// REMOVER linha:
// <Text>{organization.name}</Text>
```

**Critério de Aceite:**
- [ ] Nome do restaurante não aparece no preview
- [ ] Nome do restaurante não aparece na impressão
- [ ] Layout ajustado

---

### ✅ T7.3 - Trocar: "Manufacture Date" → "Prep Date"
**Objetivo:** Nomenclatura mais adequada para restaurante

**Arquivos:**
- `src/components/LabelPreview.tsx`
- Template de impressão
- Database schema (se necessário)

**Implementação:**
```typescript
// ANTES: "Manufacture Date"
// DEPOIS: "Prep Date"

// Se estiver no schema:
// ALTER TABLE labels RENAME COLUMN manufacture_date TO prep_date;
```

**Critério de Aceite:**
- [ ] Label mostra "Prep Date"
- [ ] Impressão mostra "Prep Date"
- [ ] Database atualizado (migration)
- [ ] Nenhuma referência a "Manufacture Date"

---

## 🎯 BLOCO 8: Label Preview Component - Nova Funcionalidade
**Prioridade:** 🟢 MÉDIA - Feature adicional

### ✅ T8.1 - Componentizar: Label Preview Reutilizável
**Objetivo:** Preview usado em New Label deve ser componente reutilizável

**Arquivos:**
- `src/components/LabelPreview.tsx` (refatorar)
- `src/components/LabelPreviewModal.tsx` (novo)

**Implementação:**
```typescript
// Component:
<LabelPreview 
  label={labelData}
  mode="inline" | "modal" | "print"
/>

// Modal wrapper:
<LabelPreviewModal 
  labelId={id}
  isOpen={isOpen}
  onClose={onClose}
/>
```

**Critério de Aceite:**
- [ ] Component reutilizável
- [ ] Funciona em múltiplos contextos
- [ ] Props bem definidas
- [ ] Documentado

---

### ✅ T8.2 - Nova Rota: `/labels/:id/preview`
**Objetivo:** Rota dedicada para preview detalhado de label existente

**Arquivos:**
- `src/pages/LabelPreview.tsx` (novo)
- `src/routes.tsx`

**Implementação:**
```typescript
// Rota:
<Route path="/labels/:id/preview" element={<LabelPreview />} />

// Navegação:
// - Clicar em label na fila de impressão
// - Clicar em label na lista de labels
// - Botão "Preview" em label card
```

**Critério de Aceite:**
- [ ] Rota funcional
- [ ] Mostra label completa
- [ ] Usa component do T8.1
- [ ] Acessível de múltiplos lugares
- [ ] Botão "Print" disponível
- [ ] Botão "Close/Back" funcional

---

## 🎯 BLOCO 9: QR Code
**Prioridade:** 🔴 CRÍTICA - Funcionalidade quebrada

### ✅ T9.1 - Corrigir: QR Code Não Funciona
**Objetivo:** QR Code deve gerar leitura correta

**Arquivos:**
- `src/lib/qrcode.ts` ou equivalente
- Component que gera QR Code

**Investigação:**
```typescript
// Verificar:
// 1. Formato da URL/data codificada
// 2. Library usada (qrcode.react? qr-code-styling?)
// 3. Error correction level
// 4. Tamanho/resolução

// Testar:
// - Scanner de QR Code nativo (câmera)
// - App Suflex
// - Apps terceiros
```

**Critério de Aceite:**
- [ ] QR Code scanneável
- [ ] Retorna dados corretos
- [ ] Funciona em múltiplos leitores
- [ ] Testes documentados

---

### ✅ T9.2 - Simplificar: Estilo do QR Code
**Objetivo:** QR Code com design mais simples (melhor leitura)

**Arquivos:**
- Component de QR Code

**Implementação:**
```typescript
// Remover:
// - Logos no centro
// - Cores customizadas
// - Patterns complexos

// Usar:
// - Preto e branco apenas
// - Alto error correction (H level)
// - Sem logo/overlay
```

**Critério de Aceite:**
- [ ] QR Code preto e branco
- [ ] Sem elementos decorativos
- [ ] Alta legibilidade
- [ ] Testes de leitura OK

---

## 🎯 BLOCO 10: Print
**Prioridade:** 🟡 ALTA - UX de impressão

### ✅ T10.1 - Mover: Botão Print para Baixo (New Label)
**Objetivo:** Botão Print deve estar na parte inferior da tela

**Arquivos:**
- `src/pages/NewLabel.tsx`

**Implementação:**
```typescript
// ANTES: Botão no topo ou meio
// DEPOIS: Botão no rodapé/bottom da tela

// Usar sticky footer ou posicionamento fixo
<div className="fixed bottom-0 left-0 right-0 p-4 bg-background">
  <Button>Print Label</Button>
</div>
```

**Critério de Aceite:**
- [ ] Botão na parte inferior
- [ ] Visível mesmo com scroll
- [ ] Não sobrepõe conteúdo
- [ ] Mobile e tablet OK

---

### ✅ T10.2 - Remover: "Estimated Time Print Queue"
**Objetivo:** Simplificar UI, remover tempo estimado

**Arquivos:**
- Component de Print Queue ou similar

**Implementação:**
```typescript
// REMOVER elemento:
// <div>Estimated Time: {estimatedTime}</div>
```

**Critério de Aceite:**
- [ ] Texto removido
- [ ] Layout ajustado
- [ ] Sem elementos órfãos

---

## 🎯 BLOCO 11: Product Cards
**Prioridade:** 🟡 ALTA - Reduzir confusão

### ✅ T11.1 - Remover: Badge "Expired" dentro do Card
**Objetivo:** Evitar confusão, remover badge redundante

**Arquivos:**
- `src/components/ProductCard.tsx` ou equivalente

**Implementação:**
```typescript
// REMOVER:
// {isExpired && <Badge variant="destructive">Expired</Badge>}

// MANTER indicador visual mais sutil:
// - Cor do card diferente (opacity ou background)
// - Ícone pequeno no canto
```

**Critério de Aceite:**
- [ ] Badge "Expired" removido
- [ ] Indicador visual sutil mantido (opcional)
- [ ] Card ainda distinguível se expirado

---

## 🎯 BLOCO 12: Team Member - Correções
**Prioridade:** 🔴 CRÍTICA - Bugs de usabilidade

### ✅ T12.1 - Adicionar: Botão para Fechar Teclado
**Objetivo:** Permitir fechar teclado em campos de texto

**Arquivos:**
- Todos os forms com inputs
- Component wrapper para inputs

**Implementação:**
```typescript
// Adicionar botão "Done" ou "OK" no teclado virtual
// Para web: não aplicável (teclado físico)
// Para mobile (PWA): usar InputAccessoryView ou similar

// Alternativa: blur() ao clicar fora do input
```

**Critério de Aceite:**
- [ ] Botão visível em mobile/tablet
- [ ] Fecha teclado ao clicar
- [ ] Não quebra funcionalidade desktop

---

### ✅ T12.2 - Corrigir: Bug de Clicar Fora Fecha Página
**Objetivo:** Clicar fora do campo não deve sair da página

**Arquivos:**
- Event handlers de modais/forms
- `src/components/TeamMemberForm.tsx` ou equivalente

**Implementação:**
```typescript
// BUG: Clicar fora do input está triggering um evento de "close/back"

// INVESTIGAR:
// 1. Modal backdrop com onClose?
// 2. Event bubbling incorreto?
// 3. Navigation guard mal configurado?

// FIX: Prevenir propagação ou remover handler indevido
onClick={(e) => e.stopPropagation()}
```

**Critério de Aceite:**
- [ ] Clicar fora do input apenas deseleciona
- [ ] Não navega para outra página
- [ ] Form permanece aberto
- [ ] Teste em mobile e tablet

---

## 🎯 BLOCO 13: Admin
**Prioridade:** 🟢 MÉDIA - Feature adicional para admin

### ✅ T13.1 - Novo Botão: "Nova Categoria" (dentro de Labeling/Admin)
**Objetivo:** Admin pode criar categorias de produtos diretamente da tela de labels

**Arquivos:**
- `src/pages/Labels.tsx` (adicionar botão se role = Admin)
- `src/components/CategoryForm.tsx` (novo ou existente)

**Implementação:**
```typescript
// Botão visível apenas para Admin
{user.role === 'admin' && (
  <Button onClick={openCategoryModal}>
    + Nova Categoria
  </Button>
)}

// Modal com form:
<CategoryForm onSubmit={handleCreateCategory} />
```

**Critério de Aceite:**
- [ ] Botão visível apenas para Admin
- [ ] Modal funcional
- [ ] Categoria criada aparece na lista
- [ ] Validação funcional
- [ ] Feedback de sucesso/erro

---

## 🎯 BLOCO 14: UX Geral
**Prioridade:** 🔴 CRÍTICA - Usabilidade global

### ✅ T14.1 - Aumentar: Tamanho de Modais/Caixas
**Objetivo:** Melhorar usabilidade em tablet aumentando tamanho dos modais

**Arquivos:**
- `src/components/ui/dialog.tsx` ou equivalente
- CSS global de modais

**Implementação:**
```typescript
// Aumentar max-width e padding:
// ANTES: max-w-lg (32rem)
// DEPOIS: max-w-2xl (42rem) em mobile, max-w-4xl (56rem) em tablet

// Padding interno:
// ANTES: p-4
// DEPOIS: p-6 (mobile), p-8 (tablet)
```

**Critério de Aceite:**
- [ ] Modais maiores em tablet
- [ ] Não quebra em mobile pequeno
- [ ] Conteúdo não cortado
- [ ] Fácil de ler e interagir

---

### ✅ T14.2 - GLOBAL: Remover Teclado Automático
**Objetivo:** Teclado NÃO deve abrir automaticamente em NENHUMA tela

**Arquivos:**
- TODOS os components com inputs
- Config global (se houver)

**Implementação:**
```typescript
// Search & replace em toda a codebase:
// autoFocus={true} → remover
// autoFocus → remover

// Adicionar lint rule para prevenir:
// "no-autofocus": "error"
```

**Critério de Aceite:**
- [ ] Nenhum input abre teclado automaticamente
- [ ] Teclado abre apenas ao clicar
- [ ] Aplicado em 100% dos inputs
- [ ] Lint rule configurada
- [ ] Teste em tablet

---

## 🎯 BLOCO 15: Alergias
**Prioridade:** 🟢 BAIXA - Manutenção de feature existente

### ✅ T15.1 - Manter: Cores das Alergias
**Objetivo:** Cores atuais dos badges de alergia permanecem

**Arquivos:**
- Nenhum (não requer mudança)

**Implementação:**
- Nenhuma ação necessária
- Documentar decisão

**Critério de Aceite:**
- [ ] Cores mantidas
- [ ] Decisão documentada neste arquivo

---

## 🎯 BLOCO 16: Design System
**Prioridade:** 🟢 MÉDIA - Padronização

### ✅ T16.1 - Polimento: Responsividade iPhone (iOS)
**Objetivo:** Garantir que TODAS as telas estejam perfeitas em iPhone (iOS Safari)

**Arquivos:**
- Todos os components e pages
- CSS global

**Implementação:**
```css
/* Verificar e aplicar em TODAS as páginas: */

/* 1. Safe Area (notch do iPhone) */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 2. Viewport settings */
/* index.html: */
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

/* 3. Touch targets (min 44px) */
button, .clickable {
  min-height: 44px;
  min-width: 44px;
}

/* 4. Evitar zoom em inputs */
input, select, textarea {
  font-size: 16px; /* mínimo para iOS não dar zoom */
}

/* 5. Scroll suave */
html {
  -webkit-overflow-scrolling: touch;
}

/* 6. Fixar bounce em modals */
.modal-content {
  overscroll-behavior: contain;
}
```

**Checklist de Telas:**
- [ ] Login/Auth
- [ ] Dashboard
- [ ] Labels (lista)
- [ ] New Label
- [ ] Label Preview
- [ ] Print Queue
- [ ] Products
- [ ] Recipes
- [ ] Suppliers
- [ ] Team Members
- [ ] Tasks
- [ ] Compliance (nova)
- [ ] Settings
- [ ] Printer Management

**Testes Necessários:**
- [ ] iPhone SE (375px)
- [ ] iPhone 12/13/14 (390px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] iOS Safari + Chrome
- [ ] Modo landscape
- [ ] Keyboard overlay
- [ ] Home indicator

**Critério de Aceite:**
- [ ] Todas as telas testadas em iPhone real ou simulador
- [ ] Nenhum corte de conteúdo
- [ ] Botões acessíveis (não cobertos por keyboard)
- [ ] Modals não "bounce"
- [ ] Inputs não dão zoom indesejado
- [ ] Safe areas respeitadas

---

### ✅ T16.2 - Documentar: Tamanhos de Fonte Padrão
**Objetivo:** Criar guia de tamanhos de fonte para consistência

**Arquivos:**
- `docs/DESIGN_SYSTEM.md` (novo)

**Implementação:**
```markdown
## Typography Scale

### Mobile (≤768px)
- Heading 1: text-2xl (24px)
- Heading 2: text-xl (20px)
- Body: text-base (16px)
- Small: text-sm (14px)
- Input: text-lg (18px)

### Tablet (769px-1024px)
- Heading 1: text-3xl (30px)
- Heading 2: text-2xl (24px)
- Body: text-lg (18px)
- Small: text-base (16px)
- Input: text-xl (20px)

### Desktop (>1024px)
- Heading 1: text-4xl (36px)
- Heading 2: text-3xl (30px)
- Body: text-base (16px)
- Small: text-sm (14px)
- Input: text-base (16px)
```

**Critério de Aceite:**
- [ ] Documento criado
- [ ] Scale definido
- [ ] Exemplos visuais
- [ ] Compartilhado com equipe

---

### ✅ T16.2 - Documentar: Tamanhos de Modais Padrão
**Objetivo:** Criar guia de tamanhos de modais para consistência

**Arquivos:**
- `docs/DESIGN_SYSTEM.md`

**Implementação:**
```markdown
## Modal Sizes

### Mobile (≤768px)
- Small: max-w-sm (24rem)
- Medium: max-w-md (28rem)
- Large: max-w-lg (32rem)
- Full: max-w-full

### Tablet (769px-1024px)
- Small: max-w-lg (32rem)
- Medium: max-w-2xl (42rem)
- Large: max-w-4xl (56rem)
- Full: max-w-full

### Desktop (>1024px)
- Small: max-w-md (28rem)
- Medium: max-w-lg (32rem)
- Large: max-w-2xl (42rem)
- XLarge: max-w-4xl (56rem)
```

**Critério de Aceite:**
- [ ] Documento atualizado
- [ ] Sizes definidos
- [ ] Exemplos visuais
- [ ] Aplicado em novos components

---

### ✅ T16.3 - Criar: Lint Rule para autoFocus
**Objetivo:** Prevenir uso de autoFocus em novos códigos

**Arquivos:**
- `.eslintrc.js` ou equivalente

**Implementação:**
```javascript
// ESLint rule:
rules: {
  'react/no-autofocus': 'error',
  // Ou custom rule:
  'no-restricted-syntax': [
    'error',
    {
      selector: 'JSXAttribute[name.name="autoFocus"]',
      message: 'autoFocus is not allowed. Keyboard should only open on user interaction.',
    },
  ],
}
```

**Critério de Aceite:**
- [ ] Rule configurada
- [ ] Lint passa sem erros
- [ ] Previne novos usos de autoFocus
- [ ] Documentado no README

---

## 🎯 BLOCO 17: Printer Management - SDK Universal
**Prioridade:** � ALTA - Melhorar cadastro de impressoras

### ✅ T17.1 - Remover Campo: "Modelo" do Cadastro de Impressora
**Objetivo:** Campo "Modelo" é inútil quando descobrimos impressoras via SDK automaticamente

**Contexto:** 
- SDK descobre impressoras automaticamente (Zebra, Brother, Epson, genéricas)
- Modelo é detectado automaticamente
- Campo manual não agrega valor e pode gerar inconsistências

**Arquivos:**
- `src/components/printers/PrinterConfigDialog.tsx`
- `src/components/labels/EnhancedPrinterSettings.tsx`
- `src/components/printers/PrinterDiscoveryPanel.tsx`

**Implementação:**

**PrinterConfigDialog.tsx:**
```typescript
// REMOVER este bloco completo:
<div className="space-y-2">
  <Label htmlFor="model">Modelo</Label>
  <Select
    value={config.model}
    onValueChange={(value) => updateConfig('model', value)}
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="ZD411">ZD411</SelectItem>
      <SelectItem value="ZD421">ZD421</SelectItem>
      // ... outros
    </SelectContent>
  </Select>
</div>

// MANTER modelo apenas como read-only se detectado:
{printer?.model && (
  <div className="bg-muted p-3 rounded-md">
    <span className="text-sm text-muted-foreground">Modelo Detectado:</span>
    <span className="ml-2 font-medium">{printer.model}</span>
  </div>
)}
```

**EnhancedPrinterSettings.tsx:**
```typescript
// REMOVER este bloco:
<div className="space-y-2">
  <Label htmlFor="model">Model (Optional)</Label>
  <Input
    id="model"
    type="text"
    value={localSettings.model || ''}
    onChange={(e) => setLocalSettings({
      ...localSettings,
      model: e.target.value
    })}
    placeholder="e.g., D411, ZD421"
  />
</div>

// SUBSTITUIR por read-only se detectado:
{localSettings.model && (
  <div className="space-y-2">
    <Label>Modelo (Detectado Automaticamente)</Label>
    <Input value={localSettings.model} disabled />
  </div>
)}
```

**PrinterDiscoveryPanel.tsx:**
```typescript
// GARANTIR que modelo vem do discovery:
const printers = await manager.discoverPrinters();
// Cada printer DEVE ter:
// - model: string (detectado pelo SDK)
// - manufacturer: string (Zebra, Brother, Epson, Generic)
// - capabilities: string[] (protocolos suportados)
```

**Backend/Types:**
```typescript
// src/types/zebraPrinter.ts
interface ZebraPrinterConfig {
  // ... outros campos
  model?: string; // Opcional, vem do discovery
  modelDetectedAt?: Date; // Quando foi detectado
  autoDetected: boolean; // Flag se foi descoberto automaticamente
}
```

**Critério de Aceite:**
- [ ] Campo "Modelo" removido de forms manuais
- [ ] Modelo mostrado apenas como read-only se detectado
- [ ] Discovery preenche modelo automaticamente
- [ ] Não quebra impressoras já cadastradas (migration)
- [ ] Documentação atualizada

---

### ✅ T17.2 - Melhorar: Feedback Visual de Discovery
**Objetivo:** Deixar claro que estamos buscando QUALQUER impressora (não só Zebra)

**Arquivos:**
- `src/components/printers/PrinterDiscoveryPanel.tsx`

**Implementação:**
```typescript
// Atualizar textos:
<DialogTitle>
  Descobrir Impressoras na Rede
  <span className="text-sm font-normal text-muted-foreground block mt-1">
    Detecta Zebra, Brother, Epson e impressoras genéricas
  </span>
</DialogTitle>

// Instructions:
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <h4 className="font-medium mb-2">Como funciona:</h4>
  <ul className="space-y-1 text-sm">
    <li>✓ Busca impressoras WiFi na rede local</li>
    <li>✓ Busca impressoras Bluetooth pareadas</li>
    <li>✓ Detecta impressoras USB conectadas</li>
    <li>✓ Suporta múltiplos fabricantes (Zebra, Brother, Epson, etc.)</li>
    <li>✓ Identifica modelo e capacidades automaticamente</li>
  </ul>
</div>

// Card de impressora descoberta:
<Card>
  <CardContent className="flex items-start gap-4 p-4">
    <div className="flex-1">
      <h4>{printer.name || 'Impressora sem nome'}</h4>
      <div className="text-sm text-muted-foreground space-y-1">
        <div>Fabricante: {printer.manufacturer || 'Genérica'}</div>
        <div>Modelo: {printer.model || 'Não identificado'}</div>
        <div>Conexão: {connectionIcon} {printer.connectionType}</div>
        <div>Protocolos: {printer.capabilities?.join(', ') || 'ZPL, ESC/POS'}</div>
      </div>
    </div>
  </CardContent>
</Card>
```

**Critério de Aceite:**
- [ ] Texto claro sobre suporte a múltiplas marcas
- [ ] Feedback visual durante discovery
- [ ] Mostra fabricante e modelo detectado
- [ ] Indica protocolos suportados
- [ ] Design consistente com resto da app

---

## 📋 RESUMO

### Status Geral
- **Total:** 43 tarefas (40 originais + 3 novas)
- **Concluídas:** 0
- **Em Progresso:** 0
- **Pendentes:** 43

### Por Prioridade
- 🔴 **CRÍTICA:** 9 tarefas (+1 responsividade iOS)
- 🟡 **ALTA:** 13 tarefas (+2 printer management)
- 🟢 **MÉDIA:** 8 tarefas
- 🟢 **BAIXA:** 1 tarefa
- 📋 **DESIGN/DOC:** 4 tarefas

### Por Bloco
| Bloco | Tarefas | Status |
|-------|---------|--------|
| 1. Fluxo de Navegação | 3 | ⬜️ Pendente |
| 2. Dashboard Layout | 7 | ⬜️ Pendente |
| 3. Compliance Score | 2 | ⬜️ Pendente |
| 4. Context Selector | 1 | ⬜️ Pendente |
| 5. Labels Rename | 2 | ⬜️ Pendente |
| 6. New Label UX | 6 | ⬜️ Pendente |
| 7. Preview Label | 3 | ⬜️ Pendente |
| 8. Preview Component | 2 | ⬜️ Pendente |
| 9. QR Code | 2 | ⬜️ Pendente |
| 10. Print | 2 | ⬜️ Pendente |
| 11. Product Cards | 1 | ⬜️ Pendente |
| 12. Team Member | 2 | ⬜️ Pendente |
| 13. Admin | 1 | ⬜️ Pendente |
| 14. UX Geral | 2 | ⬜️ Pendente |
| 15. Alergias | 1 | ⬜️ Pendente |
| 16. Design System | 4 | ⬜️ Pendente (+1 iOS) |
| **17. Printer Management** | **2** | ⬜️ **NOVO** |

---

## 🎯 ORDEM DE EXECUÇÃO SUGERIDA

### Sprint 1 (1-2 dias) - Fundação
1. **Bloco 1** - Fluxo de Navegação (T1.1, T1.2, T1.3)
2. **Bloco 14** - UX Geral (T14.2 - teclado automático)
3. **Bloco 5** - Labels Rename (T5.1, T5.2)
4. **Bloco 16** - iOS Responsiveness (T16.1) 🆕

### Sprint 2 (2-3 dias) - Dashboard
5. **Bloco 2** - Dashboard Layout (T2.1 → T2.7)
6. **Bloco 3** - Compliance Score (T3.1, T3.2)
7. **Bloco 4** - Context Selector (T4.1 - preparação)

### Sprint 3 (2-3 dias) - Labels & Print
8. **Bloco 6** - New Label UX (T6.1 → T6.6)
9. **Bloco 7** - Preview Label (T7.1 → T7.3)
10. **Bloco 10** - Print (T10.1, T10.2)
11. **Bloco 17** - Printer Management (T17.1, T17.2) 🆕

### Sprint 4 (1-2 dias) - Correções & Features
12. **Bloco 9** - QR Code (T9.1, T9.2)
13. **Bloco 11** - Product Cards (T11.1)
14. **Bloco 12** - Team Member (T12.1, T12.2)
15. **Bloco 13** - Admin (T13.1)

### Sprint 5 (1 dia) - Componentização & Docs
16. **Bloco 8** - Preview Component (T8.1, T8.2)
17. **Bloco 14** - UX Geral (T14.1)
18. **Bloco 15** - Alergias (T15.1)
19. **Bloco 16** - Design System (T16.2 → T16.4)

---

## 📝 NOTAS DE IMPLEMENTAÇÃO

### Database Migrations Necessárias
```sql
-- T4.1: Adicionar campo station
ALTER TABLE products ADD COLUMN station VARCHAR(50);
CREATE INDEX idx_products_station ON products(station);

-- T7.3: Renomear manufacture_date → prep_date
ALTER TABLE labels RENAME COLUMN manufacture_date TO prep_date;

-- T6.5: Flag para alergias customizadas
ALTER TABLE allergens ADD COLUMN is_custom BOOLEAN DEFAULT FALSE;

-- T17.1: Printer auto-detection tracking
ALTER TABLE printer_configs ADD COLUMN IF NOT EXISTS auto_detected BOOLEAN DEFAULT FALSE;
ALTER TABLE printer_configs ADD COLUMN IF NOT EXISTS model_detected_at TIMESTAMP;
```

### Dependências de Tarefas
- T1.2 deve ser concluída antes de T6.2
- T8.1 deve ser concluída antes de T8.2
- T14.2 deve ser executada ANTES de qualquer outro bloco (global)
- T16.1 deve ser executada no Sprint 1 (fundação iOS)
- T16.4 deve ser executada após T14.2
- T17.1 deve ser concluída antes de T17.2

### Testes Requeridos
- [ ] Testes de navegação (T1.1, T1.2)
- [ ] Testes de dashboard (Bloco 2)
- [ ] Testes de QR Code (T9.1, T9.2)
- [ ] Testes de impressão (Bloco 10, 17)
- [ ] Testes de responsividade (mobile, tablet, desktop)
- [ ] **Testes iOS específicos (T16.1):**
  - [ ] iPhone SE, 12, 14 Pro Max
  - [ ] Safari + Chrome iOS
  - [ ] Landscape + Portrait
  - [ ] Keyboard behavior
  - [ ] Safe areas (notch)
- [ ] **Testes de Printer Discovery (T17.1, T17.2):**
  - [ ] WiFi network discovery
  - [ ] Bluetooth pairing
  - [ ] USB detection
  - [ ] Multiple manufacturers

---

## 🚀 DEPLOY CHECKLIST

Antes de deploy em produção:
- [ ] Todas as 43 tarefas concluídas
- [ ] Migrations executadas
- [ ] Testes automatizados passando
- [ ] Testes manuais em mobile/tablet
- [ ] **Testes em iPhone real (iOS Safari)**
- [ ] QR Code validado com scanner físico
- [ ] **Printer Discovery testado com múltiplas marcas**
- [ ] Design System documentado
- [ ] Lint rules aplicadas
- [ ] Performance verificada
- [ ] Backup de database
- [ ] Rollback plan pronto

---

## 🖨️ SOBRE PRINTER MANAGEMENT - EXPLICAÇÃO TÉCNICA

### O Que Foi Feito Até Agora:

#### 1. **SDK Universal (Bloco 17)**
```typescript
// Arquitetura atual:
ZebraPrinterManager
├── discoverPrinters() → DiscoveredPrinter[]
├── connectToPrinter(config) → Connection
├── printLabel(connection, data) → Promise<void>
└── getCapabilities(printer) → Capabilities

// Suporte atual:
✅ Zebra (ZPL)
✅ ESC/POS (Brother, Epson, genéricas)
✅ Bluetooth, WiFi, USB
✅ Auto-detection de modelo
```

#### 2. **Fallbacks Implementados:**
- **Network Discovery:** Usa mDNS/Bonjour para encontrar impressoras na rede
- **Bluetooth:** Usa Web Bluetooth API (Chrome/Edge)
- **USB:** Usa WebUSB API (requer permissão)
- **Protocol Detection:** Tenta ZPL primeiro, fallback para ESC/POS
- **Error Handling:** Retry automático, queue management

#### 3. **O Que Você NÃO Verá em Tela (Backend):**
- Detecção automática de protocolo
- Retry logic (3 tentativas)
- Queue persistence (labels salvos mesmo se impressora offline)
- Connection pooling
- Health checks automáticos

#### 4. **O Que Você VERÁ em Tela (Frontend):**
- **T17.1:** Campo "Modelo" removido → apenas read-only se detectado
- **T17.2:** UI melhorada no Discovery:
  - Lista múltiplos fabricantes
  - Mostra capacidades detectadas
  - Feedback visual melhor

### Por Que o Desafio:

```
❌ PROBLEMA: Sem impressora física em mãos
├── Impossível testar ZPL real
├── Impossível testar Bluetooth pairing
├── Impossível testar network discovery
└── Impossível validar qualidade de impressão

✅ SOLUÇÃO IMPLEMENTADA:
├── Simulação completa (mock printers)
├── Logs detalhados para debug remoto
├── Print preview em tela (antes de enviar)
├── Queue persistence (não perde labels)
└── Fallback para print dialog nativo (última opção)
```

### Recomendação:

**Para Teste no Cliente:**
1. Conectar impressora MP genérica via USB/WiFi
2. Abrir Print Discovery (Settings → Printers → Discover)
3. Impressora deve aparecer automaticamente
4. Clicar para adicionar → modelo preenchido automaticamente
5. Testar impressão de label

**Se Falhar:**
- App salva label em queue
- Cliente pode imprimir manualmente depois
- Você recebe logs de erro para debugar remotamente

---

**Última Atualização:** 12/02/2026 - 20:45  
**Próxima Revisão:** Após conclusão de cada sprint
