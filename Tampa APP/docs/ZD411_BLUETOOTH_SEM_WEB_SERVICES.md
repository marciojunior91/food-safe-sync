# 🖨️ ZD411 Bluetooth: Configuração Simplificada (SEM Web Services)

## 🎯 Informação Importante

A **Zebra ZD411 via Bluetooth** conectada ao iPhone **NÃO possui opção "Web Services"** no app Zebra Printer Setup!

Isso é **NORMAL** e **NÃO é um problema**. O app funciona automaticamente.

---

## ✅ Como Funciona (Sem Web Services)

```
Tampa APP (Safari)
    ↓ WebSocket
Zebra Printer Setup App (escuta portas 6101/9100/9200)
    ↓ Bluetooth
ZD411 🖨️
```

O **Zebra Printer Setup App** automaticamente:
- Escuta conexões WebSocket nas portas 6101, 9100 e 9200
- Encaminha comandos ZPL para impressora via Bluetooth
- Funciona em background

**Não precisa ativar nada!** 🎉

---

## 📋 Configuração Correta para ZD411 Bluetooth

### **PASSO 1: Parear Bluetooth (iOS Settings)**

```
iPhone → Configurações → Bluetooth

OUTROS DISPOSITIVOS:
→ ZD411-203dpi [Toque aqui]
→ 60:95:32:55:3F:99 [Toque aqui]

Aguarde:
MEUS DISPOSITIVOS:
🔵 ZD411-203dpi | Conectado ✅
```

---

### **PASSO 2: Conectar no Zebra Printer Setup App**

```
1. Abra "Zebra Printer Setup"

2. Toque "Discover Printers"

3. Selecione aba "Bluetooth"

4. Aguarde scan (10-30 seg)

5. Toque na impressora:
   📋 ZD411-203dpi
   Status: Available

6. Aguarde conexão:
   🟢 ZD411-203dpi (Connected) ✅
```

---

### **PASSO 3: Configurar Impressora (SE necessário)**

Se aparecer tela de configuração:

```
Tipo de Conexão: Bluetooth ✅
Endereço: 60:95:32:55:3F:99 (já preenchido)
Nome: Printer123 (ou deixe padrão)

Toque "Save" ou "Done"
```

**❓ E o Web Services?**
- **NÃO vai aparecer** - é normal para ZD411 Bluetooth
- App Zebra funciona automaticamente sem essa opção

---

### **PASSO 4: NÃO Configure Remote Server**

Se aparecer "Remote Server Settings":

```
❌ Enable Remote Server: OFF (deixe desativado)
❌ Server URL: (deixe vazio)
```

Tampa APP usa conexão **LOCAL**, não servidor remoto!

---

## 🧪 Testar Impressão

### Teste 1: No Próprio App Zebra

```
1. Na tela da impressora conectada
2. Procure botão "Print Test Label"
3. Toque e aguarde
4. Etiqueta deve sair ✅
```

Se funciona = Bluetooth OK! ✅

---

### Teste 2: No Tampa APP

```
1. DEIXE Zebra Printer Setup aberto (background)
2. Safari → https://tampaapp.vercel.app
3. Labeling → Selecione produto → Print
4. Aguarde impressão ✅
```

Se funciona = Tudo OK! 🎉

---

## 🔍 Logs no Console (Para Diagnóstico)

Se não funcionar, abra console:

```
Safari → Develop → [Seu iPhone] → Console

Procure por:
✅ "Trying Zebra Browser Print on port 6101"
✅ "WebSocket OPENED successfully"
✅ "ZPL sent successfully"
✅ "Connected via port 6101"

Se aparecer ❌ "Connection failed":
→ Verifique se app Zebra está aberto
→ Verifique se impressora está conectada (🟢)
```

---

## ⚙️ Qual Porta É Usada?

O Tampa APP tenta **3 portas automaticamente** (em ordem):

| Porta | Nome | Quando Funciona |
|-------|------|-----------------|
| **6101** | Zebra Browser Print | iPhone + Zebra Setup App (mais comum) ✅ |
| **9100** | Web Services | Modelos WiFi/Ethernet com Web Services |
| **9200** | Zebra Setup Utilities | Versões antigas do app |

Para **ZD411 Bluetooth**, geralmente funciona na **porta 6101**.

Logs esperados:

```
🔍 [ATTEMPT 1/3] Trying Zebra Browser Print on port 6101...
✅ [PORT 6101] WebSocket OPENED successfully
✅ [PORT 6101] ZPL sent successfully
✅ SUCCESS! Connected via Zebra Browser Print (port 6101)
```

---

## ❌ Erros Comuns

### Erro 1: "Connection failed on all ports"

**Causa:** App Zebra Printer Setup não está aberto

**Solução:**
```
1. Abra Zebra Printer Setup
2. Verifique se impressora está 🟢 Connected
3. DEIXE app aberto (não feche)
4. Tente imprimir novamente
```

---

### Erro 2: "Não foi possível salvar as configurações"

**Causa:** Impressora não foi pareada PRIMEIRO no iOS Settings

**Solução:**
```
1. Feche app Zebra
2. iPhone → Configurações → Bluetooth
   → Toque (i) ao lado da impressora
   → "Esquecer Este Dispositivo"
3. Desligue impressora
4. Repita PASSO 1 e PASSO 2 acima
```

---

### Erro 3: "WebSocket connection failed"

**Causa:** App Zebra foi fechado ou impressora desconectou

**Solução:**
```
1. Verifique Bluetooth ativo no iPhone
2. Abra Zebra Printer Setup
3. Reconecte impressora se necessário
4. Aguarde 🟢 Connected
5. Tente imprimir novamente
```

---

## 📋 Checklist Final

Antes de imprimir do Tampa APP:

- [ ] Impressora ZD411 ligada
- [ ] Bluetooth ativo no iPhone
- [ ] Impressora pareada em **iOS Settings** (Conectado)
- [ ] Zebra Printer Setup instalado
- [ ] Impressora conectada no app (🟢 Connected)
- [ ] Teste de impressão no próprio app funcionou
- [ ] App Zebra **ABERTO** em background

**❌ NÃO precisa:**
- [ ] ~~Web Services~~ (não existe para ZD411 Bluetooth)
- [ ] ~~Remote Server~~ (não usar)
- [ ] ~~Server URL~~ (deixar vazio)

---

## 🎯 Por Que Não Tem Web Services?

### Modelos COM Web Services:
- ZD411 **WiFi** ✅
- ZD411 **Ethernet** ✅
- ZD620, ZD420 com rede ✅

### Modelos SEM Web Services:
- ZD411 **Bluetooth** ❌ (seu modelo)
- Modelos portáteis somente Bluetooth ❌

**Motivo:** Web Services é para comunicação via **rede** (WiFi/Ethernet). Modelos somente Bluetooth usam o **app como ponte**.

---

## 🔄 Fluxo Completo (Resumo)

```
1️⃣ Parear Bluetooth (iOS Settings)
   → Status: Conectado ✅

2️⃣ Abrir Zebra Printer Setup
   → Discover → Bluetooth → Conectar
   → Status: Connected ✅

3️⃣ Testar no próprio app
   → Print Test Label
   → Etiqueta imprime ✅

4️⃣ DEIXAR app aberto

5️⃣ Abrir Tampa APP (Safari)
   → Labeling → Print
   → Etiqueta imprime ✅

🎉 SUCESSO!
```

---

## 💡 Dica Pro

**Mantenha o app Zebra Printer Setup sempre aberto quando for usar o Tampa APP!**

Você pode:
- Minimizar o app (botão Home)
- Usar outros apps
- Navegar no Safari

Mas NÃO:
- Fechar o app (deslizar para cima)
- Desativar Bluetooth
- Desligar a impressora

---

## 📞 Ainda com problemas?

1. **Tire screenshot do erro**
2. **Abra console do Safari** e copie mensagens
3. **Verifique se:**
   - App Zebra está aberto
   - Impressora está 🟢 Connected
   - Bluetooth ativo

---

**Última atualização:** 20 de Janeiro de 2026  
**Modelo:** ZD411 Bluetooth (sem WiFi/Ethernet)  
**Versão:** 1.0
