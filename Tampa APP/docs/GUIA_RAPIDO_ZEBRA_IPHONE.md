# 📱 Guia Rápido: Conectar Impressora Zebra no iPhone

## ✅ Checklist Antes de Começar

- [ ] Impressora Zebra ligada
- [ ] Papel carregado na impressora
- [ ] Bateria carregada (se portátil)
- [ ] iPhone com Bluetooth ligado
- [ ] App "Zebra Printer Setup" instalado

---

## 🎯 Passo a Passo Visual

### **1️⃣ Parear no iPhone PRIMEIRO** (3 min)

```
📱 iPhone → Configurações → Bluetooth

OUTROS DISPOSITIVOS:
→ 60:95:32:55:3F:99 [Toque aqui]
→ ZD411-203dpi [Toque aqui]
→ Printer123 [Toque aqui]

Aguarde:
MEUS DISPOSITIVOS:
🔵 Printer123 | Conectado ✅
```

**⚠️ IMPORTANTE:** Só prossiga quando ver "Conectado"!

---

### **2️⃣ Abrir Zebra Printer Setup** (2 min)

```
📱 Toque no app Zebra Printer Setup

Primeira tela:
[+] ou [Discover Printers]
↓
Toque aqui
```

---

### **3️⃣ Escanear Impressoras** (1 min)

```
Abas no topo:
[Wi-Fi] [Bluetooth] [USB]
         ↑
    Toque aqui

🔍 Scanning...
Aguarde 10-30 segundos

Lista de impressoras:
📋 Printer123
   60:95:32:55:3F:99
   Status: Available
   ↑
Toque aqui
```

---

### **4️⃣ Conectar** (30 seg)

```
Conectando...

Aguarde ver:
🟢 Printer123 (Connected) ✅

Status muda de "Available" para "Connected"
```

---

### **5️⃣ Configurar (se aparecer erro)** (1 min)

Se aparecer: ❌ "Não foi possível salvar as configurações"

**Solução:**

```
1. Feche o app (deslize para cima)

2. iPhone → Configurações → Bluetooth
   → Toque no (i) ao lado da impressora
   → "Esquecer Este Dispositivo"

3. Repita PASSO 1, 2, 3 e 4 acima
```

---

### **6️⃣ Testar Impressão** (30 seg)

```
Na tela da impressora conectada:

[Print Test Label]
↓
Toque aqui

Aguarde etiqueta sair 🎉
```

---

## 🚨 Problemas Comuns

### Problema 1: Impressora não aparece no scan

**Solução:**
```
1. Desligue a impressora (botão Power)
2. Aguarde 10 segundos
3. Ligue novamente
4. No app, toque "Discover" novamente
```

---

### Problema 2: "Connection Failed"

**Solução:**
```
1. Verifique se Bluetooth está ligado no iPhone
2. Verifique se impressora está ligada
3. Aproxime iPhone da impressora (< 2 metros)
4. Tente novamente
```

---

### Problema 3: Conecta mas não imprime

**Solução:**
```
1. No app Zebra, vá em Settings ⚙️
2. Procure "Web Services"
3. Ative: ON ✅
4. Salve configurações
```

---

## ⚙️ Configurações (Após Conectar)

### Para ZD411 Bluetooth:

**✅ Boa notícia:** Não precisa configurar nada!

O app Zebra Printer Setup funciona automaticamente após conectar a impressora via Bluetooth.

```
❓ E o Web Services?
→ ZD411 Bluetooth NÃO tem essa opção (é normal!)
→ App funciona automaticamente nas portas 6101/9100/9200

❓ E o Remote Server?
→ Se aparecer, deixe DESATIVADO ❌
→ Tampa APP usa conexão LOCAL (não servidor remoto)
```

**Configuração necessária:** NENHUMA! 🎉

Apenas mantenha:
- ✅ Impressora conectada (🟢 Connected)
- ✅ App Zebra aberto (pode minimizar)

---

## 🎯 Usar com Tampa APP

Depois de configurar:

1. **DEIXE o app Zebra Printer Setup ABERTO**
   ```
   Não feche o app!
   Pode minimizar, mas não deslizar para cima
   ```

2. **Abra Tampa APP no Safari:**
   ```
   https://tampaapp.vercel.app
   ```

3. **Vá em Labeling → Imprimir:**
   ```
   Toque no produto
   → Botão "Print"
   → Aguarde impressão 🎉
   ```

---

## 📞 Ainda com problemas?

Consulte o guia completo: `TROUBLESHOOTING_ZEBRA_PRINTER_SETUP.md`

Ou entre em contato com o suporte.

---

**Última atualização:** 20 de Janeiro de 2026
