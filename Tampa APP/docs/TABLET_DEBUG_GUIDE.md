# 🐛 Guia de Debug - Tablet Android

## Problema: "Device is not responding" no Chrome Remote Debugging

Você ativou a depuração USB no tablet, mas aparece:
```
Offline
#R9XX601744T
Device is not responding.
```

---

## ✅ SOLUÇÕES

### **Solução 1: Reinstalar Driver USB (RECOMENDADO)**

#### Passo 1: Desinstalar driver atual

1. Abra **Gerenciador de Dispositivos** (Win + X → Gerenciador de Dispositivos)
2. Conecte o tablet via USB
3. Procure por:
   - **Dispositivos Android** → Seu tablet
   - OU **Dispositivos Portáteis** → Seu tablet
   - OU **Outros Dispositivos** → Dispositivo desconhecido
4. Clique com botão direito → **Desinstalar dispositivo**
5. Marque ☑️ "Excluir o software de driver deste dispositivo"
6. Clique **Desinstalar**
7. **Desconecte o tablet**

#### Passo 2: Instalar driver correto

Execute no **PowerShell como Administrador**:

```powershell
# Baixar Google USB Driver oficial
$url = "https://dl.google.com/android/repository/latest_usb_driver_windows.zip"
$output = "$env:TEMP\google_usb_driver.zip"

Write-Host "📥 Downloading Google USB Driver..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile $output

Write-Host "📦 Extracting..." -ForegroundColor Cyan
Expand-Archive -Path $output -DestinationPath "$env:TEMP\google_usb_driver" -Force

Write-Host "✅ Driver downloaded to: $env:TEMP\google_usb_driver" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Open Device Manager (Win + X)"
Write-Host "2. Connect your tablet via USB"
Write-Host "3. Right-click on your device"
Write-Host "4. Select 'Update driver' → 'Browse my computer'"
Write-Host "5. Point to: $env:TEMP\google_usb_driver\usb_driver"
```

#### Passo 3: Atualizar driver manualmente

1. **Conecte o tablet** novamente
2. Abra **Gerenciador de Dispositivos**
3. Botão direito no dispositivo → **Atualizar driver**
4. Escolha **"Procurar drivers no computador"**
5. Clique **"Procurar..."** e navegue até:
   ```
   C:\Users\Marci\AppData\Local\Temp\google_usb_driver\usb_driver
   ```
6. Clique **"Avançar"**
7. Aguarde instalação

#### Passo 4: Testar conexão

```powershell
# Baixar ADB Platform Tools
Invoke-WebRequest -Uri "https://dl.google.com/android/repository/platform-tools-latest-windows.zip" -OutFile "$env:TEMP\platform-tools.zip"
Expand-Archive -Path "$env:TEMP\platform-tools.zip" -DestinationPath "C:\platform-tools" -Force

# Adicionar ao PATH
$env:Path += ";C:\platform-tools\platform-tools"

# Testar
adb devices

# Deve aparecer algo como:
# List of devices attached
# R9XX601744T    device
```

---

### **Solução 2: Revogar autorizações USB**

**No tablet:**

1. Vá em **Configurações → Opções do desenvolvedor**
2. Role até encontrar **"Revogar autorizações de depuração USB"**
3. Toque nessa opção
4. **Desconecte e reconecte** o cabo USB
5. Aparecerá o popup de autorização novamente
6. Marque ☑️ **"Sempre permitir deste computador"**
7. Toque **OK**

**No PC:**

```powershell
adb kill-server
adb start-server
adb devices
```

---

### **Solução 3: Usar cabo USB diferente**

Alguns cabos USB são apenas para carregamento (sem dados).

✅ **Use um cabo USB com suporte a dados**
- Teste com o cabo original do tablet
- OU compre um cabo USB-C com suporte a dados

---

### **Solução 4: Usar modo de desenvolvedor alternativo**

**No tablet:**

1. **Configurações → Opções do desenvolvedor**
2. Ative:
   - ☑️ **Depuração USB**
   - ☑️ **Instalação via USB** (se disponível)
   - ☑️ **Verificação de aplicativos via USB** (desative se necessário)
3. Mude **"Configuração USB padrão"** para **"Transferência de arquivos (MTP)"**

---

### **Solução 5: Debug via Wi-Fi (SEM CABO)**

Se USB não funcionar, use Wi-Fi:

#### Passo 1: Conectar via USB primeiro (só uma vez)

```powershell
# Conecte o tablet via USB
adb tcpip 5555

# Agora pode desconectar o cabo USB
```

#### Passo 2: Descobrir IP do tablet

**No tablet:**
- **Configurações → Sobre o tablet → Status → Endereço IP**
- Exemplo: `192.168.15.50`

#### Passo 3: Conectar via Wi-Fi

```powershell
# Substitua pelo IP do seu tablet
adb connect 192.168.15.50:5555

# Deve aparecer:
# connected to 192.168.15.50:5555

# Verificar conexão
adb devices

# Deve listar o dispositivo via Wi-Fi
# 192.168.15.50:5555    device
```

#### Passo 4: Usar no Chrome

Agora `chrome://inspect#devices` vai funcionar via Wi-Fi! 🎉

---

### **Solução 6: Usar Eruda Console (SEM ADB)**

Se nada funcionar, use console web integrado:

Acesse o app com `?debug=true`:
```
https://seu-app.vercel.app?debug=true
```

Aparecerá um console flutuante no canto inferior direito! 📱

---

## 🎯 Checklist de Troubleshooting

- [ ] Depuração USB está ativada no tablet
- [ ] Cabo USB suporta transferência de dados (não é só carregamento)
- [ ] Driver USB está instalado corretamente
- [ ] Autorizações USB foram aceitas no tablet ("Sempre permitir")
- [ ] `adb devices` mostra o dispositivo como "device" (não "unauthorized")
- [ ] Tablet e PC estão na mesma rede (para Wi-Fi debugging)
- [ ] Porta USB do PC está funcionando (testar outra porta)
- [ ] Modo de desenvolvedor está ativo no tablet

---

## 📱 Informações do Seu Tablet

```
Device: #R9XX601744T
Status: Offline (Device is not responding)
```

**Possíveis causas:**
1. ❌ Driver USB incorreto/desatualizado
2. ❌ Autorização USB não foi aceita
3. ❌ Cabo USB defeituoso
4. ❌ Porta USB do PC com problema

**Solução mais provável:** Reinstalar driver USB (Solução 1)

---

## 🆘 Se Nada Funcionar

Use debug via navegador:
```
https://seu-app.vercel.app?debug=true
```

OU

Configure debug via Wi-Fi (Solução 5) - funciona sem cabo USB!

---

## 📞 Próximos Passos

1. ✅ Tente **Solução 1** (Reinstalar driver USB)
2. ✅ Se não funcionar, tente **Solução 5** (Debug via Wi-Fi)
3. ✅ Como último recurso, use **Solução 6** (Eruda console)

**Qualquer dúvida, me avise! 🚀**
