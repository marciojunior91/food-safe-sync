# 📱🖨️ Configuração Zebra Printer + iPhone em Produção (Vercel)

## 📋 Visão Geral

Para imprimir etiquetas ZPL em impressoras Zebra através de um iPhone no app publicado no Vercel, você precisa configurar **3 componentes principais**:

```
[iPhone Safari/Chrome] 
       ↓
[Tampa APP no Vercel] 
       ↓
[Zebra Printer Setup App] 
       ↓
[Impressora Zebra (Bluetooth/WiFi)]
```

---

## 🎯 Solução Recomendada: Zebra Printer Setup App

### O que é?
O **Zebra Printer Setup** é um aplicativo oficial da Zebra para iOS/Android que permite:
- Conectar iPhones/iPads a impressoras Zebra via Bluetooth ou WiFi
- Receber comandos ZPL de navegadores web
- Imprimir etiquetas diretamente de web apps

### 📲 Instalação

#### 1. Baixar o App
```
App Store → Buscar "Zebra Printer Setup"
ou
https://apps.apple.com/app/zebra-printer-setup/id1454308745
```

#### 2. Conectar à Impressora
No app Zebra Printer Setup:
1. **Scan for Printers** → Encontra impressoras via Bluetooth/WiFi
2. **Select Printer** → Escolha sua impressora Zebra
3. **Pair/Connect** → Confirme o pareamento
4. **Enable Web Services** → ATIVE esta opção (crucial!)

#### 3. Testar Conexão
- Imprima uma etiqueta de teste no próprio app
- Verifique se a impressora está "Ready"

---

## 🎯 Configuração Completa: Vercel + Zebra Setup + Bluetooth

Esta é a configuração **passo a passo completo** para fazer seu app publicado no Vercel enviar comandos ZPL via Bluetooth para impressoras Zebra através do iPhone.

### 📱 Arquitetura do Fluxo

```
[Tampa APP no Vercel/Safari]
         ↓ HTTPS
    (Gera código ZPL)
         ↓ WebSocket Local
    ws://127.0.0.1:9100
         ↓
[Zebra Printer Setup App]
    (Escuta WebSocket)
         ↓ Bluetooth
[Impressora Zebra]
    (Imprime etiqueta)
```

### 🔧 Passo a Passo Completo

#### **ETAPA 1: Configurar o Vercel (5 minutos)**

1. **Acesse o Vercel Dashboard:**
   ```
   https://vercel.com/dashboard
   → Selecione seu projeto Tampa APP
   ```

2. **Configure Variáveis de Ambiente:**
   ```
   Settings → Environment Variables → Add New
   ```

   Adicione:
   ```bash
   Name: VITE_PRINTER_TEST_MODE
   Value: false
   Environment: Production ✅
   
   # Salvar
   ```

3. **Verificar Build:**
   ```
   Deployments → Latest Deployment
   → Verifique se está "Ready"
   → Teste o app: https://seu-dominio.vercel.app
   ```

4. **Confirmar HTTPS:**
   ```
   ✅ URL deve começar com https://
   ✅ Cadeado verde no navegador
   ✅ Sem avisos de segurança
   ```

**Resultado:** App rodando em produção com HTTPS ✅

---

#### **ETAPA 2: Instalar Zebra Printer Setup no iPhone (10 minutos)**

1. **Abrir App Store no iPhone:**
   ```
   📱 App Store → 🔍 Buscar
   ```

2. **Pesquisar "Zebra Printer Setup":**
   ```
   Digite exatamente: Zebra Printer Setup
   
   App correto:
   ✅ Nome: Zebra Printer Setup Utility
   ✅ Desenvolvedor: Zebra Technologies Corp.
   ✅ Ícone: Logo Zebra (listras preto/vermelho)
   ✅ Grátis
   ```

3. **Instalar:**
   ```
   Toque "GET" ou "INSTALL"
   → Confirme com Face ID/Touch ID
   → Aguarde download (≈50MB)
   ```

4. **Abrir pela primeira vez:**
   ```
   Toque "OPEN"
   → Permita notificações (opcional)
   → Permita acesso Bluetooth quando solicitado ✅ IMPORTANTE
   ```

**Resultado:** App Zebra Printer Setup instalado ✅

---

#### **ETAPA 3: Parear Impressora Zebra via Bluetooth (15 minutos)**

1. **Preparar a Impressora:**
   ```
   🔌 Ligue a impressora Zebra
   📶 Certifique-se que Bluetooth está ativado na impressora
   🔋 Bateria com carga (se portátil)
   📐 Papel carregado e pronto
   ```

2. **Verificar Bluetooth da Impressora:**
   ```
   Na impressora Zebra:
   - Modelos com tela: Settings → Bluetooth → ON
   - Modelos sem tela: Geralmente Bluetooth está sempre ON
   - LED Bluetooth deve estar azul/piscando
   ```

3. **No iPhone, abrir Zebra Printer Setup:**
   ```
   📱 Toque no app Zebra Printer Setup
   ```

4. **Escanear Impressoras:**
   ```
   Tela inicial do app:
   
   Opção A: Toque "Discover Printers" (botão grande)
   Opção B: Toque "+" (botão no topo direito)
   Opção C: Toque "Available Printers"
   
   → App começa a escanear 🔍
   → Aguarde 5-10 segundos
   ```

5. **Selecionar sua impressora:**
   ```
   Lista de impressoras encontradas:
   
   Exemplo:
   📋 ZQ220-003456    [Bluetooth icon]
   📋 ZSB-DP12-7891   [Bluetooth icon]
   
   → Toque na sua impressora
   ```

6. **Confirmar Pareamento:**
   ```
   Pode aparecer:
   
   A) Código de pareamento na tela da impressora
      → Digite o código no iPhone
      → Toque "Pair" ou "Connect"
   
   B) Solicitação de pareamento direto
      → Toque "Pair" ou "Allow"
   
   C) Pareamento automático
      → Apenas aguarde "Connected" ✅
   ```

7. **Verificar Conexão:**
   ```
   Status da impressora deve mostrar:
   ✅ Connected
   ✅ Ready
   ✅ Ícone Bluetooth azul 📶
   ```

**Resultado:** Impressora pareada e conectada ✅

---

#### **ETAPA 4: Ativar Web Services no Zebra Printer Setup (5 minutos)**

🚨 **ESTA É A ETAPA MAIS IMPORTANTE!** 🚨

Sem isso, o Tampa APP no Vercel não consegue se comunicar com a impressora.

1. **Com a impressora conectada, toque em "Settings":**
   ```
   No app Zebra Printer Setup:
   
   Tela da impressora conectada
   → Toque no ícone ⚙️ (engrenagem) no canto superior direito
   
   OU
   
   → Toque nos 3 pontinhos (⋯) → Settings
   ```

2. **Procurar "Web Services":**
   ```
   Na tela de Settings, role para baixo
   
   Procure por:
   - "Web Services"
   - "Enable Web Services"
   - "Web Print"
   - "Browser Communication"
   
   Pode estar em:
   - Topo da lista (mais comum)
   - Seção "Advanced"
   - Seção "Developer Options"
   ```

3. **Ativar o Toggle:**
   ```
   Encontrou "Web Services"?
   
   Toggle atual: ⚫ OFF (cinza)
   
   → Toque no toggle
   
   Toggle atualizado: 🟢 ON (verde) ✅
   ```

4. **Confirmar Permissão:**
   ```
   Pode aparecer alerta:
   
   "Allow web browsers to communicate with this printer?"
   
   → Toque "Allow" ou "Yes" ✅
   ```

5. **Verificar Status:**
   ```
   Volte para tela principal da impressora
   
   Deve mostrar:
   ✅ Web Services: Enabled
   ✅ Ícone 🌐 ao lado do nome da impressora
   ✅ Status: ws://127.0.0.1:9100 (pode aparecer)
   ```

6. **Testar Impressão no App:**
   ```
   Ainda no Zebra Printer Setup:
   
   → Toque "Test Print" ou "Print Test Label"
   → Impressora deve imprimir etiqueta de teste
   → Se imprimir: ✅ Conexão Bluetooth OK!
   ```

**Resultado:** Web Services ativado e funcionando ✅

---

#### **ETAPA 5: Configurar iPhone para Manter App Ativo (5 minutos)**

Para que o WebSocket funcione, o app Zebra Printer Setup precisa estar "vivo" em background.

1. **Configurar Background App Refresh:**
   ```
   iPhone Settings (⚙️)
   → General
   → Background App Refresh
   → Background App Refresh: ON ✅
   
   Role para baixo:
   → Encontre "Zebra Printer Setup"
   → Toggle: ON ✅ (verde)
   ```

2. **Desativar Low Power Mode (ao usar impressora):**
   ```
   iPhone Settings (⚙️)
   → Battery
   → Low Power Mode: OFF
   
   (Low Power Mode mata apps em background)
   ```

3. **Manter App em Background (não fechar):**
   ```
   Após conectar impressora e ativar Web Services:
   
   ❌ NÃO faça: Swipe up para fechar app
   ✅ FAÇA: Pressione botão Home (volta para tela inicial)
   
   App fica na barra de apps recentes e WebSocket permanece ativo
   ```

**Resultado:** iPhone configurado para manter conexão ✅

---

#### **ETAPA 6: Testar no Tampa APP (Vercel) (10 minutos)**

Agora vamos testar o fluxo completo:

1. **Abrir Tampa APP no Safari:**
   ```
   No iPhone, abra Safari
   → Digite: https://seu-dominio.vercel.app
   → Faça login
   ```

2. **Navegar para Labeling:**
   ```
   Menu → Labeling → Create New Label
   ```

3. **Verificar Configuração de Impressora:**
   ```
   Na tela de criar etiqueta:
   
   Printer: 🦓 Zebra Thermal Printer
   
   Se não estiver selecionado:
   → Toque no dropdown
   → Selecione "Zebra Thermal Printer"
   ```

4. **Preencher Dados da Etiqueta:**
   ```
   Product Name: Grilled Chicken (exemplo)
   Category: Proteins
   Condition: Hot Held
   Prepared Date: Hoje
   Expiry Date: +3 dias
   Prepared By: Seu nome
   Allergens: (selecione se houver)
   ```

5. **Clicar em "Print Label":**
   ```
   → Toque no botão "Print Label" ou ícone 🖨️
   ```

6. **O que deve acontecer:**
   ```
   1. Tampa APP gera código ZPL ✅
   2. JavaScript tenta conectar: ws://127.0.0.1:9100 ✅
   3. Zebra Printer Setup recebe a requisição ✅
   4. App envia ZPL via Bluetooth para impressora ✅
   5. Impressora imprime etiqueta 🎉
   
   No Safari, você pode ver:
   - Toast de sucesso: "Label printed successfully"
   - Console log: "Connected to printer"
   ```

7. **Verificar Impressora:**
   ```
   A etiqueta BOPP deve sair com:
   ✅ Nome do produto em destaque
   ✅ QR Code com dados
   ✅ Datas de preparo/validade
   ✅ Alérgenos (se houver)
   ✅ Nome de quem preparou
   ✅ Logo/endereço da empresa
   ```

**Resultado:** Impressão funcionando via Bluetooth! 🎉

---

#### **ETAPA 7: Troubleshooting (se não funcionar)**

##### Erro: "Failed to connect to printer"

**Diagnóstico:**
```bash
1. Abra Safari → Developer → Console (se habilitado)
   ou
   Conecte iPhone ao Mac → Safari no Mac → Develop → iPhone → Página

Procure por erro:
❌ "WebSocket connection to 'ws://127.0.0.1:9100/' failed"
```

**Soluções:**

```
A) Zebra Printer Setup não está rodando:
   → Abra o app
   → Verifique se impressora está "Connected"
   → NÃO feche o app, deixe em background

B) Web Services desabilitado:
   → Abra Zebra Printer Setup
   → Settings → Web Services → ON ✅

C) App foi fechado pelo iOS:
   → Reabra Zebra Printer Setup
   → Espere "Connected"
   → Tente imprimir novamente no Tampa APP

D) Impressora desconectou:
   → No Zebra Printer Setup, toque "Reconnect"
   → Aguarde "Connected"
   → Teste impressão no próprio app primeiro
```

##### Erro: "Printer timeout"

**Causa:** Impressora está conectada mas não responde

**Soluções:**
```
1. Verificar impressora:
   - Está ligada? ✅
   - Tem papel? ✅
   - Bateria carregada? ✅
   - LED Bluetooth azul? ✅

2. Testar no Zebra Printer Setup:
   → "Test Print"
   → Se funcionar: problema é no Tampa APP
   → Se NÃO funcionar: problema é Bluetooth/impressora

3. Re-parear Bluetooth:
   iPhone Settings → Bluetooth
   → Toque no (i) ao lado da impressora Zebra
   → "Forget This Device"
   → Volte ao Zebra Printer Setup
   → "Discover Printers" novamente
```

##### Erro: Imprime mas layout está errado

**Causa:** Configurações de papel incorretas

**Soluções:**
```
No Tampa APP:
1. Menu → Settings → Printer Settings
2. Ajustar:
   Paper Width: 102mm (4 inches)
   Paper Height: 152mm (6 inches)
   Print Darkness: 15-25 (ajuste conforme papel)
   Print Speed: 4
3. Salvar
4. Tentar imprimir novamente
```

---

### ✅ Checklist Final - Tudo Configurado

```
VERCEL:
□ App publicado e acessível via HTTPS
□ VITE_PRINTER_TEST_MODE=false em Production
□ Build sem erros

iPHONE:
□ Zebra Printer Setup instalado e atualizado
□ Background App Refresh ativado para o app
□ Low Power Mode desativado (ao usar impressora)

IMPRESSORA:
□ Ligada e com bateria/papel
□ Bluetooth ativado
□ Pareada com iPhone
□ Status "Connected" no app

ZEBRA PRINTER SETUP:
□ Impressora conectada (status verde)
□ Web Services: ON ✅ (toggle verde)
□ Ícone 🌐 visível
□ Test Print funciona
□ App em background (não fechado)

TAMPA APP:
□ Aberto no Safari (https://)
□ Login feito
□ Printer: Zebra Thermal selecionado
□ Etiqueta imprime com layout correto

TESTE FINAL:
□ Criar etiqueta → Print → Impressora imprime ✅
```

---

### 🎯 Resumo do Fluxo (Para Relembrar)

```
1. Vercel (Tampa APP):
   → Usuário clica "Print"
   → Gera código ZPL
   → JavaScript: new WebSocket('ws://127.0.0.1:9100')

2. iPhone (Safari):
   → WebSocket conecta no localhost (mesma máquina)

3. Zebra Printer Setup (background):
   → Escuta na porta 9100
   → Recebe ZPL via WebSocket
   → Encaminha via Bluetooth

4. Impressora Zebra:
   → Recebe ZPL via Bluetooth
   → Interpreta comandos
   → Imprime etiqueta 🎉
```

### 💡 Dicas Pro:

1. **Primeira vez do dia:**
   - Sempre abra Zebra Printer Setup antes de usar Tampa APP
   - Aguarde status "Connected"
   - Faça um test print
   - Depois use o Tampa APP normalmente

2. **Entre impressões:**
   - NÃO precisa reabrir o app
   - Deixe em background
   - Tampa APP conecta automaticamente

3. **Fim do dia:**
   - Pode fechar tudo normalmente
   - No dia seguinte, repita "Primeira vez do dia"

4. **Múltiplos usuários:**
   - Cada iPhone precisa ter Zebra Printer Setup
   - Cada um pareia sua própria impressora
   - Ou compartilham a mesma impressora (um por vez)

---

## 🔧 Como Ativar Web Services (Passo a Passo Detalhado)

### Método 1: Durante a Configuração Inicial

Quando você conecta a impressora pela primeira vez:

```
1. Abra o app "Zebra Printer Setup" no iPhone
   📱 Ícone do app: logo Zebra preta/vermelha

2. Toque em "Discover Printers" ou "Available Printers"
   🔍 O app vai procurar impressoras Bluetooth/WiFi próximas

3. Selecione sua impressora na lista
   📝 Exemplo: "ZSB-DP12" ou "ZQ220"
   
4. Toque em "Connect" ou "Pair"
   🔗 Aguarde a conexão ser estabelecida (luz verde)

5. Após conectar, você verá a tela principal da impressora
   ✅ Status: "Connected" ou "Ready"

6. Toque no ícone de "Settings" (engrenagem) ⚙️
   📍 Geralmente no canto superior direito

7. Role para baixo até encontrar "Web Services"
   📋 Pode estar em "Advanced Settings" ou "Developer Options"

8. Ative o toggle "Enable Web Services" → ON (verde)
   🟢 Muito importante: deve ficar VERDE

9. Pode aparecer um alerta de segurança:
   ⚠️ "Allow web browsers to send print jobs?"
   → Toque em "Allow" ou "Yes"

10. Toque em "Done" ou "Save"
    💾 As configurações são salvas automaticamente
```

### Método 2: Para Impressora Já Conectada

Se a impressora já está conectada mas Web Services está OFF:

```
1. Abra "Zebra Printer Setup" no iPhone
   📱 App já deve estar instalado

2. Na tela inicial, você verá suas impressoras
   📋 "My Printers" ou "Paired Devices"

3. Toque na sua impressora conectada
   🖨️ Exemplo: "ZQ220 - Connected"

4. Toque no botão "Settings" (⚙️) ou nos 3 pontinhos (⋯)
   📍 Depende da versão do app

5. Procure por "Web Services" na lista
   🔍 Pode estar em:
   - "Connection Settings"
   - "Advanced"
   - "Developer Options"
   - Direto na tela principal

6. Ative o toggle "Web Services" → ON
   🟢 De CINZA/OFF para VERDE/ON

7. Se solicitado, confirme:
   "Allow external apps to communicate with this printer?"
   → Toque "Allow" ou "Enable"

8. Volte para a tela principal
   ← Botão "Back" ou seta no canto superior esquerdo
```

### Método 3: Via Menu Principal do App

```
1. Abra "Zebra Printer Setup"
   📱 Ícone preto/vermelho Zebra

2. Na tela inicial, toque no menu ☰ (três linhas)
   📍 Canto superior esquerdo

3. Toque em "Settings" ou "Preferences"
   ⚙️ Configurações gerais do app

4. Procure "Enable Web Services" (pode estar no topo)
   🔍 Ou "Allow Web Access"

5. Ative o toggle → ON (verde)
   🟢 Este é o setting GLOBAL do app

6. Volte e selecione sua impressora
   📋 "My Printers" → Sua impressora

7. Verifique se o status mostra "Web Services: Enabled"
   ✅ Ícone de globo 🌐 ou texto "WS: ON"
```

---

## 🖼️ Identificação Visual

### Como Saber se Web Services Está Ativado:

✅ **Sinais de que está ATIVO:**
- Toggle verde com texto "ON" ou "Enabled"
- Ícone de globo 🌐 ao lado do nome da impressora
- Status mostra "Web Services: Active"
- Pode aparecer um IP local (ex: ws://127.0.0.1:9100)

❌ **Sinais de que está DESATIVADO:**
- Toggle cinza com texto "OFF" ou "Disabled"
- Sem ícone de globo
- Status mostra "Web Services: Inactive"
- Mensagem: "Web printing not available"

### Localizações Possíveis do Setting:

Dependendo da versão do app, procure em:

```
📱 Zebra Printer Setup
  └─ My Printers
      └─ [Sua Impressora]
          ├─ ⚙️ Settings
          │   ├─ 🌐 Web Services ← AQUI (mais comum)
          │   ├─ Connection
          │   │   └─ 🌐 Enable Web Access ← ou AQUI
          │   └─ Advanced
          │       └─ 🌐 Web Print Service ← ou AQUI
          │
          └─ Info
              └─ Status: Web Services Enabled ✅
```

---

## 🔍 Troubleshooting: Web Services

### Problema: Não Encontro a Opção "Web Services"

**Possíveis causas:**

1. **Versão antiga do app**
   ```
   Solução:
   - App Store → Pesquisar "Zebra Printer Setup"
   - Toque em "Update" se disponível
   - Versão mínima: 1.2.0 ou superior
   ```

2. **App diferente instalado**
   ```
   Certifique-se que é o app correto:
   - Nome: "Zebra Printer Setup" (exato)
   - Desenvolvedor: "Zebra Technologies Corporation"
   - Ícone: Logo Zebra (zebra listrada)
   
   Apps ERRADOS (não use):
   - "Zebra Utilities" ❌
   - "Link-OS" ❌ (embora funcione, é mais complexo)
   - "Zebra Designer" ❌
   ```

3. **Impressora não suporta Web Services**
   ```
   Modelos compatíveis:
   ✅ ZQ series (ZQ220, ZQ520)
   ✅ ZD series (ZD420, ZD620)
   ✅ QLn series (QLn220, QLn320)
   ✅ ZT series (ZT410, ZT610)
   
   Se seu modelo não está na lista:
   - Verifique no site da Zebra
   - Pode precisar de atualização de firmware
   ```

### Problema: Web Services Fica Desativando Sozinho

**Causa:** iOS está matando o app em background

**Solução:**
```
1. Settings do iPhone → Zebra Printer Setup
2. Ative "Background App Refresh" → ON
3. Em "Battery", configure:
   - "Low Power Mode" → Desative ao usar o app
   
4. Mantenha o app semi-aberto:
   - Após conectar impressora e ativar Web Services
   - Pressione Home (não feche totalmente)
   - Deixe na barra de apps recentes
   - iOS mantém o WebSocket ativo
```

### Problema: Web Services Ativo mas Tampa APP Não Conecta

**Causa 1:** Porta incorreta

```typescript
// Verificar no código: src/utils/zebraPrinter.ts
const socket = new WebSocket('ws://127.0.0.1:9100/');

// Tentar portas alternativas:
const socket = new WebSocket('ws://localhost:6101/'); // Link-OS
const socket = new WebSocket('ws://127.0.0.1:19100/'); // Algumas versões
```

**Causa 2:** Safari bloqueando WebSocket

```
Solução:
1. Settings → Safari → Advanced
2. Desative "Block All Cookies" (temporariamente)
3. Em "Privacy & Security":
   - "Prevent Cross-Site Tracking" → OFF (ao testar)
   
Após teste bem-sucedido, pode reativar
```

---

## 📹 Verificação Final

### Checklist - Web Services Configurado Corretamente:

```
□ 1. App "Zebra Printer Setup" instalado (versão atualizada)
□ 2. Impressora Zebra conectada via Bluetooth/WiFi
□ 3. Status mostra "Connected" ou "Ready" (luz verde)
□ 4. Web Services toggle está ON (verde) ✅
□ 5. Ícone 🌐 aparece ao lado da impressora
□ 6. App em background (não fechado totalmente)
□ 7. Background App Refresh ativado no iOS
□ 8. Teste de impressão no próprio app funciona

Se todos os itens acima estão OK:
✅ Web Services está ATIVO e pronto!
🖨️ Tampa APP conseguirá se conectar via WebSocket
```

### Teste Rápido:

```
1. Abra Safari no iPhone
2. Cole esta URL na barra de endereço:
   ws://127.0.0.1:9100/

3. Se conectar (não der erro imediato):
   ✅ Web Services está funcionando!

4. Se erro "Connection Refused":
   ❌ Web Services não está ativo ou app fechado
```

---

## 💡 Dicas Pro:

1. **Mantenha o App em Background:**
   - Após ativar Web Services, não feche o app
   - Pressione Home e deixe na barra de apps
   - iOS mantém o serviço ativo por várias horas

2. **Reconexão Automática:**
   - Se desconectar, abra o app novamente
   - Web Services reativa automaticamente
   - Não precisa reconfiguar se a impressora está pareada

3. **Múltiplas Impressoras:**
   - Pode ter várias impressoras configuradas
   - Web Services funciona para todas simultaneamente
   - Tampa APP pode escolher qual usar

4. **Modo Avião:**
   - Bluetooth funciona mesmo em Modo Avião
   - Ideal para ambientes com restrição de WiFi
   - Ative Bluetooth separadamente em Modo Avião

---

---

## ⚙️ Configuração do Tampa APP (Vercel)

### 1. Variáveis de Ambiente no Vercel

Acesse: **Vercel Dashboard → Seu Projeto → Settings → Environment Variables**

Adicione:

```bash
# Modo de impressão (production = envio real para impressora)
VITE_PRINTER_TEST_MODE=false

# Suas variáveis Supabase (já devem estar configuradas)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

### 2. Ajustes no Código (se necessário)

O código atual já está preparado! Veja o fluxo:

**Arquivo: `src/utils/zebraPrinter.ts`**
```typescript
// Linha 237-276: Envia ZPL para impressora
const sendToPrinter = async (zpl: string, quantity: number = 1): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Conecta ao serviço Zebra Browser Print local
      const socket = new WebSocket('ws://127.0.0.1:9100/');
      
      socket.onopen = () => {
        console.log('Connected to printer');
        const zplWithQuantity = zpl.replace('^XZ', `^PQ${quantity}^XZ`);
        socket.send(zplWithQuantity);
        console.log('Label sent to printer');
      };
      
      // ... tratamento de erros
    } catch (error) {
      reject(new Error('Failed to connect to printer. Make sure Zebra Browser Print is running.'));
    }
  });
};
```

**Observação Importante:**
- O código tenta conectar via **WebSocket local** (`ws://127.0.0.1:9100`)
- Isso funciona porque o **Zebra Printer Setup** expõe um servidor WebSocket local no iPhone
- Quando habilitado no app, ele "escuta" requisições do Safari/Chrome

---

## 🔧 Configuração Técnica Detalhada

### Como Funciona o Fluxo?

```
1. Usuário clica "Imprimir" no Tampa APP (Safari no iPhone)
   ↓
2. Tampa APP gera código ZPL com dados da etiqueta
   ↓
3. JavaScript tenta conectar via WebSocket:
   ws://127.0.0.1:9100/ (localhost no iPhone)
   ↓
4. Zebra Printer Setup (rodando em background) recebe a conexão
   ↓
5. App envia ZPL via Bluetooth/WiFi para impressora Zebra
   ↓
6. Impressora imprime a etiqueta 🎉
```

### Requisitos de Segurança

#### A. HTTPS Obrigatório
- Vercel já fornece HTTPS automaticamente ✅
- Navegadores modernos bloqueiam WebSocket (WS) de sites HTTP
- Certifique-se que seu domínio está em **https://**

#### B. Permissões do iOS
No Safari/Chrome no iPhone:
1. **Settings → Safari → Advanced → Web Inspector** (opcional, para debug)
2. Permita acesso ao localhost quando solicitado
3. O Zebra Printer Setup deve estar **aberto** ou em background

#### C. CORS (Cross-Origin Resource Sharing)
- WebSocket para localhost **NÃO** é bloqueado por CORS
- Mas se usar um servidor intermediário, configure CORS:

```typescript
// Exemplo de servidor intermediário (se necessário)
// NÃO é necessário com Zebra Printer Setup
const response = await fetch('https://seu-servidor.com/api/print/zebra', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ zpl, printerIP: '192.168.1.100' })
});
```

---

## 🚀 Processo de Deploy no Vercel

### 1. Build de Produção
```bash
npm run build
```

Verifica se:
- ✅ Sem erros de compilação TypeScript
- ✅ `VITE_PRINTER_TEST_MODE` não está hardcoded
- ✅ `zebraPrinter.ts` está incluído no build

### 2. Deploy
```bash
# Deploy automático via Git Push
git push origin main

# Ou deploy manual
vercel --prod
```

### 3. Verificar Variáveis
No Vercel Dashboard:
```
Project → Settings → Environment Variables
```

Certifique-se que `VITE_PRINTER_TEST_MODE=false` está em **Production**

---

## 🧪 Teste em Produção

### Checklist Pré-Teste

- [ ] Zebra Printer Setup instalado no iPhone
- [ ] Impressora Zebra pareada e conectada
- [ ] Web Services habilitado no app
- [ ] App Tampa rodando em produção (Vercel)
- [ ] iPhone conectado à mesma rede WiFi (se impressora WiFi)
- [ ] Zebra Printer Setup rodando em background

### Passo a Passo

1. **Abrir Tampa APP no Safari/Chrome do iPhone**
   ```
   https://seu-dominio.vercel.app
   ```

2. **Fazer Login e Navegar até Labeling**
   ```
   Menu → Labeling → Create New Label
   ```

3. **Preencher Dados da Etiqueta**
   - Nome do Produto: "Grilled Chicken"
   - Categoria: "Proteins"
   - Datas de preparo/validade
   - Alergênicos, etc.

4. **Selecionar Impressora Zebra**
   ```
   Printer: 🦓 Zebra Thermal Printer
   ```

5. **Clicar em "Print Label"**

6. **Observar Console do Navegador** (Safari → Developer → Console)
   ```
   Esperado:
   ✅ Connected to printer
   ✅ Label sent to printer
   ✅ Printer acknowledged
   
   Erro comum:
   ❌ Failed to connect to printer. Make sure Zebra Browser Print is running.
   ```

7. **Verificar Impressora**
   - Etiqueta deve imprimir automaticamente
   - Layout BOPP com QR Code, alérgenos, etc.

---

## 🔍 Troubleshooting

### Problema 1: "Failed to connect to printer"

**Causa**: Zebra Printer Setup não está rodando ou Web Services desabilitado

**Solução**:
1. Abra o app Zebra Printer Setup
2. Vá em **Settings → Enable Web Services** → ON
3. Mantenha o app aberto ou em background
4. Tente imprimir novamente

---

### Problema 2: "WebSocket connection failed"

**Causa**: Bloqueio de segurança do iOS ou porta incorreta

**Solução**:
```typescript
// Verificar se está usando a porta correta
const socket = new WebSocket('ws://127.0.0.1:9100/');

// Alternativa: Tentar porta 9100 ou 6101
const socket = new WebSocket('ws://localhost:6101/');
```

**Ajustar em `src/utils/zebraPrinter.ts` se necessário**

---

### Problema 3: "Printer timeout"

**Causa**: Impressora desconectada ou fora de alcance

**Solução**:
1. No Zebra Printer Setup, clique em **Reconnect**
2. Verifique Bluetooth/WiFi
3. Teste impressão direta no app
4. Se OK, tente novamente no Tampa APP

---

### Problema 4: "ZPL imprime mas está cortado/errado"

**Causa**: Configurações de papel incorretas

**Solução**:
1. No Tampa APP, vá em **Printer Settings**
2. Ajuste:
   ```
   Paper Width: 102mm (4 inches)
   Paper Height: 152mm (6 inches)
   Print Darkness: 20 (ajuste conforme necessário)
   Print Speed: 4
   ```
3. Salve e imprima novamente

---

### Problema 5: "Não funciona em produção mas funciona local"

**Causa**: Variável de ambiente errada

**Solução Vercel**:
```bash
# 1. Verificar no Vercel Dashboard
Project → Settings → Environment Variables

# 2. Confirmar valores
VITE_PRINTER_TEST_MODE=false  # DEVE ser false em production

# 3. Re-deploy após alteração
# (Vercel re-deploya automaticamente)
```

---

## 📶 Alternativa: Envio Direto via Bluetooth (Web Bluetooth API)

### ⚠️ Limitação Crítica do iOS

**Má notícia:** Safari no iPhone **NÃO suporta** Web Bluetooth API 😞

**Boa notícia:** Existem alternativas viáveis! 👇

### O que é Web Bluetooth API?

É uma API JavaScript que permite navegadores web se conectarem diretamente a dispositivos Bluetooth, incluindo impressoras Zebra, sem necessidade de apps intermediários.

**Suporte dos Navegadores:**

| Navegador | Desktop | iOS | Android |
|-----------|---------|-----|---------|
| Chrome | ✅ Sim | ❌ Não | ✅ Sim |
| Safari | ❌ Não | ❌ Não | - |
| Firefox | ⚠️ Parcial | ❌ Não | ⚠️ Parcial |
| Edge | ✅ Sim | ❌ Não | ✅ Sim |

**Conclusão:** Para iPhone, Web Bluetooth API não é uma opção viável no Safari.

---

### 📱 Alternativas para iPhone

#### Opção 1: Chrome/Edge no iPhone (Limitado)

Mesmo que o usuário instale Chrome no iPhone, ele **ainda usa o motor do Safari** (WebKit) por restrição da Apple. Logo, Web Bluetooth também não funciona.

❌ **Não funciona no iPhone**

---

#### Opção 2: PWA com Capacitor + Bluetooth Plugin ✅ RECOMENDADO

Transformar o Tampa APP em um **Progressive Web App (PWA)** com **Capacitor** e usar plugin Bluetooth nativo.

**Vantagens:**
- ✅ Funciona nativamente no iPhone
- ✅ Acesso direto ao Bluetooth
- ✅ Mesmo código base (React/TypeScript)
- ✅ Pode ser distribuído via App Store

**Como Implementar:**

##### 1. Instalar Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
```

##### 2. Adicionar Plataforma iOS

```bash
npm install @capacitor/ios
npx cap add ios
```

##### 3. Instalar Plugin Bluetooth

```bash
# Plugin oficial Capacitor Bluetooth
npm install @capacitor-community/bluetooth-le

# Ou plugin Zebra específico
npm install capacitor-zebra-printer
```

##### 4. Código de Exemplo

```typescript
// src/utils/zebraPrinterBluetooth.ts
import { BluetoothLE } from '@capacitor-community/bluetooth-le';

interface ZebraPrinterBLE {
  deviceId: string;
  name: string;
  address: string;
}

// UUID do serviço Zebra (SPP - Serial Port Profile)
const ZEBRA_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb';

export class ZebraBluetoothPrinter {
  private device: ZebraPrinterBLE | null = null;

  /**
   * Escanear impressoras Zebra próximas
   */
  async scanForPrinters(): Promise<ZebraPrinterBLE[]> {
    try {
      // Inicializar Bluetooth
      await BluetoothLE.initialize();

      // Verificar se Bluetooth está habilitado
      const enabled = await BluetoothLE.isEnabled();
      if (!enabled.value) {
        await BluetoothLE.enable();
      }

      // Escanear dispositivos
      const devices: ZebraPrinterBLE[] = [];
      
      await BluetoothLE.requestLEScan(
        {
          services: [ZEBRA_SERVICE_UUID],
        },
        (result) => {
          if (result.device.name?.includes('ZQ') || 
              result.device.name?.includes('Zebra')) {
            devices.push({
              deviceId: result.device.deviceId,
              name: result.device.name || 'Unknown Zebra',
              address: result.device.address || result.device.deviceId,
            });
          }
        }
      );

      // Parar scan após 5 segundos
      setTimeout(async () => {
        await BluetoothLE.stopLEScan();
      }, 5000);

      return devices;
    } catch (error) {
      console.error('Erro ao escanear impressoras:', error);
      throw error;
    }
  }

  /**
   * Conectar a uma impressora específica
   */
  async connect(deviceId: string): Promise<boolean> {
    try {
      // Conectar ao dispositivo
      await BluetoothLE.connect({ deviceId });

      // Descobrir serviços
      const services = await BluetoothLE.getServices({ deviceId });
      console.log('Serviços descobertos:', services);

      this.device = {
        deviceId,
        name: 'Connected Zebra',
        address: deviceId,
      };

      return true;
    } catch (error) {
      console.error('Erro ao conectar impressora:', error);
      return false;
    }
  }

  /**
   * Enviar ZPL via Bluetooth
   */
  async print(zpl: string): Promise<boolean> {
    if (!this.device) {
      throw new Error('Nenhuma impressora conectada');
    }

    try {
      // Converter ZPL para bytes
      const encoder = new TextEncoder();
      const zplBytes = encoder.encode(zpl);

      // Enviar dados via Bluetooth
      await BluetoothLE.write({
        deviceId: this.device.deviceId,
        service: ZEBRA_SERVICE_UUID,
        characteristic: '00001101-0000-1000-8000-00805f9b34fb',
        value: this.arrayBufferToBase64(zplBytes.buffer),
      });

      console.log('ZPL enviado via Bluetooth com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao enviar ZPL:', error);
      return false;
    }
  }

  /**
   * Desconectar impressora
   */
  async disconnect(): Promise<void> {
    if (this.device) {
      await BluetoothLE.disconnect({ deviceId: this.device.deviceId });
      this.device = null;
    }
  }

  /**
   * Helper: Converter ArrayBuffer para Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

// Uso no componente:
// const printer = new ZebraBluetoothPrinter();
// const printers = await printer.scanForPrinters();
// await printer.connect(printers[0].deviceId);
// await printer.print(zpl);
```

##### 5. Integrar com ZebraPrinter Existente

```typescript
// src/lib/printers/ZebraPrinter.ts
import { ZebraBluetoothPrinter } from '@/utils/zebraPrinterBluetooth';
import { Capacitor } from '@capacitor/core';

export class ZebraPrinter implements PrinterDriver {
  private bluetoothPrinter?: ZebraBluetoothPrinter;

  constructor(name: string = 'Zebra Thermal', settings?: Partial<PrinterSettings>) {
    // ... código existente
    
    // Inicializar Bluetooth se for app nativo
    if (Capacitor.isNativePlatform()) {
      this.bluetoothPrinter = new ZebraBluetoothPrinter();
    }
  }

  async print(labelData: any): Promise<boolean> {
    try {
      const printData = await this.convertToLabelPrintData(labelData);
      
      // Detectar plataforma
      if (Capacitor.isNativePlatform() && this.bluetoothPrinter) {
        // Modo nativo: usar Bluetooth direto
        const { zpl } = await this.generateZPLWithLabelId(printData);
        return await this.bluetoothPrinter.print(zpl);
      } else {
        // Modo web: usar WebSocket (Zebra Printer Setup)
        const result = await printWithZebra(printData);
        return result.success;
      }
    } catch (error) {
      console.error('Erro na impressão:', error);
      return false;
    }
  }

  /**
   * Escanear impressoras Bluetooth disponíveis
   */
  async scanPrinters(): Promise<Array<{ id: string; name: string }>> {
    if (this.bluetoothPrinter) {
      const printers = await this.bluetoothPrinter.scanForPrinters();
      return printers.map(p => ({ id: p.deviceId, name: p.name }));
    }
    return [];
  }

  /**
   * Conectar a uma impressora Bluetooth específica
   */
  async connectBluetooth(deviceId: string): Promise<boolean> {
    if (this.bluetoothPrinter) {
      return await this.bluetoothPrinter.connect(deviceId);
    }
    return false;
  }
}
```

##### 6. UI para Seleção de Impressora Bluetooth

```tsx
// src/components/labels/BluetoothPrinterSelector.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';

interface BluetoothPrinter {
  id: string;
  name: string;
}

export function BluetoothPrinterSelector({ onSelect }: { onSelect: (id: string) => void }) {
  const [printers, setPrinters] = useState<BluetoothPrinter[]>([]);
  const [scanning, setScanning] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      const zebraPrinter = new ZebraPrinter();
      const found = await zebraPrinter.scanPrinters();
      setPrinters(found);
    } catch (error) {
      console.error('Erro ao escanear:', error);
    } finally {
      setScanning(false);
    }
  };

  if (!isNative) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50">
        <p className="text-sm text-yellow-800">
          📱 Bluetooth direto disponível apenas no app nativo.
          Use o Zebra Printer Setup no navegador web.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleScan} disabled={scanning}>
        {scanning ? '🔍 Procurando...' : '📶 Escanear Impressoras Bluetooth'}
      </Button>

      {printers.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Impressoras Encontradas:</h3>
          {printers.map((printer) => (
            <Button
              key={printer.id}
              variant="outline"
              onClick={() => onSelect(printer.id)}
              className="w-full justify-start"
            >
              🖨️ {printer.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Deploy do App Nativo:**

```bash
# Build do web app
npm run build

# Sincronizar com Capacitor
npx cap sync

# Abrir no Xcode (iOS)
npx cap open ios

# No Xcode:
# 1. Configure Bundle ID
# 2. Configure Signing & Capabilities
# 3. Adicione permissão Bluetooth no Info.plist:
#    - NSBluetoothAlwaysUsageDescription
#    - NSBluetoothPeripheralUsageDescription
# 4. Build & Run no iPhone físico
```

**Info.plist (Permissões Bluetooth):**

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Tampa APP precisa de acesso Bluetooth para conectar impressoras Zebra</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>Permite imprimir etiquetas via Bluetooth</string>
```

---

#### Opção 3: App Nativo React Native ✅

Se preferir um app 100% nativo, use React Native com biblioteca Zebra.

**Biblioteca Recomendada:**

```bash
npm install react-native-zebra-bluetooth-printer
```

**Exemplo:**

```javascript
import ZebraPrinter from 'react-native-zebra-bluetooth-printer';

// Escanear
const printers = await ZebraPrinter.discover();

// Conectar
await ZebraPrinter.connect(printers[0].address);

// Imprimir
const zpl = `^XA^FO50,50^A0N,60,60^FDGrilled Chicken^FS^XZ`;
await ZebraPrinter.print(zpl);
```

---

#### Opção 4: Plugin Cordova ✅

Para projetos Cordova/Ionic:

```bash
cordova plugin add cordova-plugin-zebra-printer
```

**Uso:**

```javascript
window.zebraPrinter.discover((printers) => {
  window.zebraPrinter.connect(printers[0].address, () => {
    window.zebraPrinter.print(zpl, success, error);
  });
});
```

---

### 📊 Comparação de Métodos

| Método | Complexidade | iPhone | Bluetooth Direto | Manutenção |
|--------|--------------|--------|------------------|------------|
| **Zebra Printer Setup + WebSocket** | 🟢 Baixa | ✅ Sim | ✅ Sim | 🟢 Fácil |
| **Capacitor + BLE Plugin** | 🟡 Média | ✅ Sim | ✅ Sim | 🟡 Média |
| **React Native** | 🔴 Alta | ✅ Sim | ✅ Sim | 🔴 Complexa |
| **Web Bluetooth API** | 🟢 Baixa | ❌ Não | ✅ Sim | 🟢 Fácil |
| **Backend Intermediário** | 🟡 Média | ✅ Sim | ❌ Não | 🟡 Média |

### 🎯 Recomendação por Cenário

#### Cenário 1: Web App Simples (Atual)
👍 **Use: Zebra Printer Setup + WebSocket**
- Sem necessidade de compilar app nativo
- Funciona hoje mesmo
- Usuário instala app Zebra da App Store

#### Cenário 2: Quer App Nativo Completo
👍 **Use: Capacitor + Bluetooth LE Plugin**
- Mantém código React/TypeScript existente
- Compila para iOS/Android
- Bluetooth direto sem apps externos
- Distribui na App Store

#### Cenário 3: Já Tem Infraestrutura React Native
👍 **Use: React Native + Zebra Plugin**
- Se já usa RN, faz sentido
- Performance nativa
- Bibliotecas maduras

#### Cenário 4: Web App + Android
👍 **Use: Web Bluetooth API**
- Funciona no Chrome Android
- Sem necessidade de app
- Não funciona no iPhone (limitação)

---

### 🚀 Implementação Rápida: Capacitor (Recomendado para iPhone)

Se você quer Bluetooth direto no iPhone, siga este roteiro:

```bash
# 1. Instalar Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "Tampa APP" com.tampaapp.foodsafe

# 2. Instalar plugin Bluetooth
npm install @capacitor-community/bluetooth-le

# 3. Build do projeto
npm run build

# 4. Adicionar plataforma iOS
npx cap add ios
npx cap sync

# 5. Configurar permissões
# Editar: ios/App/App/Info.plist
# Adicionar chaves de permissão Bluetooth

# 6. Abrir no Xcode
npx cap open ios

# 7. Build & Test no iPhone físico
```

**Tempo estimado:** 2-4 horas para setup + testes

**Vantagem:** App funciona offline, Bluetooth direto, sem dependências externas

---

## 🌐 Alternativa: Impressão via Backend (Avançado)

Se o método WebSocket direto não funcionar, você pode implementar um **servidor intermediário**:

### Arquitetura
```
[iPhone Tampa APP] 
       ↓ HTTPS POST
[Vercel Edge Function / Supabase Function] 
       ↓ TCP/IP ou HTTP
[Impressora Zebra na Rede]
```

### Implementação

**1. Criar Supabase Edge Function**

```typescript
// supabase/functions/print-zebra/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { zpl, printerIP, port = 9100 } = await req.json();
    
    // Conectar à impressora Zebra via TCP
    const conn = await Deno.connect({
      hostname: printerIP,
      port: port,
    });
    
    // Enviar ZPL
    const encoder = new TextEncoder();
    await conn.write(encoder.encode(zpl));
    
    conn.close();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

**2. Ajustar `zebraPrinter.ts`**

```typescript
const sendToPrinter = async (zpl: string, quantity: number = 1): Promise<void> => {
  // Tentar WebSocket local primeiro
  try {
    const socket = new WebSocket('ws://127.0.0.1:9100/');
    // ... código existente
  } catch (localError) {
    console.warn('Local WebSocket failed, trying backend:', localError);
    
    // Fallback: Enviar via backend
    const response = await fetch('https://seu-projeto.supabase.co/functions/v1/print-zebra', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        zpl,
        printerIP: '192.168.1.100', // IP da impressora na rede
        port: 9100
      })
    });
    
    if (!response.ok) {
      throw new Error('Backend print failed');
    }
  }
};
```

**Desvantagens desta abordagem:**
- ❌ Requer impressora com IP fixo na rede
- ❌ Não funciona com Bluetooth
- ❌ Mais complexo de configurar
- ❌ Pode ter latência maior

**Vantagens:**
- ✅ Funciona sem Zebra Printer Setup
- ✅ Mais controle sobre o processo
- ✅ Logs centralizados
- ✅ Pode fazer fila de impressão

---

## 📱 Recomendações Finais

### Método Recomendado
👍 **Use Zebra Printer Setup + WebSocket local**

**Por quê?**
- ✅ Simples e direto
- ✅ Funciona offline (só precisa Bluetooth)
- ✅ Sem necessidade de backend adicional
- ✅ Menor latência
- ✅ Suporte oficial da Zebra

### Fluxo de Produção Ideal

1. **Onboarding do Cliente**
   ```
   1. "Instale Zebra Printer Setup na App Store"
   2. "Conecte sua impressora Zebra"
   3. "Ative Web Services no app"
   4. "Volte ao Tampa APP e imprima!"
   ```

2. **Documentação para Usuários**
   - Crie um guia em PDF/vídeo
   - Mostre passo a passo com screenshots
   - Inclua troubleshooting comum

3. **Suporte**
   - Verifique se Web Services está ON
   - Teste impressão no próprio Zebra Printer Setup
   - Se funcionar lá, deve funcionar no Tampa APP

---

## 🎉 Resumo das Configurações

### Vercel (Production)
```bash
VITE_PRINTER_TEST_MODE=false
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

### iPhone do Cliente
- 📲 Zebra Printer Setup instalado
- 🔌 Impressora Zebra conectada (Bluetooth/WiFi)
- ⚙️ Web Services habilitado
- 🌐 Tampa APP aberto no Safari/Chrome

### Tampa APP (Código)
- ✅ `src/utils/zebraPrinter.ts` → WebSocket para localhost:9100
- ✅ `src/lib/printers/ZebraPrinter.ts` → Classe de impressão
- ✅ `src/hooks/usePrinter.ts` → Hook de gerenciamento

### Impressora Zebra
- 📐 Papel BOPP 102x152mm (4x6 inches)
- 🔋 Bateria carregada (se portátil)
- 📶 Dentro do alcance Bluetooth/WiFi

---

## 📞 Suporte Adicional

**Zebra Technologies**
- Suporte: https://www.zebra.com/support
- Documentação: https://www.zebra.com/us/en/support-downloads.html
- App Zebra Printer Setup: https://www.zebra.com/setup

**Tampa APP (Seu Suporte)**
- Email: suporte@tampaapp.com (exemplo)
- WhatsApp: +55 (XX) XXXXX-XXXX
- Docs: https://docs.tampaapp.com/printing

---

## ✅ Checklist Final

Antes de ir para produção, confirme:

- [ ] Zebra Printer Setup testado com impressão direta
- [ ] WebSocket localhost:9100 funcionando em teste local
- [ ] `VITE_PRINTER_TEST_MODE=false` no Vercel Production
- [ ] Build sem erros TypeScript
- [ ] Teste em iPhone real (não simulador)
- [ ] Etiquetas imprimem com layout correto (BOPP)
- [ ] QR Code funcional com labelId
- [ ] Documentação para usuários pronta
- [ ] Suporte preparado para troubleshooting

---

## 🚀 Próximos Passos

Depois de configurar tudo:

1. **Teste em Staging**
   - Use ambiente de teste no Vercel
   - Convide usuários beta para testar

2. **Deploy em Produção**
   - Após testes OK, faça deploy final
   - Monitore logs de erro

3. **Treinamento de Usuários**
   - Sessão de onboarding
   - Vídeos tutoriais
   - FAQ atualizado

4. **Monitoramento**
   - Verifique taxa de sucesso de impressões
   - Colete feedback dos usuários
   - Ajuste configurações conforme necessário

---

**Última atualização:** Janeiro 18, 2026  
**Status:** ✅ Pronto para Produção
