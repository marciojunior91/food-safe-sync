# 🖨️ COMO ACESSAR O SDK DE IMPRESSORAS ZEBRA

## 🎯 RESUMO RÁPIDO

**URL de Acesso:** https://tampaapp.vercel.app/settings (aba "Admin")

**Permissões:** Apenas usuários com role `admin` ou `owner`

---

## 📍 ONDE ACESSAR

### Opção 1: Via Menu Settings (RECOMENDADO)

1. **Login no Tampa APP**
2. **Clicar no avatar** (canto superior direito)
3. **Clicar em "Settings"**
4. **Aba "Admin"**
5. **Scroll até "Gerenciamento de Impressoras"**

**Rota:** `/settings` → Tab "Admin"

---

### Opção 2: Integração Direta no Código

```typescript
// Em qualquer componente React
import { ZebraPrinterManager } from '@/lib/zebraPrinterManager';

const manager = ZebraPrinterManager.getInstance();

// Exemplo: Imprimir etiqueta
const printers = await manager.getAllPrinters();
const defaultPrinter = printers.find(p => p.isDefault);

if (defaultPrinter) {
  const zpl = generateZPL(labelData); // Sua função de geração ZPL
  const result = await manager.print(defaultPrinter.id, zpl);
  
  if (result.success) {
    console.log(`✅ Impresso em ${result.latencyMs}ms`);
  } else {
    console.error(`❌ Erro: ${result.error}`);
  }
}
```

---

## 🎨 INTERFACE DO USUÁRIO

### O que você verá na página Settings → Admin:

1. **User Profile & Roles** (Card existente)
   - Seu nome, role, organização

2. **Staff Management** (Card existente)
   - Gerenciar membros da equipe

3. **🆕 Gerenciamento de Impressoras** (Novo!)
   - Header com título e botões:
     - 🔍 "Descobrir Impressoras" (scan automático)
     - ➕ "Adicionar Impressora" (manual)
   
   - **Tab 1: Impressoras (X)**
     - Lista de todas as impressoras cadastradas
     - Cards com:
       - Nome, modelo, S/N
       - Ícone de conexão (Bluetooth/Wi-Fi/USB)
       - Status visual (ready/busy/offline/error/paused)
       - Badge "Padrão" se for default
       - Local e Estação
       - Estatísticas rápidas (trabalhos, taxa de sucesso)
       - Botões: "Testar", "Configurar", "Definir Padrão", "Remover"
   
   - **Tab 2: Estatísticas**
     - Cards de overview:
       - Total de Trabalhos
       - Taxa de Sucesso
       - Trabalhos Falhados
       - Latência Média
     - Gráficos (Recharts):
       - Desempenho por impressora (bar chart)
       - Taxa de sucesso % (horizontal bar)
     - Cards individuais por impressora

---

## 🚀 FUNCIONALIDADES DISPONÍVEIS

### 1. Descobrir Impressoras (Auto-Discovery)

**Como usar:**
1. Clicar em "Descobrir Impressoras"
2. Dialog abre com instruções
3. Clicar "Iniciar Busca"
4. Progress bar mostra scan (30s max)
5. Lista de impressoras encontradas
6. Selecionar as desejadas
7. Clicar "Adicionar X Impressora(s)"

**Tecnologia:**
- Scan de rede local (192.168.x.x)
- Testa portas: 6101, 9100, 9200
- Broadcast UDP na porta 9200
- WebSocket connection test

**Limitação:** Apenas Wi-Fi (Bluetooth deve ser adicionado manualmente)

---

### 2. Adicionar Impressora Manualmente

**Como usar:**
1. Clicar em "Adicionar Impressora"
2. Dialog com 3 tabs:

#### Tab 1: Básico
- Nome* (ex: "Impressora Rotulagem Principal")
- Modelo (ZD411, ZD421, ZD611, ZD621)
- Número de Série (ex: DFJ253402166)
- Local (ex: "Área de Produção")
- Estação (ex: "Estação 1")
- Checkbox: Definir como padrão

#### Tab 2: Conexão
- Tipo: Bluetooth | Wi-Fi | USB

**Se Bluetooth:**
- Endereço MAC (ex: 00:11:22:33:44:55)
- Nome Bluetooth (ex: PRINTER123)

**Se Wi-Fi:**
- IP Address* (ex: 192.168.1.100)
- Porta: 6101 | 9100 | 9200

**Se USB:**
- Detecção automática (info apenas)

#### Tab 3: Impressão
- Largura do papel (mm): 50-120 (padrão: 102)
- Altura do papel (mm): 50-200 (padrão: 152)
- DPI: 203 (padrão) | 300 (alta qualidade)
- Escuridão: Slider 0-30 (recomendado: 20)
- Velocidade: Slider 2-12 pol/seg (padrão: 4)

3. Clicar "Adicionar Impressora"

---

### 3. Testar Conexão

**Como usar:**
1. No card da impressora, clicar "Testar"
2. Sistema tenta conectar via WebSocket
3. Testa múltiplas portas (6101 → 9100 → 9200)
4. Toast mostra resultado:
   - ✅ Sucesso: "Conectado via [método] na porta [porta] ([latência]ms)"
   - ❌ Falha: "Falha na conexão: [erro]"

**Tecnologia:**
- Timeout de 5 segundos por porta
- Fallback automático entre portas
- Medição de latência em ms

---

### 4. Configurar Impressora

**Como usar:**
1. Clicar no ícone de engrenagem ⚙️
2. Dialog abre com dados atuais preenchidos
3. Editar conforme necessário
4. Clicar "Salvar Alterações"

**Campos editáveis:** Todos (exceto organization_id)

---

### 5. Definir como Padrão

**Como usar:**
1. Clicar "Definir Padrão" no card da impressora
2. Sistema atualiza automaticamente
3. Badge "Padrão" aparece no card

**Regra:** Apenas uma impressora padrão por estação

---

### 6. Remover Impressora

**Como usar:**
1. Clicar "Remover"
2. Confirmar no dialog
3. Impressora deletada (CASCADE: logs de impressão mantidos)

---

### 7. Ver Estatísticas

**Como usar:**
1. Clicar na tab "Estatísticas"
2. Ver overview geral
3. Scroll para ver gráficos
4. Cards individuais por impressora

**Métricas:**
- Total de trabalhos
- Taxa de sucesso (%)
- Trabalhos falhados
- Latência média (ms)
- Último trabalho (data/hora)
- Uptime percentage

---

## 💻 COMO USAR O SDK NO CÓDIGO

### Singleton Instance

```typescript
import { ZebraPrinterManager } from '@/lib/zebraPrinterManager';

const manager = ZebraPrinterManager.getInstance();
```

---

### Listar Impressoras

```typescript
const printers = await manager.getAllPrinters();

console.log(`Total: ${printers.length} impressoras`);
printers.forEach(p => {
  console.log(`- ${p.name} (${p.status})`);
});
```

---

### Adicionar Impressora

```typescript
const printerId = await manager.addPrinter({
  name: 'Impressora 1',
  model: 'ZD411',
  connectionType: 'wifi',
  ipAddress: '192.168.1.100',
  port: 6101,
  paperWidth: 102,
  paperHeight: 152,
  dpi: 203,
  darkness: 20,
  speed: 4,
  isDefault: true
});

console.log(`Impressora adicionada: ${printerId}`);
```

---

### Atualizar Impressora

```typescript
await manager.updatePrinter(printerId, {
  name: 'Impressora 1 - Atualizada',
  darkness: 25,
  status: 'ready'
});
```

---

### Remover Impressora

```typescript
await manager.removePrinter(printerId);
```

---

### Testar Conexão

```typescript
const result = await manager.testConnection(printer);

if (result.success) {
  console.log(`✅ Conectado via ${result.method}`);
  console.log(`Porta: ${result.port}`);
  console.log(`Latência: ${result.latencyMs}ms`);
} else {
  console.error(`❌ Falha: ${result.error}`);
}
```

---

### Imprimir Etiqueta

```typescript
const zpl = `
^XA
^FO50,50^ADN,36,20^FDProduto Teste^FS
^FO50,100^ADN,24,12^FDValidade: 25/01/2026^FS
^XZ
`;

const result = await manager.print(printerId, zpl);

if (result.success) {
  console.log(`✅ Impresso com sucesso!`);
  console.log(`Job ID: ${result.jobId}`);
  console.log(`Latência: ${result.latencyMs}ms`);
  console.log(`Tentativas: ${result.retryCount}`);
} else {
  console.error(`❌ Falha: ${result.error}`);
}
```

---

### Descobrir Impressoras na Rede

```typescript
const discovered = await manager.discoverPrinters();

console.log(`Encontradas: ${discovered.length} impressoras`);

discovered.forEach(p => {
  console.log(`- ${p.name} (${p.model})`);
  console.log(`  IP: ${p.ipAddress}:${p.port}`);
  console.log(`  Método: ${p.method}`);
});
```

---

### Obter Estatísticas

```typescript
const stats = await manager.getStats(printerId);

console.log(`Total de trabalhos: ${stats.totalJobs}`);
console.log(`Bem-sucedidos: ${stats.successfulJobs}`);
console.log(`Falhados: ${stats.failedJobs}`);
console.log(`Taxa de sucesso: ${stats.uptimePercentage.toFixed(2)}%`);
console.log(`Latência média: ${stats.avgLatencyMs}ms`);
console.log(`Último trabalho: ${stats.lastJobAt}`);
```

---

## 🔐 PERMISSÕES

### Quem pode acessar?

**Interface (Settings → Admin):**
- ✅ Admin (role: `admin`)
- ✅ Owner (role: `owner`)
- ❌ Manager, Leader Chef, Chef (não veem a tab)

**SDK (programático):**
- ✅ Qualquer usuário autenticado pode LISTAR impressoras
- ✅ Qualquer usuário pode IMPRIMIR
- ✅ Apenas Admin/Owner podem ADICIONAR, EDITAR, REMOVER

**RLS (Row Level Security):**
- Usuários só veem impressoras de sua organização
- INSERT/UPDATE/DELETE requerem role admin/owner
- Print jobs podem ser criados por qualquer membro

---

## 📊 BANCO DE DADOS

### Tabelas criadas:

1. **zebra_printers**
   - Registro de impressoras
   - Configurações (IP, porta, darkness, speed, etc.)
   - Status (ready, busy, offline, error, paused)
   
2. **zebra_print_jobs**
   - Auditoria de todas as impressões
   - Quem imprimiu, quando, resultado
   - Latência, retry count, erros

3. **printer_statistics** (VIEW)
   - Estatísticas agregadas por impressora
   - Total de jobs, taxa de sucesso, latência média

---

## 🐛 TROUBLESHOOTING

### Problema: Não vejo a tab "Admin"
**Causa:** Você não tem role `admin` ou `owner`  
**Solução:** Peça para um administrador atribuir a role

### Problema: "Failed to load printers"
**Causa:** Erro de conexão com Supabase  
**Solução:** Verifique console do navegador, check RLS policies

### Problema: Descoberta não encontra impressoras
**Causa:** Firewall, rede diferente, ou apenas Bluetooth  
**Solução:** Adicione manualmente via "Adicionar Impressora"

### Problema: Teste de conexão falha
**Causa:** IP errado, porta errada, ou impressora offline  
**Solução:**
1. Verificar IP da impressora (imprimir relatório de rede)
2. Testar múltiplas portas (6101, 9100, 9200)
3. Confirmar que impressora está ligada e na rede

### Problema: Impressão falha
**Causa:** ZPL inválido, papel acabou, ribbon acabou  
**Solução:**
1. Testar ZPL simples primeiro
2. Verificar status físico da impressora
3. Ver logs de erro no zebra_print_jobs

---

## 📖 DOCUMENTAÇÃO COMPLETA

- **Implementação:** `docs/PRINTER_MANAGEMENT_IMPLEMENTATION_COMPLETE.md`
- **Schema SQL:** `docs/APPLY_ZEBRA_PRINTER_MANAGEMENT_SCHEMA.sql`
- **Diagnóstico de Deploy:** `docs/BUNDLE_HASH_DIAGNOSTIC.md`
- **Checklist de Verificação:** `docs/CHECKLIST_DEPLOY_VERIFICATION.md`

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Acesse `/settings` → Tab "Admin"
2. ✅ Adicione sua impressora Zebra ZD411
3. ✅ Teste a conexão
4. ✅ Defina como padrão
5. ✅ Imprima uma etiqueta de teste
6. ✅ Veja as estatísticas

**Está pronto para usar! 🎉**
