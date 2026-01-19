# 🖨️ Guia Específico: Impressora DOPMOOEZ com iPhone

## 🚨 Problema Identificado

O modelo **DOPMOOEZ** **NÃO possui suporte nativo a Web Services** no Zebra Printer Setup app. Por isso:
- ❌ A opção "Web Services" NÃO aparece nas configurações Bluetooth
- ❌ O método WebSocket (`ws://127.0.0.1:9100`) NÃO funciona
- ❌ O guia padrão de Zebra Printer Setup NÃO se aplica

---

## 🔍 Sobre o Modelo DOPMOOEZ

### Características
- **Fabricante:** Provavelmente clone/OEM baseado em impressoras Zebra
- **Protocolo:** Compatível com ZPL (Zebra Programming Language)
- **Conectividade:** Bluetooth + USB
- **Limitação:** Firmware limitado, sem suporte a Web Services

### Por que Web Services não aparece?
O Web Services é uma funcionalidade **exclusiva de impressoras Zebra originais** com firmware moderno:
- ZQ500/ZQ600 Series ✅
- ZT200/ZT400 Series ✅
- ZD400/ZD600 Series ✅
- **DOPMOOEZ (clone/OEM)** ❌

---

## ✅ Soluções Alternativas (em ordem de viabilidade)

### **Opção 1: Conexão USB Direta com Adaptador (MAIS RÁPIDA) ⚡**

#### O que você precisa:
```
iPhone → Adaptador Lightning/USB-C → Cabo USB → Impressora DOPMOOEZ
```

**Adaptador necessário:**
- **iPhone 8-14 (Lightning):** [Apple Lightning to USB Camera Adapter](https://www.apple.com/shop/product/MD821AM/A/lightning-to-usb-camera-adapter)
- **iPhone 15+ (USB-C):** [Apple USB-C to USB Adapter](https://www.apple.com/shop/product/MJ1M2AM/A/usb-c-to-usb-adapter)

#### Passo a passo:
1. **Compre o adaptador Apple oficial** (R$ 150-250)
2. **Conecte:**
   ```
   iPhone → Adaptador → Cabo USB da impressora
   ```
3. **Instale app de impressão:**
   - [Printer Pro](https://apps.apple.com/app/printer-pro-print-documents/id393313223) (R$ 32)
   - [Print n Share](https://apps.apple.com/app/print-n-share/id367300649) (Grátis)
4. **Teste impressão:**
   - Abra PDF ou imagem no iPhone
   - Compartilhe → Imprimir → Selecione impressora

**✅ Vantagens:**
- Configuração em 10 minutos
- Conexão estável e rápida
- Não depende de Web Services
- Funciona com qualquer impressora USB

**❌ Desvantagens:**
- Requer cabo físico durante impressão
- iPhone precisa estar próximo à impressora
- Não funciona sem adaptador

---

### **Opção 2: Gateway de Impressão via Backend (SOLUÇÃO PROFISSIONAL) 🚀**

#### Arquitetura:
```
[iPhone Safari]  →  [Tampa APP (Vercel)]  →  [Backend Gateway]  →  [Bluetooth]  →  [DOPMOOEZ]
    HTTPS                  HTTPS                  WebSocket           Direct
```

#### Como funciona:
1. **iPhone acessa Tampa APP no Vercel** (https://tampa-app.vercel.app)
2. **App envia ZPL para backend:**
   ```typescript
   await fetch('https://print-gateway.railway.app/print', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ zpl, printerMAC: 'XX:XX:XX:XX:XX:XX' })
   });
   ```
3. **Backend (rodando 24/7) conecta via Bluetooth e imprime**

#### Implementação do Backend:

##### **Python + FastAPI (RECOMENDADO)**

**Arquivo:** `print-gateway/main.py`
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import bluetooth
import socket
from pydantic import BaseModel

app = FastAPI()

# CORS para aceitar requisições do Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tampa-app.vercel.app"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

class PrintRequest(BaseModel):
    zpl: str
    printer_mac: str  # MAC address da DOPMOOEZ: "XX:XX:XX:XX:XX:XX"
    quantity: int = 1

@app.post("/print")
async def print_label(request: PrintRequest):
    try:
        # Conecta via Bluetooth
        port = 1  # Canal SPP padrão
        sock = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
        sock.connect((request.printer_mac, port))
        
        # Envia ZPL
        zpl_with_quantity = request.zpl.replace('^XZ', f'^PQ{request.quantity}^XZ')
        sock.send(zpl_with_quantity.encode('utf-8'))
        
        sock.close()
        return {"success": True, "message": "Label printed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/printers")
async def discover_printers():
    """Descobre impressoras Bluetooth próximas"""
    nearby = bluetooth.discover_devices(lookup_names=True)
    printers = [{"mac": addr, "name": name} for addr, name in nearby if "DOPMOOEZ" in name.upper()]
    return {"printers": printers}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Dependências:** `requirements.txt`
```
fastapi==0.104.1
uvicorn==0.24.0
pybluez==0.23
pydantic==2.5.0
```

**Deploy:**
```bash
# Railway (mais fácil)
railway init
railway up

# Ou Fly.io
fly launch
fly deploy

# Ou Raspberry Pi local
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

##### **Node.js + Express (Alternativa)**

**Arquivo:** `print-gateway/index.js`
```javascript
const express = require('express');
const cors = require('cors');
const BluetoothSerialPort = require('bluetooth-serial-port');

const app = express();
app.use(cors({ origin: 'https://tampa-app.vercel.app' }));
app.use(express.json());

const btSerial = new BluetoothSerialPort.BluetoothSerialPort();

app.post('/print', async (req, res) => {
  const { zpl, printerMAC, quantity = 1 } = req.body;

  try {
    // Conecta à impressora
    await new Promise((resolve, reject) => {
      btSerial.findSerialPortChannel(printerMAC, (channel) => {
        btSerial.connect(printerMAC, channel, () => {
          console.log('Connected to DOPMOOEZ');
          resolve();
        }, reject);
      }, reject);
    });

    // Envia ZPL
    const zplWithQty = zpl.replace('^XZ', `^PQ${quantity}^XZ`);
    btSerial.write(Buffer.from(zplWithQty, 'utf-8'), (err) => {
      if (err) throw err;
      btSerial.close();
      res.json({ success: true });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(8000, () => console.log('Print Gateway running on port 8000'));
```

**Dependências:** `package.json`
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "bluetooth-serial-port": "^2.2.8"
  }
}
```

#### Atualizar Tampa APP (Vercel):

**Arquivo:** `src/utils/zebraPrinter.ts`
```typescript
const sendToPrinter = async (zpl: string, quantity: number = 1): Promise<void> => {
  // Detectar se está em produção (Vercel) ou localhost
  const isProd = window.location.hostname !== 'localhost';
  
  if (isProd) {
    // Produção: Usa gateway backend
    const response = await fetch('https://print-gateway.railway.app/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zpl,
        printer_mac: 'XX:XX:XX:XX:XX:XX', // Substitua pelo MAC real da DOPMOOEZ
        quantity
      })
    });
    
    if (!response.ok) {
      throw new Error('Print gateway failed');
    }
  } else {
    // Localhost: Usa WebSocket local (se disponível)
    const socket = new WebSocket('ws://127.0.0.1:9100/');
    // ... código existente
  }
};
```

**✅ Vantagens:**
- Funciona de qualquer lugar (iPhone, PC, tablet)
- Impressora pode estar em outro local (ex: cozinha, enquanto você está no salão)
- Escalável para múltiplas impressoras
- Mantém app web (sem precisar reescrever nativo)

**❌ Desvantagens:**
- Requer servidor rodando 24/7
- Complexidade adicional de infraestrutura
- Custo mensal (Railway/Fly.io ~$5-10/mês ou Raspberry Pi ~$50 uma vez)

---

### **Opção 3: App Nativo com React Native (LONGO PRAZO) 📱**

#### Por que nativo?
- Safari iOS **NÃO suporta Web Bluetooth API**
- Bluetooth direto requer APIs nativas (CoreBluetooth no iOS)
- React Native/Capacitor permitem usar essas APIs

#### Stack recomendada:

**React Native + Zebra SDK:**
```bash
npm install react-native-zebra-bluetooth-printer
```

**Código exemplo:**
```typescript
import ZebraPrinter from 'react-native-zebra-bluetooth-printer';

async function printLabel(zpl: string) {
  // Descobre impressoras
  const printers = await ZebraPrinter.discover();
  const dopmooez = printers.find(p => p.name.includes('DOPMOOEZ'));
  
  // Conecta
  await ZebraPrinter.connect(dopmooez.address);
  
  // Imprime
  await ZebraPrinter.print(zpl);
}
```

**Ou Capacitor + Bluetooth LE:**
```bash
npm install @capacitor-community/bluetooth-le
```

**Código exemplo:**
```typescript
import { BleClient } from '@capacitor-community/bluetooth-le';

async function printLabel(zpl: string) {
  await BleClient.initialize();
  
  // Scan por DOPMOOEZ
  await BleClient.requestLEScan({}, (result) => {
    if (result.device.name?.includes('DOPMOOEZ')) {
      const deviceId = result.device.deviceId;
      connectAndPrint(deviceId, zpl);
    }
  });
}

async function connectAndPrint(deviceId: string, zpl: string) {
  await BleClient.connect(deviceId);
  
  // UUID do serviço SPP/Serial
  const serviceUUID = '00001101-0000-1000-8000-00805F9B34FB';
  const charUUID = '0000FFE1-0000-1000-8000-00805F9B34FB';
  
  // Envia ZPL
  await BleClient.write(deviceId, serviceUUID, charUUID, 
    new TextEncoder().encode(zpl)
  );
}
```

**Compilar app nativo:**
```bash
# iOS
npx cap add ios
npx cap open ios
# Xcode → Build → Deploy

# Android  
npx cap add android
npx cap open android
# Android Studio → Build → Deploy
```

**✅ Vantagens:**
- Bluetooth direto e confiável
- Controle total do ZPL
- Funciona offline
- Performance nativa

**❌ Desvantagens:**
- Requer reescrever app inteiro como nativo
- Tempo de desenvolvimento: 2-4 semanas
- Precisa publicar na App Store/Play Store
- Não funciona em browser

---

### **Opção 4: Trocar de Impressora (ÚLTIMA OPÇÃO) 💰**

Se nenhuma opção acima for viável, considere **adquirir modelo Zebra original com Web Services**:

#### Modelos compatíveis:

| Modelo | Preço (USD) | Web Services | Conectividade | Onde Comprar |
|--------|-------------|--------------|---------------|--------------|
| **Zebra ZD421** | ~$350 | ✅ | Bluetooth, USB, Ethernet | Amazon, B&H |
| **Zebra ZQ220** | ~$400 | ✅ | Bluetooth, WiFi | Zebra Direct |
| **Zebra ZD220** | ~$250 | ✅ | Bluetooth, USB | Amazon |
| **Zebra ZQ320** | ~$500 | ✅ | Bluetooth, WiFi (portátil) | Zebra Direct |

**⚠️ Importante:** Verifique se o modelo tem **Link-OS** (sistema operacional Zebra com Web Services)

---

## 🎯 Recomendação Final

### Para uso imediato (hoje):
✅ **Opção 1: Adaptador USB** 
- Custo: ~R$ 200 (adaptador + app)
- Tempo: 10 minutos
- Funciona: Sim, 100%

### Para produção profissional (1-2 semanas):
✅ **Opção 2: Gateway Backend**
- Custo: ~$5/mês (Railway) ou R$ 250 (Raspberry Pi)
- Tempo: 1-2 dias de desenvolvimento
- Funciona: Remoto, escalável

### Para longo prazo (1-2 meses):
✅ **Opção 3: App Nativo**
- Custo: Tempo de desenvolvimento
- Tempo: 2-4 semanas
- Funciona: Offline, melhor UX

---

## 🛠️ Próximos Passos

**Escolha sua opção preferida e me informe para eu ajudar com:**
1. Código completo do backend (Opção 2)
2. Setup do adaptador USB (Opção 1)
3. Guia de conversão React Native (Opção 3)
4. Recomendações de compra de impressora (Opção 4)

**Qual opção você prefere testar primeiro?** 🤔
