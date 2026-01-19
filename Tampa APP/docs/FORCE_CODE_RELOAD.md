# 🔄 FORCE CODE RELOAD - Troubleshooting Guide

**Date:** January 19, 2026  
**Issue:** Old logs appearing instead of new detailed logs  
**Status:** Code updated but browser showing old version

---

## ❌ PROBLEMA IDENTIFICADO

### Logs Antigos (que você está vendo):
```
Label saved to database: Object {...}
× Printer WebSocket Error: Event {isTrusted: true}
Error printing label: Error {}
ZPL generation error: Error {}
```

### Logs Novos (que DEVERIAM aparecer):
```
🏷️  ============================================
🏷️  ZEBRA LABEL PRINTING - START
🏷️  ============================================
📦 Product: Mozzarella Cheese
🏢 Organization: [uuid]
👤 Prepared by: [name]
📅 Prep date: [date]
📅 Expiry date: [date]
🧪 Test mode: false
🏷️  ============================================

💾 [STEP 1/3] Saving label to database...
✅ [STEP 1/3] Label saved! ID: [uuid]

📝 [STEP 2/3] Generating ZPL code...
✅ [STEP 2/3] ZPL generated (1234 characters)

🖨️  [STEP 3/3] Sending to printer...

🖨️  ============================================
🖨️  ZEBRA PRINTER - DETAILED CONNECTION LOG
🖨️  ============================================
📱 Device: iPhone via Zebra Printer Setup App
🔌 Connection: Bluetooth
📄 ZPL Length: 1234 characters
🔢 Quantity: 1
🌐 Attempting connection to localhost...
🖨️  ============================================

🔍 [ATTEMPT 1/3] Trying Zebra Browser Print on port 6101...
🔗 Connecting to: ws://127.0.0.1:6101/
⏱️  Timeout: 10 seconds
```

---

## 🔧 SOLUÇÃO: Force Reload do Código

### STEP 1: Hard Refresh no Navegador ⚡

#### iPhone Safari:
1. **Abra Safari** no iPhone
2. **Settings** (ícone ⚙️) → **Advanced** → **Website Data**
3. **Remove All Website Data** (ou específico do tampaapp.vercel.app)
4. **OU** Feche completamente o Safari:
   - Swipe up (gestos)
   - Feche o Safari
   - Reabra e acesse novamente

#### Desktop (para testar):
- **Windows:** `Ctrl + Shift + R` ou `Ctrl + F5`
- **Mac:** `Cmd + Shift + R`
- **Chrome/Edge:** `Ctrl/Cmd + Shift + Delete` → Clear cache

---

### STEP 2: Verificar Vite Dev Server 🔄

O terminal mostra que `npm run dev` está rodando. Vamos garantir que Vite recarregou:

1. **No terminal PowerShell**, pressione `Ctrl + C` para parar
2. **Execute novamente:**
   ```powershell
   npm run dev
   ```
3. **Aguarde mensagem:**
   ```
   VITE v5.x.x  ready in XXX ms
   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.x.x:5173/
   ```

---

### STEP 3: Limpar Build Cache (se necessário) 🧹

Se o problema persistir:

```powershell
# Parar Vite (Ctrl+C)

# Limpar node_modules/.vite
Remove-Item -Recurse -Force node_modules/.vite

# Limpar dist (se existir)
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# Reinstalar dependências (opcional, se muito persistente)
# npm install

# Reiniciar dev server
npm run dev
```

---

### STEP 4: Verificar Arquivo Atualizado 📄

Vamos confirmar que o arquivo está correto:

**Abra:** `src/utils/zebraPrinter.ts`

**Procure por (linha ~260):**
```typescript
const sendToPrinter = async (zpl: string, quantity: number = 1): Promise<void> => {
  // Ports to try in order of likelihood for Zebra Printer Setup on iOS
  const ports = [
    { port: 6101, name: 'Zebra Browser Print' },
    { port: 9100, name: 'Web Services' },
    { port: 9200, name: 'Zebra Setup Utilities' }
  ];

  console.log('🖨️ ============================================');
  console.log('🖨️ ZEBRA PRINTER - DETAILED CONNECTION LOG');
```

**Se NÃO vir os emojis 🖨️ e múltiplas linhas, o arquivo não foi salvo corretamente!**

---

### STEP 5: Verificar Logs no Console 🔍

Depois de recarregar, abra o console e você DEVE ver:

#### ✅ Logs Corretos (versão nova):
- Múltiplas linhas com `============================================`
- Emojis: 🖨️ 📱 🔌 📄 🔢 🌐
- Detalhes de cada tentativa: `[ATTEMPT 1/3]`, `[ATTEMPT 2/3]`, etc.
- ReadyState logging: `ReadyState: 0 (CONNECTING)`, `ReadyState: 3 (CLOSED)`
- Mensagens detalhadas: "Trying Zebra Browser Print on port 6101..."

#### ❌ Logs Antigos (versão velha):
- Linhas simples sem formatação
- Sem emojis
- Mensagens genéricas: "Printer WebSocket Error:", "Error printing label:"
- Sem detalhes de portas

---

## 🚨 TROUBLESHOOTING AVANÇADO

### Se ainda mostrar logs antigos:

#### Check 1: Service Worker
```javascript
// No console do navegador:
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
    console.log('Service Worker unregistered');
  }
});

// Depois recarregue a página
location.reload();
```

#### Check 2: Verificar Source Maps
1. **Abra DevTools** (F12 ou Inspect)
2. **Sources tab**
3. **Procure:** `webpack://` ou `src/utils/zebraPrinter.ts`
4. **Verifique:** Se o código tem os novos logs com emojis

#### Check 3: Network Tab
1. **Abra DevTools** → **Network tab**
2. **Recarregue a página** (F5)
3. **Procure:** `zebraPrinter.ts` ou `main.js` ou similar
4. **Verifique:** Status 200 (não 304 cached)
5. **Se 304:** Force hard reload (Ctrl+Shift+R)

---

## 🎯 TESTE RÁPIDO

Execute este código no console do browser:

```javascript
// Teste se a nova função existe
import('/src/utils/zebraPrinter.ts').then(module => {
  console.log('zebraPrinter module:', module);
  console.log('printLabel function:', module.printLabel.toString().substring(0, 500));
});

// OU simplesmente:
console.log('Testing connection to ports...');

// Teste manual de porta 6101
const ws = new WebSocket('ws://127.0.0.1:6101/');
ws.onopen = () => console.log('✅ PORT 6101 OPEN!');
ws.onerror = (e) => console.log('❌ PORT 6101 FAILED:', e);
ws.onclose = () => console.log('🔒 PORT 6101 CLOSED');
```

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Execute na ordem:

- [ ] 1. Parar Vite (`Ctrl+C`)
- [ ] 2. Limpar cache do Vite: `Remove-Item -Recurse -Force node_modules/.vite`
- [ ] 3. Reiniciar Vite: `npm run dev`
- [ ] 4. Aguardar "ready in XXX ms"
- [ ] 5. No iPhone: Fechar Safari completamente
- [ ] 6. Reabrir Safari
- [ ] 7. Acessar https://tampaapp.vercel.app/labeling
- [ ] 8. Abrir console (Eruda ou Safari Inspector)
- [ ] 9. Tentar imprimir uma etiqueta
- [ ] 10. Verificar logs detalhados com emojis

---

## 🎉 RESULTADO ESPERADO

Depois de seguir os passos, ao tentar imprimir você DEVE ver:

```
🏷️  ============================================
🏷️  ZEBRA LABEL PRINTING - START
🏷️  ============================================
📦 Product: Mozzarella Cheese
🏢 Organization: [uuid]
👤 Prepared by: [name]
📅 Prep date: 2026-01-19
📅 Expiry date: 2026-01-26
🧪 Test mode: false
🏷️  ============================================

💾 [STEP 1/3] Saving label to database...
✅ [STEP 1/3] Label saved! ID: c445d967-3fc6-4223-841a-4dee795e841e

📝 [STEP 2/3] Generating ZPL code...
✅ [STEP 2/3] ZPL generated (1234 characters)

🖨️  [STEP 3/3] Sending to printer...

🖨️  ============================================
🖨️  ZEBRA PRINTER - DETAILED CONNECTION LOG
🖨️  ============================================
📱 Device: iPhone via Zebra Printer Setup App
🔌 Connection: Bluetooth
📄 ZPL Length: 1234 characters
🔢 Quantity: 1
🌐 Attempting connection to localhost...
🖨️  ============================================

🔍 [ATTEMPT 1/3] Trying Zebra Browser Print on port 6101...
🔗 Connecting to: ws://127.0.0.1:6101/
⏱️  Timeout: 10 seconds
```

**Se não ver esses logs detalhados, o código antigo ainda está cached!**

---

## 🆘 ÚLTIMA OPÇÃO: Deploy Forçado

Se realmente nada funcionar localmente, force um deploy:

```powershell
# Commit as mudanças
git add .
git commit -m "feat: add multi-port fallback and detailed logging to zebra printer"

# Push para trigger Vercel deploy
git push origin main
```

Vercel fará fresh build sem cache.

---

**Status:** 🔄 AGUARDANDO RELOAD  
**Next Step:** Siga os passos acima e teste novamente  
**Expected:** Logs detalhados com emojis e tentativas de múltiplas portas
