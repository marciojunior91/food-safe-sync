# 🔧 Troubleshooting: "Não foi possível salvar as configurações" - Zebra Printer Setup

## 📱 Erro Identificado

Seu cliente está vendo o erro:
```
❌ Erro
Não foi possível salvar as configurações
```

Este erro aparece quando o **Zebra Printer Setup App** não consegue salvar as configurações da impressora (como nome, endereço Bluetooth, etc).

---

## 🎯 Causa Mais Comum

O erro geralmente ocorre porque:

1. **A impressora não está totalmente pareada via Bluetooth**
2. **O iPhone não concluiu o pareamento nas Configurações do iOS**
3. **O app Zebra não tem permissão de Bluetooth**
4. **A impressora está conectada em outro dispositivo**

---

## ✅ Solução Passo a Passo

### **PASSO 1: Desconectar Totalmente** (2 min)

1. **Feche o app Zebra Printer Setup:**
   ```
   Deslize o app para cima para fechá-lo completamente
   ```

2. **No iPhone, vá em Configurações → Bluetooth:**
   ```
   📱 Configurações
   → Bluetooth
   → Procure sua impressora na lista "MEUS DISPOSITIVOS"
   
   Exemplo: "ZD411-203dpi" ou "Printer123"
   ```

3. **Toque no ℹ️ ao lado da impressora:**
   ```
   Toque no círculo (i) azul
   → Toque "Esquecer Este Dispositivo"
   → Confirme "Esquecer Dispositivo"
   ```

4. **Desligue Bluetooth do iPhone:**
   ```
   Configurações → Bluetooth → OFF
   Aguarde 5 segundos
   ```

5. **Desligue a impressora Zebra:**
   ```
   Botão de Power
   Aguarde 10 segundos
   ```

---

### **PASSO 2: Reconectar Corretamente** (5 min)

1. **Ligue a impressora Zebra:**
   ```
   Botão de Power
   Aguarde boot completo (luz verde estável)
   ```

2. **No iPhone, ligue o Bluetooth:**
   ```
   📱 Configurações → Bluetooth → ON
   ```

3. **PRIMEIRO: Parear nas Configurações do iOS**
   ```
   Configurações → Bluetooth
   
   Aguarde aparecer em "OUTROS DISPOSITIVOS":
   → 60:95:32:55:3F:99
   → ZD411-203dpi
   → Printer123
   
   ✅ TOQUE NO NOME DA IMPRESSORA
   
   Pode aparecer:
   - Código de pareamento → Digite o código
   - "Pareamento Bluetooth solicitado" → Toque "Conectar"
   - "Pareado" automaticamente ✅
   ```

4. **Aguarde status "Conectado":**
   ```
   MEUS DISPOSITIVOS
   🔵 [Nome da Impressora] | Conectado ✅
   
   ⚠️ NÃO prossiga até ver "Conectado"
   ```

---

### **PASSO 3: Abrir Zebra Printer Setup** (3 min)

1. **Abra o app Zebra Printer Setup:**
   ```
   📱 Toque no ícone do app
   ```

2. **Permita acesso ao Bluetooth (se aparecer):**
   ```
   "[App] gostaria de usar o Bluetooth"
   → Toque "OK" ou "Permitir" ✅
   ```

3. **Toque "Discover Printers" ou "+":**
   ```
   Botão grande na tela inicial
   ou
   + no canto superior direito
   ```

4. **Selecione aba "Bluetooth":**
   ```
   Abas: Wi-Fi | Bluetooth | USB
   → Toque em "Bluetooth"
   ```

5. **Aguarde o scan:**
   ```
   🔍 Scanning for printers...
   Aguarde 10-30 segundos
   ```

6. **Toque na sua impressora:**
   ```
   Lista de impressoras encontradas:
   
   📋 ZD411-203dpi
   60:95:32:55:3F:99
   Status: Available
   
   → TOQUE NO NOME
   ```

7. **Aguarde conexão:**
   ```
   "Connecting to printer..."
   
   Aguarde até ver:
   🟢 Status: Connected ✅
   ```

---

### **PASSO 4: Configurar Impressora** (2 min)

Agora que está conectado, configure normalmente:

1. **Toque em "Settings" ⚙️:**
   ```
   Ícone de engrenagem no canto superior direito
   ```

2. **Configure conforme necessário:**
   ```
   Tipo de Conexão: Bluetooth ✅
   Endereço: 60:95:32:55:3F:99 (já preenchido)
   Nome: Printer123 (personalize se quiser)
   ```

3. **Toque "Save" ou "Done":**
   ```
   Botão no topo
   ```

4. **Verifique se salvou:**
   ```
   Deve voltar para a tela da impressora
   Sem mensagem de erro ✅
   ```

---

## 🧪 Testar Impressão (1 min)

1. **Na tela da impressora conectada, toque "Print Test Label":**
   ```
   Botão na parte inferior
   ou
   Menu → Test Print
   ```

2. **Aguarde impressão:**
   ```
   Etiqueta de teste deve sair da impressora 🎉
   ```

3. **Se imprimiu:**
   ```
   ✅ Configuração está correta!
   ```

---

## ❌ Se o Erro Persistir

### Opção A: Resetar App Zebra Printer Setup

1. **Feche o app completamente:**
   ```
   Deslize para cima
   ```

2. **No iPhone, vá em Configurações:**
   ```
   Configurações
   → Geral
   → Armazenamento do iPhone
   → Zebra Printer Setup
   → "Desinstalar App" ou "Apagar App"
   ```

3. **Reinstale o app:**
   ```
   App Store → "Zebra Printer Setup"
   → Instalar novamente
   ```

4. **Repita o PASSO 1, 2 e 3 acima**

---

### Opção B: Resetar Configurações de Rede do iPhone

⚠️ **Atenção:** Isso apaga senhas WiFi salvas!

```
📱 Configurações
→ Geral
→ Transferir ou Redefinir iPhone
→ Redefinir
→ "Redefinir Ajustes de Rede"
→ Digite senha do iPhone
→ Confirme
```

Depois:
1. Reconecte WiFi
2. Repita PASSO 1, 2 e 3 acima

---

### Opção C: Verificar Modelo da Impressora

Alguns modelos Zebra têm limitações de conexão:

1. **Verifique o modelo exato da impressora:**
   ```
   ZD411, ZD420, ZD620, ZQ220, ZQ320, ZT410, etc.
   ```

2. **Verifique se Bluetooth está ativado na impressora:**
   ```
   Impressoras com display:
   → Menu → Settings → Bluetooth → ON
   
   Impressoras sem display:
   → Geralmente Bluetooth está sempre ligado
   → LED Bluetooth azul deve estar aceso ou piscando
   ```

3. **Verifique se a impressora suporta SPP (Serial Port Profile):**
   ```
   A maioria das Zebra suporta
   Modelos muito antigos (antes de 2015) podem não suportar
   ```

---

## 🔍 Logs de Diagnóstico

Se ainda não funcionar, colete logs para análise:

1. **No Zebra Printer Setup, após conectar:**
   ```
   Settings → About → Diagnostics
   → "Generate Diagnostic Report"
   → Envie o arquivo por email
   ```

2. **No Tampa APP (navegador):**
   ```
   Abra o console:
   Safari → Develop → [Seu iPhone] → Console
   
   Tente imprimir
   → Copie as mensagens de erro
   ```

---

## 📋 Checklist Final

Antes de tentar imprimir do Tampa APP:

- [ ] Impressora ligada e com papel
- [ ] Bluetooth ativado no iPhone
- [ ] Impressora pareada em **Configurações → Bluetooth** (status: Conectado)
- [ ] App Zebra Printer Setup instalado
- [ ] Impressora conectada no app Zebra (🟢 Connected)
- [ ] Configurações salvas sem erro
- [ ] Teste de impressão funcionou no próprio app Zebra
- [ ] App Zebra Printer Setup **ABERTO em background** (não fechado)

**❓ E o Web Services?**
- Para **ZD411 Bluetooth**: NÃO existe (é normal - app funciona automaticamente)
- Para modelos **WiFi/Ethernet**: Deve estar ON

**❌ NÃO configurar:**
- [ ] Remote Server (deixe OFF)
- [ ] Server URL (deixe vazio)

---

## ⚙️ Configurações Importantes

### ✅ O Que Deve Estar ATIVADO:

```
Bluetooth:            🟢 ON (OBRIGATÓRIO!)
Impressora Conectada: 🟢 Connected (OBRIGATÓRIO!)
```

### ❌ O Que Deve Estar DESATIVADO:

```
Remote Server:        ⚪ OFF (deixe desativado)
Server URL:           (vazio - não preencha)
```

### ❓ E o Web Services?

**Para ZD411 Bluetooth:** NÃO existe essa opção!

```
❓ "Não encontro Web Services no app"
✅ É NORMAL! ZD411 Bluetooth não tem Web Services

O app Zebra Printer Setup funciona automaticamente
escutando nas portas 6101, 9100 e 9200.

Não precisa ativar nada! 🎉
```

**Para modelos WiFi/Ethernet:** Web Services deve estar ON

```
Se seu modelo tem WiFi/Ethernet:
→ Settings → Web Services → 🟢 ON
```

**Por quê?** Tampa APP usa conexão **local** via WebSocket. Para ZD411 Bluetooth, o app Zebra funciona automaticamente como ponte entre Safari e impressora.

---

## 🎯 Resumo: Ordem Correta de Conexão

```
1️⃣ Ligue a impressora Zebra
2️⃣ No iPhone: Configurações → Bluetooth → Parear impressora
3️⃣ Aguarde status "Conectado" nas Configurações do iOS
4️⃣ Abra Zebra Printer Setup
5️⃣ Discover Printers → Bluetooth → Selecione impressora
6️⃣ Aguarde "Connected" no app
7️⃣ Configure e salve (sem erro)
8️⃣ Teste impressão no próprio app Zebra
9️⃣ DEIXE o app Zebra aberto em background
🔟 Abra Tampa APP e tente imprimir
```

---

## 💡 Dica Importante

**O app Zebra Printer Setup funciona como uma "ponte":**

```
Tampa APP (Safari)
    ↓ (WebSocket)
Zebra Printer Setup (background)
    ↓ (Bluetooth)
Impressora Zebra 🖨️
```

Por isso é crucial:
1. App Zebra estar ABERTO (mesmo em background)
2. Impressora CONECTADA no app
3. Bluetooth ATIVO no iPhone

---

## 📞 Próximos Passos

Se após seguir todos os passos o erro persistir:

1. **Tire screenshot da mensagem de erro**
2. **Anote o modelo exato da impressora**
3. **Verifique se a impressora tem firmware atualizado**
4. **Contate suporte Zebra:** https://www.zebra.com/us/en/support-downloads.html

---

**Criado em:** 20 de Janeiro de 2026  
**Última atualização:** 20 de Janeiro de 2026  
**Versão:** 1.0
