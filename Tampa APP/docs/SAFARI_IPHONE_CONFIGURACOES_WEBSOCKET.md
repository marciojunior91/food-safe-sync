# 📱 Configurações EXATAS do Safari no iPhone para WebSocket

## 🎯 Caminho Completo das Configurações

### ⚠️ IMPORTANTE: Na verdade, NÃO há configuração necessária!

**Safari no iPhone já aceita WebSocket por padrão.** Não existe menu "Experimental Features" ou "WebSocket" para ativar no Safari do iPhone (isso só existe no Safari do Mac).

---

## ✅ O que REALMENTE precisa verificar:

### **1️⃣ Zebra Printer Setup App está ABERTO**

```
iPhone → Tela inicial → Zebra Printer Setup → ABRIR O APP

Status esperado:
🖨️ ZD411-203dpi
🟢 Connected
Serial: DFJ253402166
```

⚠️ **O app DEVE estar VISÍVEL na tela ou NO MÁXIMO em background recente (não pode estar "morto")**

---

### **2️⃣ Bluetooth está CONECTADO**

```
iPhone → ⚙️ Ajustes (Settings) → Bluetooth

Verificar:
☑️ Bluetooth: ON (azul)
🔵 ZD411-203dpi: Conectado
```

---

### **3️⃣ Impressora está LIGADA**

```
ZD411 → Botão Power
LED: 🟢 Verde aceso
Status: Pronta
```

---

### **4️⃣ (OPCIONAL) Safari não está bloqueando cookies/tracking**

Apenas se continuar falhando, tente TEMPORARIAMENTE:

```
iPhone → ⚙️ Ajustes → Safari → Privacidade e Segurança

Desative TEMPORARIAMENTE (só para testar):
☐ Prevenir Rastreamento entre Sites (OFF)
☐ Bloquear Todos os Cookies (OFF)

⚠️ Após testar, você pode VOLTAR estas configurações para ON
```

---

## 🔍 Por que o erro está acontecendo?

Os screenshots mostram:

```
❌ Message: Failed to connect to printer on any port.
   Last error: WebSocket error on port 9200: error

❌ ZPL GENERATION ERROR

❌ Print failed: Failed to connect to printer on any port.
```

### **Análise Técnica:**

O Tampa APP tentou conectar nas 3 portas:

1. **6101** - Porta principal do Zebra Browser Print ❌ FALHOU
2. **9100** - Porta alternativa Web Services ❌ FALHOU  
3. **9200** - Porta Setup Utilities ❌ FALHOU

**Conclusão:** O Zebra Printer Setup App NÃO está aceitando conexões WebSocket.

---

## 🚨 Diagnóstico Rápido

Execute este checklist EXATO:

### ✅ CHECKLIST DE VERIFICAÇÃO

```
□ 1. Zebra Printer Setup App está ABERTO na tela?
      Sim → Prossiga
      Não → ABRA O APP AGORA

□ 2. No app, a impressora mostra "Connected"?
      Sim → Prossiga
      Não → Toque na impressora → Connect

□ 3. LED da impressora está VERDE?
      Sim → Prossiga
      Não → Ligue a impressora

□ 4. Há papel carregado na impressora?
      Sim → Prossiga
      Não → Carregue o papel

□ 5. Bluetooth iPhone mostra ZD411 Conectado?
      Sim → Prossiga
      Não → Configurações → Bluetooth → Conectar

□ 6. Tampa APP está aberto em outra aba Safari?
      Sim → OK, pode testar novamente
      Não → Abra tampaapp.vercel.app
```

---

## 🧪 Teste Correto Passo a Passo

### **Procedimento COMPLETO:**

```
1. FECHE todas as abas do Safari
   Safari → Abas → Fechar Todas

2. FORCE-QUIT o Zebra Printer Setup
   iPhone → Swipe up → Fechar app Zebra

3. REABRA o Zebra Printer Setup
   Tela inicial → Zebra Printer Setup

4. CONECTE a impressora
   Toque em ZD411 → Aguarde "Connected"

5. DEIXE O APP ZEBRA ABERTO
   NÃO minimize ainda

6. Abra Safari em NOVA ABA
   Safari → + Nova Aba

7. Acesse Tampa APP
   Digite: tampaapp.vercel.app

8. Faça login (se necessário)
   Email e senha

9. Vá em Settings → Impressoras
   Menu lateral → Settings

10. Localize a impressora
    📋 Lista: ZD411-Kitchen (Offline)

11. Clique "Testar"
    Botão de teste ao lado do nome

12. OBSERVE o app Zebra
    Volte para o app Zebra (não feche Safari!)
    Deve aparecer atividade/conexão

13. Volte para Safari
    Safari deve mostrar sucesso ou erro
```

---

## 📸 O que deve acontecer quando FUNCIONAR:

### **1. Console do Safari (DevTools):**

```
✅ [PORT 6101] WebSocket connection attempt...
✅ [PORT 6101] WebSocket OPENED successfully
✅ SUCCESS! Connected via Zebra Browser Print (port 6101)
✅ Sending test label...
✅ Label sent successfully
✅ Printer status updated: ready
```

### **2. Tampa APP UI:**

```
Status: 🟢 Ready
Última conexão: Agora
```

### **3. Impressora:**

```
🖨️ Imprime etiqueta de teste:
   TAMPA APP
   Teste de Conexão
   ✓ OK
```

---

## ❌ Se AINDA falhar:

### **Opção A: Reiniciar Conexão Bluetooth**

```
iPhone → Ajustes → Bluetooth
→ Toque no (i) ao lado de ZD411
→ Esquecer Este Dispositivo
→ Confirmar

Aguarde 10 segundos

→ Nova pesquisa de dispositivos
→ Toque em ZD411 quando aparecer
→ Parear
→ Abrir Zebra Printer Setup
→ Conectar impressora
→ Tentar novamente
```

---

### **Opção B: Reiniciar Impressora**

```
ZD411:
→ Desligar (botão Power 5s)
→ Aguardar LED apagar completamente
→ Aguardar 10 segundos
→ Ligar (botão Power)
→ Aguardar boot (~30s, LED verde)
→ Abrir Zebra Setup App
→ Conectar
→ Tentar novamente
```

---

### **Opção C: Verificar versão do Zebra Setup App**

```
iPhone → App Store
→ Pesquisar: Zebra Printer Setup
→ Verificar se há ATUALIZAÇÃO disponível
→ Se sim: Atualizar
→ Reabrir app
→ Tentar novamente
```

---

## 🎯 Resposta Direta à Sua Pergunta

**"me mostre o caminho EXATO de oq tem q ativar em AVANÇADO do SAFARI"**

### ✅ Resposta:

**NÃO existe configuração de WebSocket para ativar no Safari do iPhone.**

O Safari no iPhone:
- ✅ Já aceita WebSocket por padrão
- ✅ Não tem menu "Experimental Features" (só no Mac)
- ✅ Não precisa ativar nada

O problema é que o **Zebra Printer Setup App não está respondendo**, não o Safari.

---

## 🔍 Configurações do Safari que PODEM afetar (mas raramente):

### **Caso extremo: Safari bloqueando conexões locais**

```
iPhone → ⚙️ Ajustes → Safari

1. Aba "Privacidade e Segurança":
   
   ☐ Prevenir Rastreamento entre Sites
      → Tente desligar TEMPORARIAMENTE
   
   ☐ Bloquear Todos os Cookies
      → Deve estar OFF (permitir cookies)
   
   ☐ Avisos de Sites Fraudulentos
      → Pode deixar ON

2. Aba "Avançado":
   
   ☑️ Dados de Sites
      → Pode limpar se quiser (não afeta WebSocket)
   
   ☑️ Web Inspector (OPCIONAL - só para debug)
      → OFF (não precisa ativar)
   
   ⚠️ NÃO HÁ configuração de WebSocket aqui!
```

---

## 💡 Conclusão

### **O problema NÃO é o Safari, é o Zebra Setup App que não está respondendo.**

Foco no checklist:

1. ✅ **Zebra Setup App ABERTO**
2. ✅ **Impressora CONECTADA no app**
3. ✅ **Bluetooth iPhone ativo**
4. ✅ **Impressora LIGADA**
5. ✅ **Tampa APP aberto em OUTRA aba** (não feche o Zebra!)

---

**Última atualização:** 20 de Janeiro de 2026  
**Versão:** 1.0
