# 📋 CHECKLIST - TESTE DA NOVA VERSÃO (v2.0.0)

**Data:** 19 de Janeiro de 2026, 01:45h BRT  
**Versão:** 2.0.0 Multi-Port Support  
**Commits aplicados:** 5 commits (fa2d40aa até 619a1878)

---

## ⏰ AGUARDAR DEPLOY DO VERCEL

**⚠️ IMPORTANTE:** Aguarde **3-5 minutos** após esse horário antes de testar.

O Vercel precisa:
1. ✅ Detectar o push do git
2. ✅ Fazer checkout do código novo
3. ✅ Instalar dependências
4. ✅ Rodar `npm run build` (Vite)
5. ✅ Fazer deploy para CDN
6. ✅ Invalidar cache antigo

---

## 📱 PASSO A PASSO DO TESTE

### 1️⃣ PREPARAR O APP ZEBRA
- [ ] Abra o app **Zebra Printer Setup** no iPhone
- [ ] Verifique se a impressora **ZD411** está conectada (🟢 verde)
- [ ] **NÃO minimize o app** - deixe em primeiro plano

### 2️⃣ LIMPAR CACHE DO SAFARI
- [ ] **Feche TODAS as abas** do Safari
- [ ] Vá em **Configurações > Safari**
- [ ] Toque em **"Limpar Histórico e Dados dos Websites"**
- [ ] Confirme
- [ ] **Feche o Safari completamente** (arraste para cima no multitarefa)

### 3️⃣ ABRIR O APP
- [ ] Abra o Safari novamente
- [ ] Acesse: **https://tampaapp.vercel.app/labeling**
- [ ] Aguarde carregar completamente

### 4️⃣ ABRIR O CONSOLE
Para ver os logs detalhados, você precisa abrir o console do Safari:

**Opção A - Inspecionar no Mac (RECOMENDADO):**
1. Conecte iPhone ao Mac via USB
2. No Mac, abra Safari
3. Menu: **Desenvolver > iPhone [nome] > tampaapp.vercel.app**
4. Na janela do inspetor, clique em **Console**

**Opção B - Usar Eruda (no próprio iPhone):**
1. Se o Eruda estiver configurado, clique no ícone flutuante
2. Vá na aba **Console**

### 5️⃣ TESTAR IMPRESSÃO
- [ ] Selecione um produto qualquer
- [ ] Clique em **"Print Label"**
- [ ] **OBSERVE O CONSOLE IMEDIATAMENTE**

---

## ✅ O QUE VOCÊ DEVE VER (CÓDIGO NOVO)

Se o código novo estiver rodando, você verá **ESTA SEQUÊNCIA**:

```
🚀 ============================================
🚀 CODE VERSION: 2.0.0 - MULTI-PORT SUPPORT
🚀 Build Date: 2026-01-19 01:30 BRT
🚀 ============================================

🏷️ ============================================
🏷️ ZEBRA LABEL PRINTING - START
🏷️ ============================================
📦 Product: [nome do produto]
🏢 Organization: [uuid]
👤 Prepared by: [seu nome]
📅 Prep date: [data]
📅 Expiry date: [data]
🧪 Test mode: false
🏷️ ============================================

💾 [STEP 1/3] Saving label to database...
✅ [STEP 1/3] Label saved! ID: [uuid]

📝 [STEP 2/3] Generating ZPL code...
✅ [STEP 2/3] ZPL generated (1234 characters)

🖨️ [STEP 3/3] Sending to printer...

🖨️ ============================================
🖨️ ZEBRA PRINTER - DETAILED CONNECTION LOG
🖨️ ============================================
📱 Device: iPhone via Zebra Printer Setup App
🔌 Connection: Bluetooth
📄 ZPL Length: 1234 characters
🔢 Quantity: 1
🌐 Attempting connection to localhost...
🖨️ ============================================

🔍 [ATTEMPT 1/3] Trying Zebra Browser Print on port 6101...
🔗 Connecting to: ws://127.0.0.1:6101/
⏱️ Timeout: 10 seconds
```

### 🎯 PONTO CHAVE:
**Se você vir `🚀 CODE VERSION: 2.0.0`** → ✅ **NOVO CÓDIGO CARREGADO!**

---

## ❌ O QUE NÃO DEVE APARECER (CÓDIGO ANTIGO)

Se ainda estiver rodando código antigo, você verá:

```
WebSocket connection to 'ws://127.0.0.1:9100/' failed
Printer WebSocket Error: Event {isTrusted: true}
Error printing label: Error: Failed to connect to printer
```

**SEM nenhum emoji** (🚀, 🖨️, 🏷️)  
**SEM o banner de versão**

### 🔴 SE ISSO ACONTECER:
1. Aguarde mais 5 minutos
2. Repita o processo de limpar cache (passo 2)
3. Tente novamente

---

## 📊 RESULTADOS POSSÍVEIS

### ✅ CENÁRIO 1: PORTA 6101 FUNCIONA
```
🔍 [ATTEMPT 1/3] Trying Zebra Browser Print on port 6101...
✅ [PORT 6101] WebSocket OPENED successfully
📤 Sending ZPL...
✅ [PORT 6101] ZPL sent successfully
✅ SUCCESS! Connected via Zebra Browser Print (port 6101)
```
**→ PERFEITO! Impressora deve imprimir!**

### 🟡 CENÁRIO 2: PORTA 6101 FALHA, TENTA OUTRAS
```
🔍 [ATTEMPT 1/3] Trying Zebra Browser Print on port 6101...
❌ [PORT 6101] Zebra Browser Print failed: Connection timeout
⏭️ Trying next port...

🔍 [ATTEMPT 2/3] Trying Web Services on port 9100...
❌ [PORT 9100] Web Services failed: Connection closed
⏭️ Trying next port...

🔍 [ATTEMPT 3/3] Trying Zebra Setup Utilities on port 9200...
```
**→ Tenta 3 portas, vai mostrar qual funciona ou se todas falharam**

### ❌ CENÁRIO 3: TODAS AS PORTAS FALHAM
```
❌ ============================================
❌ ALL CONNECTION ATTEMPTS FAILED
❌ ============================================
❌ Tried ports: 6101 (Zebra Browser Print), 9100 (Web Services), 9200 (Zebra Setup Utilities)

🔧 TROUBLESHOOTING STEPS:
1. ✅ Zebra Printer Setup app is OPEN (not closed)
2. ✅ Printer is CONNECTED via Bluetooth (🟢 green status)
3. ✅ Web Services is ENABLED (if option appears)
4. ✅ App is in FOREGROUND or background refresh enabled
5. 🔄 Try closing and reopening Zebra Printer Setup
6. 🔄 Try disconnecting and reconnecting printer
```
**→ Se isso acontecer, siga as instruções de troubleshooting**

---

## 📸 O QUE ENVIAR DE VOLTA

Por favor, tire **screenshots** de:

1. ✅ **Console completo** com os logs (especialmente o banner `🚀 CODE VERSION`)
2. ✅ **Network tab** mostrando o nome do arquivo .js carregado (deve ser diferente de `index-BzOsQJkA.js`)
3. ✅ **Zebra Printer Setup** mostrando status da conexão

---

## 🆘 PROBLEMAS COMUNS

### Problema: Ainda mostra código antigo após 10 minutos
**Solução:**
```
1. No Mac, acesse: https://vercel.com/marciojunior91/food-safe-sync
2. Verifique se o último deploy (fa2d40aa) foi concluído
3. Se estiver "Building", aguarde
4. Se estiver "Ready", o problema é cache do CDN
```

### Problema: Zebra Printer Setup fecha sozinho
**Solução:**
```
1. Configurações > Zebra Printer Setup
2. Ative "Atualização em Segundo Plano"
3. Certifique-se que "Rede Local" está permitida
```

### Problema: Todos os 3 portos falharam
**Solução:**
```
1. Desconecte e reconecte Bluetooth na impressora
2. Feche e reabra Zebra Printer Setup
3. Se possível, vá em Settings da impressora e habilite "Web Services"
```

---

## ✨ SUCESSO!

Se você ver a impressora **IMPRIMIR A ETIQUETA** e os logs mostrarem:

```
✅ ============================================
✅ LABEL PRINTED SUCCESSFULLY!
✅ ============================================
🏷️ Label ID: [uuid]
🖨️ Quantity: 1
✅ ============================================
```

**🎉 PARABÉNS! O sistema está funcionando perfeitamente!**

---

**Última atualização:** 19/01/2026 01:45h BRT  
**Commits aplicados:** fa2d40aa, 89d2c2b2, ffdb26c0, 59cf43ca, 619a1878  
**Código multi-port:** ✅ Commitado e pushed  
**Vercel status:** 🟡 Aguardando build
