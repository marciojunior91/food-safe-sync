# 📋 User Feedback Analysis - February 2026

**Data:** 20 de Fevereiro de 2026  
**Cliente:** Tampa Test Restaurant  
**Status:** Em Análise

---

## 🟢 TASKS CONFIRMADAS (Podem ser implementadas)

### 📦 MÓDULO: EXPIRING SOON

#### ✅ **EXPIRING-1:** Renomear Módulo
- **De:** "Expiring Soon"
- **Para:** "Expiry Alerts"
- **Arquivos:** Sidebar, page title, breadcrumbs
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **EXPIRING-2:** Contadores Clicáveis como Filtros
- **Descrição:** Counters superiores (Expired, Expires Tomorrow, Upcoming) devem ser clicáveis e funcionar como filtros
- **Comportamento:** Ao clicar, lista exibe apenas items daquele status
- **Prioridade:** 🔴 ALTA
- **Imagem:** Screenshot mostrando counters (462 Expired, 0 Expires Tomorrow, 6 Upcoming)

---

#### ✅ **EXPIRING-3:** Ocultar Lista por Padrão
- **Descrição:** Tela inicial NÃO deve mostrar lista de produtos
- **Comportamento:** Lista só aparece após clicar em um dos counters
- **Estado Inicial:** Mostrar apenas counters + mensagem "Select a filter to view items"
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **EXPIRING-4:** Renomear Filtros
- **Mudanças:**
  - Remover: "All Types" dropdown
  - Renomear: "All Urgency" → "Urgency"
- **Prioridade:** 🟢 BAIXA

---

#### ✅ **EXPIRING-5:** Remover GUID da Label
- **Descrição:** GUID visível na lista de produtos (ex: `label-9a6193c0-3c10-49d5-a99a-061f8716275b`)
- **Ação:** Remover completamente da UI
- **Imagem:** Screenshot mostrando GUID destacado em verde
- **Prioridade:** 🔴 ALTA (UX ruim)

---

#### ✅ **EXPIRING-6:** BUG - Produto Descartado Não Some da Lista
- **Descrição:** Quando marca produto como "wasted", ele permanece visível
- **Comportamento Esperado:** Produto deve sumir da lista imediatamente
- **Prioridade:** 🔴 CRÍTICA (BUG)

---

#### ✅ **EXPIRING-7:** Reason Opcional no Extend
- **Descrição:** Campo "reason" no botão Extend é obrigatório
- **Mudança:** Tornar opcional
- **Prioridade:** 🟢 BAIXA

---

#### ✅ **EXPIRING-8:** BUG - Calendário Abre Automaticamente (Mobile)
- **Descrição:** Ao clicar em "Extend" no celular, calendário abre automaticamente
- **Comportamento Esperado:** Só abrir quando usuário clicar no campo de data
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **EXPIRING-9:** BUG - Extended Não Atualiza Urgência
- **Descrição:** Quando marca como "extended", produto não muda para categoria correta (ex: Expires Tomorrow)
- **Prioridade:** 🔴 CRÍTICA (BUG)

---

#### ✅ **EXPIRING-10:** BUG - Cálculo de Datas Incorreto
- **Descrição:** Cálculo de datas de expiração não está funcionando corretamente
- **Prioridade:** 🔴 CRÍTICA (BUG)
- **Necessita:** Foto anexa (mencionada mas não incluída nos anexos)

---

#### ✅ **EXPIRING-11:** Todas Reasons Opcionais
- **Descrição:** Todos os campos "reason" (extend ou waste) devem ser opcionais
- **Prioridade:** 🟢 BAIXA

---

#### ✅ **EXPIRING-12:** Responsividade Tablet - Filtros e Botões
- **Descrição:** Ajustar filtros e botões para ficarem na mesma linha no tablet
- **Imagem:** Screenshot mostrando layout atual (Bulk Actions, QR Scanner)
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **EXPIRING-13:** Corrigir Texto "Expires" → "Expired"
- **Descrição:** Items já expirados mostram "Expires X days ago" em vez de "Expired X days ago"
- **Prioridade:** 🟢 BAIXA (Texto)

---

#### ✅ **EXPIRING-14:** Botão Preview de Label
- **Descrição:** Adicionar botão para visualizar etiqueta na lista de produtos
- **Localização:** Em cada item da lista
- **Ação:** Abrir `/labels/:id/preview` (já implementado!)
- **Prioridade:** 🔴 ALTA
- **Nota:** ROTA JÁ EXISTE! Apenas adicionar botão

---

#### ✅ **EXPIRING-15:** Filtro Upcoming - Remover Limite de Dias
- **Descrição:** Filtro "Upcoming" atualmente mostra apenas 3-7 dias
- **Mudança:** Mostrar TODOS os upcoming items (sem limite de dias)
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **EXPIRING-18:** Remover Dropdown "All Locations" (NOVA)
- **Descrição:** Remover completamente dropdown "All Locations" da UI
- **Motivo:** Controle de locations será implementado futuramente (melhor planejado)
- **Arquivos:** ExpiringSoon.tsx
- **Prioridade:** 🟡 MÉDIA

---

### 🍳 MÓDULO: RECIPES

#### ✅ **RECIPES-1:** Redesign Cards - Estilo Quick Print
- **Descrição:** Fazer cards inspirados no Quick Print do módulo Labels
- **Layout:** Caixinhas com emojis, receitas dentro de categorias
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **RECIPES-2:** Simplificar Cards - Menos Informações
- **Descrição:** Mostrar apenas nome da receita no card
- **Adicionar:** Botão "View Recipe" para detalhes
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **RECIPES-3:** Remover Campos do Print Label
- **Descrição:** Ao clicar em receita, remover:
  - Batch Number field
  - Printer selection
- **Problema:** Duas caixas abrindo ao mesmo tempo
- **Imagem:** Screenshot mostrando campos destacados
- **Prioridade:** 🔴 ALTA

---

#### ~~RECIPES-4: Duplicate com Troca de Categoria~~ ❌ REMOVIDA
- **Motivo:** Todas recipes pertencem a "Prepared Foods > Recipes" (não há outras categorias)
- **Status:** Não aplicável

---

#### ✅ **RECIPES-5:** BUG - Filtro "Mains" Não Funciona
- **Descrição:** Ao aplicar filtro "All Categories > Mains", não encontra nenhuma receita
- **Prioridade:** 🔴 CRÍTICA (BUG)

---

#### ✅ **RECIPES-6:** Custom Dietary Requirements
- **Descrição:** Adicionar opção custom para dietary requirements (igual alergias)
- **Prioridade:** 🟢 BAIXA

---

#### ✅ **RECIPES-7:** Medidas Decimais - Suportar 0.75L
- **Descrição:** Campo de medidas não aceita decimais (ex: 0.75L)
- **Adicionar:** Opções de miligramas (mg) e mililitros (ml)
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **RECIPES-8:** Remover Service Gap Time
- **Descrição:** Campo "Service Gap Time" não é necessário no Create Recipe
- **Prioridade:** 🟢 BAIXA

---

#### ✅ **RECIPES-9:** Upload de Foto/Vídeo
- **Descrição:** Adicionar botão para upload de foto e vídeo nas receitas
- **Backend:** Criar bucket no Supabase
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **RECIPES-10:** BUG - Teclado Abre Automaticamente (Print Label)
- **Descrição:** Ao clicar em "Print Label" (tablet/celular), teclado abre automaticamente
- **Comportamento Esperado:** Só abrir quando clicar no campo
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **RECIPES-11:** BUG - Caixa Cortada (Desktop Print Label)
- **Descrição:** Após escolher Staff, caixa fica cortada no computador
- **Imagem:** Mencionada mas não anexada
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **RECIPES-12:** BUG - Data de Expiração Não Recalcula
- **Descrição:** Ao mudar Storage Condition (frozen/refrigerated), data de expire não recalcula
- **Prioridade:** 🔴 CRÍTICA (BUG)

---

#### ✅ **RECIPES-13:** Adicionar "Hot" em Storage Condition
- **Descrição:** Adicionar opção "Hot" nas condições de armazenamento
- **Prioridade:** 🟢 BAIXA

---

#### ✅ **RECIPES-14:** Renomear Storage Conditions
- **Mudanças:**
  - "Ambient" → "Room Temperature"
  - "Manufacture Date" → "Prep Date"
- **Prioridade:** 🟢 BAIXA

---

#### ✅ **RECIPES-15:** Simplificar Batch Size
- **Opções:**
  - 1x (Standard)
  - 2x (Double)
  - 3x (Triple)
  - Other (custom input)
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **RECIPES-16:** Responsividade iPad/iPhone/Mobile
- **Descrição:** Ajustar responsividade geral do módulo Recipes para todos os dispositivos
- **Prioridade:** 🔴 ALTA

---

#### ✅ **RECIPES-17:** Auditoria Geral de Datas de Expiração (NOVA)
- **Descrição:** Garantir que cálculos de data de expiração estejam SEMPRE corretos
- **Escopo:** 
  - Produtos (labels)
  - Recipes (print label)
  - Todas as storage conditions (frozen, refrigerated, room temperature, hot)
- **Ação:** 
  - Auditar toda lógica de cálculo
  - Criar testes unitários
  - Documentar regras de negócio
- **Prioridade:** 🔴 CRÍTICA

---

### 🚀 MÓDULO: ONBOARDING

#### ✅ **ONBOARDING-1:** Gerenciar Categorias na Tela
- **Descrição:** Adicionar durante onboarding:
  - Botão (X) para excluir categoria
  - Botão (+) para adicionar categoria nova
- **Escopo:** Categorias de PRODUTOS (labels)
- **Nota:** Recipes sempre em "Prepared Foods > Recipes"
- **Objetivo:** Facilitar cadastro de produtos próprios do restaurante
- **Prioridade:** 🟡 MÉDIA

---

### ✅ MÓDULO: ROUTINE TASKS

#### ✅ **TASKS-1:** BUG - Horário 00:00 Cortado
- **Descrição:** Horário 00:00 aparece cortado no tablet e computador
- **Imagem:** Screenshot da timeline
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **TASKS-2:** Ajustar Linha Vermelha do Horário Atual
- **Descrição:** Linha vermelha (horário atual) fica em cima do texto do horário
- **Prioridade:** 🟢 BAIXA

---

#### ✅ **TASKS-3:** BUG - Calendário Não Passa Meses (Mobile)
- **Descrição:** Calendário não passa meses corretamente pelo celular
- **Sugestão:** Adicionar seletor de data mais fácil (dropdown ou date picker nativo)
- **Vídeo:** Mencionado
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **TASKS-4:** Opção "Everyone" em Assign To
- **Descrição:** Adicionar opção "Everyone" além de pessoas específicas
- **Prioridade:** 🟢 BAIXA

---

#### ✅ **TASKS-5:** BUG - Estimate Duration - Zero à Esquerda
- **Descrição:** No campo de duração, zero fica sempre à esquerda (tablet/celular)
- **Prioridade:** 🟢 BAIXA

---

#### ✅ **TASKS-6:** BUG - Schedule Time Não Funciona (Desktop)
- **Descrição:** Botão de Schedule Time não funciona no computador
- **Prioridade:** 🔴 CRÍTICA (BUG)

---

#### ✅ **TASKS-7:** BUG - Enter Cria Task (Mobile)
- **Descrição:** Ao apertar Enter no celular, task é criada imediatamente (sem confirmação)
- **Vídeo:** Mencionado
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **TASKS-8:** Renomear Frequency
- **De:** "Biweekly"
- **Para:** "Fortnightly"
- **Prioridade:** 🟢 BAIXA

---

#### ✅ **TASKS-9:** Contadores Clicáveis (List View)
- **Descrição:** Fazer botões dos contadores clicáveis como filtros
- **Imagem:** Screenshot mostrando contadores
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **TASKS-10:** BUG - Zoom Padrão (Mobile)
- **Descrição:** Página abre com zoom, precisa desaproximar manualmente
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **TASKS-11:** Task Title - Remover Mínimo de Caracteres
- **De:** Mínimo 3 caracteres
- **Para:** Sem mínimo
- **Prioridade:** 🟢 BAIXA

---

#### ✅ **TASKS-12:** BUG - Subtasks Não Aparecem Todas
- **Descrição:** Subtasks são adicionadas, mas só aparece 1 ao visualizar task
- **Diagnóstico:** Componente renderiza apenas index [0]
- **Solução:** 
  - Refatorar para renderizar todas subtasks
  - Adicionar drag-and-drop para reordenar
  - Botão (X) delete apenas para admins
  - Toggle para mostrar/esconder lista
  - Badge com progresso "3/5 complete"
- **Especificação Completa:** Ver seção técnica abaixo
- **Prioridade:** 🔴 CRÍTICA (BUG)

---

#### ✅ **TASKS-13:** BUG - Upload de Foto Falha
- **Descrição:** Upload de foto mostra "upload fail"
- **Prioridade:** 🔴 CRÍTICA (BUG)

---

#### ✅ **TASKS-14:** BUG - Task Não Aparece em Lista
- **Descrição:** Task "change filter oil" (23/02/26) aparece em Timeline mas não em Lista
- **Prioridade:** 🔴 CRÍTICA (BUG)

---

#### ✅ **TASKS-15:** Adicionar Upload de Foto em Create Task
- **Descrição:** Create task não tem opção de upload, mas Edit Task tem
- **Ação:** Adicionar opção já no Create
- **Prioridade:** 🟡 MÉDIA

---

#### ✅ **TASKS-16:** BUG - Task Recorrente Marca Como Completa
- **Descrição:** Task que se repete a cada 4 dias, após completar, próxima aparece como completa automaticamente
- **Diagnóstico:** Sistema atual compartilha status entre ocorrências (não são instâncias separadas)
- **Solução:** 
  - Refatorar para modelo Série + Ocorrências (Microsoft Teams)
  - Criar tabelas `task_series` + `task_occurrences`
  - Implementar modal de contexto (editar/deletar ocorrência vs série)
  - Manter cadência independente de quando foi concluída
  - Suportar frequências customizáveis (Every X days, weekdays, day of month)
- **Especificação Completa:** Ver seção técnica abaixo
- **Prioridade:** 🔴 CRÍTICA (BUG)

---

#### ✅ **TASKS-17:** Simplificar Filtro de Status
- **De:** "Statuses"
- **Para:** Apenas "All"
- **Prioridade:** 🟢 BAIXA

---

---

## ✅ PERGUNTAS RESPONDIDAS (Confirmações)

### ✅ **EXPIRING-Q1:** All Locations - REMOVER
**Decisão:** Remover dropdown "All Locations" completamente por enquanto
**Motivo:** Controle precisa ser melhor discutido antes de implementar
**Ação:** Adicionar task EXPIRING-18 para remover dropdown

---

### ✅ **EXPIRING-Q2:** Responsividade Tablet - 2 LINHAS
**Decisão:** Filtros em uma linha, botões em outra
**Layout Aprovado:**
- Linha 1: Search, All Types, All Urgency (All Locations removido)
- Linha 2: Bulk Actions, Select All, QR Scanner
**Ação:** Task já confirmada como EXPIRING-12

---

### ✅ **RECIPES-Q1:** Fluxo de Click - REMOVER "Prepare Recipe"
**Decisão:** Remover botão "Prepare Recipe" completamente
**Manter:** Apenas botão "Print Label" (sem batch number e printer)
**Ação:** Task já confirmada como RECIPES-3

---

### ✅ **RECIPES-Q2:** Duplicate - NÃO APLICÁVEL
**Decisão:** Todas as recipes pertencem a "Prepared Foods > Recipes"
**Motivo:** Não há outras categorias para duplicar
**Ação:** Remover task RECIPES-4 (não aplicável)

---

### ✅ **RECIPES-Q3:** Datas de Expiração - SEMPRE CORRETAS
**Decisão:** Garantir cálculos corretos SEMPRE (produtos E recipes)
**Prioridade:** CRÍTICA
**Ação:** Manter RECIPES-12 como crítica e adicionar auditoria geral de datas

---

### ✅ **ONBOARDING-Q1:** Categorias de PRODUTOS
**Decisão:** Onboarding gerencia categorias de produtos (labels)
**Nota:** Recipes sempre em "Prepared Foods > Recipes"
**Ação:** Task já confirmada como ONBOARDING-1

---

### ✅ **TASKS-Q1:** Calendário - TOUCH FRIENDLY
**Decisão:** Usar seletor com melhor UX/UI, touch-friendly, fácil navegação entre meses
**Requisitos:**
- Não bugue (posição consistente)
- Touch-friendly para mobile/tablet
- Navegação suave entre meses
**Ação:** Pesquisar e implementar melhor componente (Headless UI Calendar, React Day Picker, etc)

---

## ✅ PERGUNTAS ESPECÍFICAS RESPONDIDAS

### ✅ **TASKS-Q2-DETAIL:** Subtasks Checklist - Especificação Completa

**RESPOSTAS:**

1. **Localização das Subtasks:** ✅ **c) Toggle (botão para mostrar/esconder)**
   - Card mostra indicador de progresso "3/5 subtasks complete"
   - Botão/ícone para expandir e ver lista completa

2. **Progresso da Task Principal:** ✅ **c) Mostrar progresso "3/5 subtasks complete"**
   - Task pode ser completada independentemente das subtasks
   - Progress indicator sempre visível no card

3. **Adicionar Subtasks:** ✅ **c) Ambos (Create + Edit)**
   - Campo para adicionar subtasks durante criação
   - Pode adicionar mais subtasks ao editar

4. **Reordenar/Deletar Subtasks:** ✅ **a) Drag-and-drop + Delete (Admin only)**
   - Drag-and-drop para reordenar
   - Botão (X) para deletar **APENAS para admins**
   - Usuários regulares podem apenas marcar/desmarcar checkboxes

5. **BUG Atual - Diagnóstico:** ✅ **Só renderiza a primeira subtask**
   - Subtasks estão salvas no banco
   - Componente tem bug que só renderiza index [0]

---

### ✅ **TASKS-Q3-DETAIL:** Task Recorrente - Especificação Completa (Baseado em Microsoft Teams)

**RESPOSTAS:**

1. **Criação de Instâncias:** ✅ **c) Sob demanda (quando chega a data)**
   - Sistema cria ocorrências conforme necessário
   - Não pré-gera todas as futuras (performance)

2. **Independência das Instâncias:** ✅ **b) + c) Série com Parent ID + Perguntar contexto**
   - Estrutura: `parent_series_id` compartilhado
   - Cada ocorrência = instância separada
   - Ao editar/deletar → Modal: "Aplicar a: Esta ocorrência | Toda a série"

3. **Completar Antes da Data:** ✅ **b) Mantém cadência original**
   - Task "a cada 4 dias", próxima dia 25
   - Se completar dia 23 → próxima continua sendo dia 29 (25 + 4)
   - Cadência independe de quando foi concluída

4. **Frequências Suportadas:** ✅ **a) + b) + c) TODAS parametrizáveis globalmente**
   - **Every X days** (customizável)
   - **Dias da semana** (segunda/quarta/sexta)
   - **Dia do mês** (todo dia 15)
   - **Interface simples:** Dropdowns + inputs numéricos
   - **Configuração global:** Salvável como templates

5. **Deletar Task Recorrente:** ✅ **c) Perguntar ao usuário (Modal)**
   - Modal: "Deletar esta ocorrência" | "Deletar toda a série"
   - Se série: deletar parent + todas ocorrências futuras

6. **Editar Task Recorrente:** ✅ **c) Perguntar ao usuário (Modal)**
   - Modal: "Editar esta ocorrência" | "Editar toda a série"
   - Se série: atualizar parent + propagar mudanças

7. **BUG Atual - Diagnóstico:** ✅ **Compartilhando status (não são instâncias separadas)**
   - Sistema atual não cria instâncias separadas
   - Precisa refatorar para modelo Série + Ocorrências

---

## 🎯 ESPECIFICAÇÃO TÉCNICA - RECURRING TASKS (Modelo Microsoft Teams)

### **1. Schema do Banco de Dados**

```sql
-- Tabela de Séries (Parent)
CREATE TABLE task_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID[] REFERENCES team_members(id),
  estimate_duration INTEGER,
  
  -- Recurrence Config
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN (
    'daily',
    'weekly',
    'fortnightly',
    'monthly',
    'custom_days',      -- Every X days
    'custom_weekdays',  -- Specific weekdays
    'custom_monthday'   -- Specific day of month
  )),
  recurrence_interval INTEGER, -- For custom_days (every X days)
  recurrence_weekdays INTEGER[], -- [1,3,5] = Monday, Wednesday, Friday
  recurrence_monthday INTEGER, -- Day of month (1-31)
  
  -- Serie Metadata
  series_start_date DATE NOT NULL,
  series_end_date DATE, -- NULL = indefinite
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES team_members(id)
);

-- Tabela de Ocorrências (Instances)
CREATE TABLE task_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID REFERENCES task_series(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Instance Specific
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  title TEXT NOT NULL, -- Can override series title
  description TEXT, -- Can override series description
  assigned_to UUID[] REFERENCES team_members(id),
  estimate_duration INTEGER,
  
  -- Completion
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMP,
  completed_by UUID REFERENCES team_members(id),
  
  -- Subtasks
  subtasks JSONB DEFAULT '[]'::jsonb,
  -- Format: [{"id": "uuid", "title": "text", "completed": false, "order": 0}]
  
  -- Metadata
  is_modified BOOLEAN DEFAULT FALSE, -- True if edited separately from series
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index para performance
CREATE INDEX idx_task_occurrences_series ON task_occurrences(series_id);
CREATE INDEX idx_task_occurrences_date ON task_occurrences(scheduled_date);
CREATE INDEX idx_task_occurrences_org ON task_occurrences(organization_id);
```

---

### **2. Lógica de Criação de Ocorrências**

**Quando criar:**
- Job diário (cron) ou trigger ao visualizar calendário
- Cria ocorrências para próximos 30 dias (rolling window)

**Algoritmo:**
```typescript
function generateOccurrences(series: TaskSeries, startDate: Date, endDate: Date) {
  const occurrences = [];
  let currentDate = startDate;
  
  while (currentDate <= endDate) {
    if (shouldCreateOccurrence(series, currentDate)) {
      occurrences.push({
        series_id: series.id,
        scheduled_date: currentDate,
        title: series.title,
        description: series.description,
        assigned_to: series.assigned_to,
        estimate_duration: series.estimate_duration,
        subtasks: [], // Empty on creation
        status: 'pending'
      });
    }
    
    currentDate = getNextDate(series, currentDate);
  }
  
  return occurrences;
}

function shouldCreateOccurrence(series: TaskSeries, date: Date): boolean {
  switch (series.recurrence_type) {
    case 'daily':
      return true;
    case 'weekly':
      return date.getDay() === series.series_start_date.getDay();
    case 'fortnightly':
      const daysDiff = daysBetween(series.series_start_date, date);
      return daysDiff % 14 === 0;
    case 'monthly':
      return date.getDate() === series.series_start_date.getDate();
    case 'custom_days':
      const days = daysBetween(series.series_start_date, date);
      return days % series.recurrence_interval === 0;
    case 'custom_weekdays':
      return series.recurrence_weekdays.includes(date.getDay());
    case 'custom_monthday':
      return date.getDate() === series.recurrence_monthday;
  }
}
```

---

### **3. Modal de Contexto (Editar/Deletar)**

**UI Component:**
```tsx
<Dialog>
  <DialogContent>
    <DialogTitle>
      {action === 'edit' ? 'Edit Recurring Task' : 'Delete Recurring Task'}
    </DialogTitle>
    
    <RadioGroup>
      <Radio value="occurrence">
        <label>This occurrence only</label>
        <p className="text-sm text-muted">
          Changes will only apply to this specific instance
        </p>
      </Radio>
      
      <Radio value="series">
        <label>Entire series</label>
        <p className="text-sm text-muted">
          {action === 'edit' 
            ? 'Changes will apply to all future occurrences'
            : 'This will delete all future occurrences'}
        </p>
      </Radio>
    </RadioGroup>
    
    <DialogFooter>
      <Button variant="outline" onClick={cancel}>Cancel</Button>
      <Button onClick={confirm}>
        {action === 'edit' ? 'Save Changes' : 'Delete'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### **4. Configuração de Frequências (Parametrizável)**

**UI Component:**
```tsx
<RecurrenceConfig>
  <Select value={recurrenceType}>
    <option value="daily">Daily</option>
    <option value="weekly">Weekly</option>
    <option value="fortnightly">Fortnightly</option>
    <option value="monthly">Monthly</option>
    <option value="custom_days">Every X days</option>
    <option value="custom_weekdays">Specific weekdays</option>
    <option value="custom_monthday">Specific day of month</option>
  </Select>
  
  {recurrenceType === 'custom_days' && (
    <Input 
      type="number" 
      min="1" 
      placeholder="Every X days"
      value={interval}
    />
  )}
  
  {recurrenceType === 'custom_weekdays' && (
    <WeekdaySelector>
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
        <Checkbox key={i} checked={weekdays.includes(i)}>
          {day}
        </Checkbox>
      ))}
    </WeekdaySelector>
  )}
  
  {recurrenceType === 'custom_monthday' && (
    <Select value={monthDay}>
      {Array.from({length: 31}, (_, i) => (
        <option key={i} value={i + 1}>{i + 1}</option>
      ))}
    </Select>
  )}
  
  <div>
    <Label>Series ends</Label>
    <RadioGroup>
      <Radio value="never">Never</Radio>
      <Radio value="on_date">
        On date
        <DatePicker value={endDate} />
      </Radio>
    </RadioGroup>
  </div>
</RecurrenceConfig>
```

---

### **5. Subtasks - Checklist Component**

**UI Component:**
```tsx
<TaskCard>
  {/* Collapsed State */}
  <div className="flex items-center justify-between">
    <h3>{task.title}</h3>
    <div className="flex items-center gap-2">
      <Badge variant="secondary">
        {completedSubtasks}/{totalSubtasks} subtasks
      </Badge>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setShowSubtasks(!showSubtasks)}
      >
        <ChevronDown className={showSubtasks ? 'rotate-180' : ''} />
      </Button>
    </div>
  </div>
  
  {/* Expanded State */}
  {showSubtasks && (
    <div className="mt-4 space-y-2">
      <DragDropContext onDragEnd={handleReorder}>
        <Droppable droppableId="subtasks">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {subtasks.map((subtask, index) => (
                <Draggable 
                  key={subtask.id} 
                  draggableId={subtask.id} 
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex items-center gap-2 p-2 bg-muted rounded"
                    >
                      <div {...provided.dragHandleProps}>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={(checked) => 
                          toggleSubtask(subtask.id, checked)
                        }
                      />
                      
                      <span className={subtask.completed ? 'line-through' : ''}>
                        {subtask.title}
                      </span>
                      
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto"
                          onClick={() => deleteSubtask(subtask.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={addSubtask}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Subtask
      </Button>
    </div>
  )}
</TaskCard>
```

---

### **6. Migração do Sistema Atual**

**Migration SQL:**
```sql
-- Criar novas tabelas
-- (schemas acima)

-- Migrar tasks existentes para task_series + task_occurrences
INSERT INTO task_series (
  id,
  organization_id,
  title,
  description,
  assigned_to,
  estimate_duration,
  recurrence_type,
  recurrence_interval,
  series_start_date,
  created_at,
  created_by
)
SELECT 
  id,
  organization_id,
  title,
  description,
  ARRAY[assigned_to]::UUID[],
  estimate_duration,
  frequency, -- Map to new recurrence_type
  CASE 
    WHEN frequency = 'daily' THEN 1
    WHEN frequency = 'weekly' THEN 7
    WHEN frequency = 'biweekly' THEN 14
    WHEN frequency = 'monthly' THEN 30
  END,
  scheduled_date,
  created_at,
  created_by
FROM routine_tasks
WHERE frequency IS NOT NULL;

-- Criar primeira ocorrência para cada série
INSERT INTO task_occurrences (
  series_id,
  organization_id,
  scheduled_date,
  scheduled_time,
  title,
  description,
  assigned_to,
  estimate_duration,
  status,
  completed_at,
  completed_by
)
SELECT 
  id,
  organization_id,
  scheduled_date,
  scheduled_time,
  title,
  description,
  ARRAY[assigned_to]::UUID[],
  estimate_duration,
  status,
  completed_at,
  completed_by
FROM routine_tasks
WHERE frequency IS NOT NULL;

-- Migrar tasks não-recorrentes como ocorrências únicas (series_id = NULL)
INSERT INTO task_occurrences (
  series_id,
  organization_id,
  scheduled_date,
  scheduled_time,
  title,
  description,
  assigned_to,
  estimate_duration,
  status,
  completed_at,
  completed_by
)
SELECT 
  NULL, -- One-time task
  organization_id,
  scheduled_date,
  scheduled_time,
  title,
  description,
  ARRAY[assigned_to]::UUID[],
  estimate_duration,
  status,
  completed_at,
  completed_by
FROM routine_tasks
WHERE frequency IS NULL;
```

---

### ❓ **TASKS-Q4:** Create Task - Erros de Aproximação (AGUARDANDO)
**Status:** Vídeo não anexado, aguardando descrição

---

### ❓ **TASKS-Q5:** Calendário Estranho (AGUARDANDO)
**Status:** Foto não anexada, aguardando screenshot

---

#### ✅ **TASKS-18:** Melhorar Date Picker - Touch Friendly (NOVA)
- **Descrição:** Substituir calendário atual por componente touch-friendly
- **Requisitos:**
  - Fácil navegação entre meses (dropdowns ou swipe suave)
  - Não bugue (posição consistente)
  - Touch-friendly para mobile/tablet
  - Melhor UX/UI geral
- **Opções Avaliar:**
  - React Day Picker
  - Headless UI Calendar
  - Radix UI Calendar
  - Input nativo (type="date") como fallback
- **Prioridade:** 🔴 ALTA

---

---

## 📊 RESUMO DE TASKS

### Por Prioridade
- 🔴 **CRÍTICA:** 13 tasks (bugs graves + auditoria datas)
- 🟡 **ALTA:** 6 tasks (UX importante)
- 🟢 **MÉDIA:** 16 tasks (melhorias)
- ⚪ **BAIXA:** 13 tasks (polish)

### Por Módulo
- **Expiring Soon:** 16 tasks (+1 nova: remover locations)
- **Recipes:** 16 tasks (-1 removida, +1 nova: auditoria datas)
- **Onboarding:** 1 task
- **Routine Tasks:** 18 tasks (+1 nova: date picker)

### Por Tipo
- **Bugs:** 15 tasks
- **Features:** 19 tasks
- **UX/Polish:** 14 tasks

**Total de Tasks Confirmadas:** 48 tasks (3 novas, 1 removida)

---

## 🚨 BUGS CRÍTICOS PRIORIZADOS

1. **EXPIRING-6:** Produto descartado não some
2. **EXPIRING-9:** Extended não atualiza urgência
3. **EXPIRING-10:** Cálculo de datas incorreto
4. **RECIPES-5:** Filtro Mains não funciona
5. **RECIPES-12:** Data não recalcula ao mudar condition
6. **RECIPES-17:** Auditoria geral de datas (produtos + recipes) ⭐ NOVA
7. **TASKS-6:** Schedule Time não funciona (desktop)
8. **TASKS-12:** Subtasks não aparecem
9. **TASKS-13:** Upload de foto falha
10. **TASKS-14:** Task não aparece em lista
11. **TASKS-16:** Task recorrente marca como completa
12. **TASKS-18:** Date picker touch-friendly ⭐ NOVA

---

## 📝 PRÓXIMOS PASSOS

1. **VOCÊ RESPONDE:** Perguntas de esclarecimento (Q1-Q9)
2. **EU CRIO:** Document definitivo de tasks
3. **PRIORIZAMOS:** Sprints por criticidade
4. **IMPLEMENTO:** Tasks confirmadas

---

**Total de Tasks Confirmadas:** 48 (45 originais + 3 novas - 1 removida)  
**Total de Perguntas Respondidas:** 6 gerais + 2 detalhadas = 8  
**Especificações Técnicas Criadas:** 2 (Subtasks + Recurring Tasks modelo Teams)  
**Imagens Analisadas:** 7  

**Status:** ✅ COMPLETO - Pronto para Implementação

---

## 🚀 PRÓXIMA AÇÃO

### **Opção 1: Começar pelos Bugs Críticos** (Recomendado)
Implementar os 13 bugs críticos por ordem de impacto:
1. EXPIRING-6: Produto descartado não some
2. EXPIRING-9: Extended não atualiza urgência
3. RECIPES-12: Data não recalcula ao mudar condition
4. TASKS-16: Task recorrente (GRANDE refactor)
5. TASKS-12: Subtasks não aparecem
... (continuar lista)

### **Opção 2: Criar Sprint 5 Detalhado**
Organizar tasks em sprints temáticos:
- **Sprint 5A:** Bugs de Expiração (EXPIRING-6, 9, 10 + RECIPES-12, 17)
- **Sprint 5B:** Bugs de Routine Tasks (TASKS-6, 12, 13, 14, 16)
- **Sprint 5C:** UX Improvements (EXPIRING-2, 14 + RECIPES-1, 3 + TASKS-18)
- **Sprint 5D:** Polish (renomeações, filtros, responsividade)

### **Opção 3: Refactor Estratégico**
Focar em 2 grandes refactors que resolvem múltiplos problemas:
1. **Recurring Tasks Refactor** (modelo Teams) → resolve TASKS-16 + melhora arquitetura
2. **Date Calculation Audit** → resolve EXPIRING-10, RECIPES-12, RECIPES-17

**O que você prefere que eu faça agora?** 🎯
