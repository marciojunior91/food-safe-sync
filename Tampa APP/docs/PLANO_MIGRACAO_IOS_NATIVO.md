# 🚀 Plano Completo: Migração Tampa APP para iOS Nativo (Capacitor)

## 🎯 Objetivo

Converter Tampa APP (React PWA) para **aplicativo iOS nativo** com integração direta ao Zebra SDK, permitindo impressão via Bluetooth sem necessidade do Zebra Printer Setup App.

---

## 📋 Resumo Executivo

| Item | Detalhes |
|------|----------|
| **Tecnologia** | Capacitor 6 + React + TypeScript + Zebra Link-OS SDK |
| **Tempo Estimado** | 2-3 semanas (desenvolvimento + testes) |
| **Complexidade** | 🟡 Média |
| **Custo** | Apenas tempo de desenvolvimento (SDKs são gratuitos) |
| **Resultado Final** | App iOS nativo, funciona offline, impressão direta Bluetooth |

---

## 🔧 Fase 1: Preparação e Setup (2-3 dias)

### **PASSO 1.1: Instalar Capacitor**

```bash
cd "Tampa APP"

# Instalar dependências Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios

# Inicializar Capacitor
npx cap init "Tampa APP" com.tampaapp.app
```

**Configuração `capacitor.config.ts`:**
```typescript
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.tampaapp.app',
  appName: 'Tampa APP',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
```

---

### **PASSO 1.2: Adicionar Plataforma iOS**

```bash
# Adicionar iOS
npx cap add ios

# Build do projeto
npm run build

# Sincronizar com iOS
npx cap sync ios
```

**Estrutura criada:**
```
Tampa APP/
├── ios/
│   ├── App/
│   │   ├── App/
│   │   │   ├── Info.plist
│   │   │   ├── capacitor.config.json
│   │   │   └── public/ (web assets)
│   │   └── App.xcodeproj
│   └── Podfile
├── capacitor.config.ts
└── ... (resto do projeto)
```

---

### **PASSO 1.3: Instalar Zebra Link-OS SDK**

#### **Método A: Via CocoaPods (RECOMENDADO)**

Edite `ios/App/Podfile`:

```ruby
platform :ios, '13.0'

target 'App' do
  use_frameworks!

  # Capacitor Pods
  pod 'Capacitor', :path => '../../node_modules/@capacitor/ios'
  pod 'CapacitorCordova', :path => '../../node_modules/@capacitor/ios'

  # Zebra Link-OS SDK
  pod 'ZebraSDK', '~> 2.0'
end

post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'YES'
    end
  end
end
```

```bash
# Instalar pods
cd ios/App
pod install
cd ../..
```

#### **Método B: Download Manual (alternativo)**

1. Baixe Zebra Link-OS SDK: https://www.zebra.com/us/en/support-downloads/software/developer-tools/link-os-sdk.html
2. Arraste `ZSDK_API.xcframework` para o projeto no Xcode
3. Embed & Sign em Build Phases

---

### **PASSO 1.4: Configurar Permissões iOS**

Edite `ios/App/App/Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- ... outras keys ... -->
    
    <!-- Bluetooth Permissions -->
    <key>NSBluetoothAlwaysUsageDescription</key>
    <string>Tampa APP precisa de acesso Bluetooth para conectar impressoras Zebra e imprimir etiquetas de produtos</string>
    
    <key>NSBluetoothPeripheralUsageDescription</key>
    <string>Permite descobrir e conectar impressoras Zebra via Bluetooth</string>
    
    <!-- Background Modes (opcional, para manter conexão em background) -->
    <key>UIBackgroundModes</key>
    <array>
        <string>bluetooth-central</string>
    </array>
</dict>
</plist>
```

---

## 🔌 Fase 2: Plugin Capacitor para Zebra (3-5 dias)

### **PASSO 2.1: Criar Plugin Capacitor Customizado**

```bash
# Criar plugin local
mkdir -p plugins/zebra-printer
cd plugins/zebra-printer
npm init -y
```

**Estrutura do plugin:**
```
plugins/zebra-printer/
├── package.json
├── ios/
│   ├── Plugin/
│   │   ├── ZebraPrinterPlugin.swift
│   │   └── ZebraPrinterPlugin.m
│   └── Podfile
├── src/
│   ├── definitions.ts
│   └── index.ts
└── README.md
```

---

### **PASSO 2.2: Definir Interface TypeScript**

**`plugins/zebra-printer/src/definitions.ts`:**

```typescript
export interface ZebraPrinterPlugin {
  /**
   * Descobrir impressoras Bluetooth próximas
   */
  discoverPrinters(options: { timeout?: number }): Promise<{ printers: DiscoveredPrinter[] }>;

  /**
   * Conectar a uma impressora específica
   */
  connect(options: { address: string }): Promise<{ success: boolean }>;

  /**
   * Desconectar impressora atual
   */
  disconnect(): Promise<{ success: boolean }>;

  /**
   * Imprimir ZPL
   */
  printZPL(options: { zpl: string }): Promise<{ success: boolean; error?: string }>;

  /**
   * Obter status da impressora
   */
  getPrinterStatus(): Promise<PrinterStatus>;

  /**
   * Verificar se está conectado
   */
  isConnected(): Promise<{ connected: boolean }>;
}

export interface DiscoveredPrinter {
  name: string;
  address: string;
  friendlyName: string;
  model?: string;
}

export interface PrinterStatus {
  isConnected: boolean;
  isPaperOut: boolean;
  isPaused: boolean;
  isHeadOpen: boolean;
  batteryLevel?: number;
  temperature?: number;
}
```

**`plugins/zebra-printer/src/index.ts`:**

```typescript
import { registerPlugin } from '@capacitor/core';
import type { ZebraPrinterPlugin } from './definitions';

const ZebraPrinter = registerPlugin<ZebraPrinterPlugin>('ZebraPrinter', {
  web: () => import('./web').then(m => new m.ZebraPrinterWeb()),
});

export * from './definitions';
export { ZebraPrinter };
```

---

### **PASSO 2.3: Implementação iOS (Swift)**

**`plugins/zebra-printer/ios/Plugin/ZebraPrinterPlugin.swift`:**

```swift
import Foundation
import Capacitor
import ExternalAccessory

@objc(ZebraPrinterPlugin)
public class ZebraPrinterPlugin: CAPPlugin {
    private var connection: ZebraPrinterConnection?
    private var currentPrinter: DiscoveredPrinter?
    
    @objc func discoverPrinters(_ call: CAPPluginCall) {
        let timeout = call.getInt("timeout") ?? 10
        
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let manager = EAAccessoryManager.shared()
                let accessories = manager.connectedAccessories
                
                var printers: [[String: Any]] = []
                
                for accessory in accessories {
                    if accessory.protocolStrings.contains("com.zebra.rawport") {
                        printers.append([
                            "name": accessory.name,
                            "address": accessory.serialNumber,
                            "friendlyName": accessory.name,
                            "model": accessory.modelNumber ?? "Unknown"
                        ])
                    }
                }
                
                call.resolve(["printers": printers])
            } catch {
                call.reject("Discovery failed: \\(error.localizedDescription)")
            }
        }
    }
    
    @objc func connect(_ call: CAPPluginCall) {
        guard let address = call.getString("address") else {
            call.reject("Address is required")
            return
        }
        
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                // Criar conexão Bluetooth
                self.connection = MfiBtPrinterConnection(serialNumber: address)
                
                // Tentar abrir conexão
                let success = self.connection?.open() ?? false
                
                if success {
                    call.resolve(["success": true])
                } else {
                    call.reject("Failed to connect to printer")
                }
            } catch {
                call.reject("Connection error: \\(error.localizedDescription)")
            }
        }
    }
    
    @objc func disconnect(_ call: CAPPluginCall) {
        DispatchQueue.global(qos: .userInitiated).async {
            self.connection?.close()
            self.connection = nil
            call.resolve(["success": true])
        }
    }
    
    @objc func printZPL(_ call: CAPPluginCall) {
        guard let zpl = call.getString("zpl") else {
            call.reject("ZPL string is required")
            return
        }
        
        guard let connection = self.connection, connection.isConnected() else {
            call.reject("Printer not connected")
            return
        }
        
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                // Converter string para Data
                let data = zpl.data(using: .utf8)!
                
                // Enviar para impressora
                connection.write(data, error: nil)
                
                call.resolve(["success": true])
            } catch {
                call.reject("Print failed: \\(error.localizedDescription)")
            }
        }
    }
    
    @objc func getPrinterStatus(_ call: CAPPluginCall) {
        guard let connection = self.connection, connection.isConnected() else {
            call.reject("Printer not connected")
            return
        }
        
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                // Enviar comando SGD para obter status
                let statusZpl = "~HS"
                connection.write(statusZpl.data(using: .utf8)!, error: nil)
                
                // Ler resposta
                var response = Data()
                connection.read(&response, withTimeout: 1000, error: nil)
                
                // Parse status (simplificado)
                let status: [String: Any] = [
                    "isConnected": true,
                    "isPaperOut": false, // Parse real do response
                    "isPaused": false,
                    "isHeadOpen": false
                ]
                
                call.resolve(status)
            } catch {
                call.reject("Failed to get status: \\(error.localizedDescription)")
            }
        }
    }
    
    @objc func isConnected(_ call: CAPPluginCall) {
        let connected = self.connection?.isConnected() ?? false
        call.resolve(["connected": connected])
    }
}
```

---

### **PASSO 2.4: Registrar Plugin no Capacitor**

**`plugins/zebra-printer/ios/Plugin/ZebraPrinterPlugin.m`:**

```objc
#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(ZebraPrinterPlugin, "ZebraPrinter",
    CAP_PLUGIN_METHOD(discoverPrinters, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(connect, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(disconnect, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(printZPL, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getPrinterStatus, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(isConnected, CAPPluginReturnPromise);
)
```

---

## 💻 Fase 3: Integração no Tampa APP (5-7 dias)

### **PASSO 3.1: Instalar Plugin no Projeto**

**`package.json`:**
```json
{
  "dependencies": {
    "@capacitor/core": "^6.0.0",
    "@capacitor/ios": "^6.0.0",
    "zebra-printer": "file:./plugins/zebra-printer"
  }
}
```

```bash
npm install
npx cap sync
```

---

### **PASSO 3.2: Criar Service Adapter**

**`src/lib/zebraPrinterNative.ts` (NOVO):**

```typescript
import { ZebraPrinter, type DiscoveredPrinter, type PrinterStatus } from 'zebra-printer';
import type { ZebraPrinterConfig } from '@/types/zebraPrinter';

export class ZebraPrinterNativeService {
  private static instance: ZebraPrinterNativeService;
  private currentPrinter: ZebraPrinterConfig | null = null;
  private isConnectedState = false;

  private constructor() {}

  static getInstance(): ZebraPrinterNativeService {
    if (!ZebraPrinterNativeService.instance) {
      ZebraPrinterNativeService.instance = new ZebraPrinterNativeService();
    }
    return ZebraPrinterNativeService.instance;
  }

  /**
   * Descobrir impressoras Bluetooth
   */
  async discoverPrinters(timeout = 10): Promise<DiscoveredPrinter[]> {
    try {
      const result = await ZebraPrinter.discoverPrinters({ timeout });
      return result.printers;
    } catch (error) {
      console.error('Discovery error:', error);
      throw new Error('Failed to discover printers');
    }
  }

  /**
   * Conectar a impressora
   */
  async connect(printer: ZebraPrinterConfig): Promise<boolean> {
    try {
      const address = printer.bluetoothAddress || printer.serialNumber;
      if (!address) {
        throw new Error('Printer address or serial number required');
      }

      const result = await ZebraPrinter.connect({ address });
      
      if (result.success) {
        this.currentPrinter = printer;
        this.isConnectedState = true;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Connection error:', error);
      this.isConnectedState = false;
      throw error;
    }
  }

  /**
   * Desconectar impressora
   */
  async disconnect(): Promise<void> {
    try {
      await ZebraPrinter.disconnect();
      this.currentPrinter = null;
      this.isConnectedState = false;
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  /**
   * Imprimir ZPL
   */
  async print(zpl: string): Promise<boolean> {
    if (!this.isConnectedState) {
      throw new Error('Printer not connected');
    }

    try {
      const result = await ZebraPrinter.printZPL({ zpl });
      return result.success;
    } catch (error) {
      console.error('Print error:', error);
      throw new Error(`Print failed: ${error}`);
    }
  }

  /**
   * Verificar status da impressora
   */
  async getStatus(): Promise<PrinterStatus> {
    try {
      return await ZebraPrinter.getPrinterStatus();
    } catch (error) {
      console.error('Status error:', error);
      throw error;
    }
  }

  /**
   * Verificar se está conectado
   */
  async isConnected(): Promise<boolean> {
    try {
      const result = await ZebraPrinter.isConnected();
      this.isConnectedState = result.connected;
      return result.connected;
    } catch (error) {
      this.isConnectedState = false;
      return false;
    }
  }

  /**
   * Obter impressora atual
   */
  getCurrentPrinter(): ZebraPrinterConfig | null {
    return this.currentPrinter;
  }
}
```

---

### **PASSO 3.3: Atualizar zebraPrinterManager**

**`src/lib/zebraPrinterManager.ts` (MODIFICAR):**

```typescript
import { Capacitor } from '@capacitor/core';
import { ZebraPrinterNativeService } from './zebraPrinterNative';
// ... imports existentes

export class ZebraPrinterManager {
  private static instance: ZebraPrinterManager;
  private nativeService?: ZebraPrinterNativeService;

  private constructor() {
    this.loadPrinters();
    
    // Detectar se está rodando como app nativo
    if (Capacitor.isNativePlatform()) {
      this.nativeService = ZebraPrinterNativeService.getInstance();
    }
  }

  /**
   * Conectar a impressora (usa SDK nativo se disponível)
   */
  async connect(printerId: string): Promise<ConnectionResult> {
    const printer = this.printers.get(printerId);
    if (!printer) {
      return {
        success: false,
        error: 'Printer not found',
        connection: null
      };
    }

    try {
      // Se for app nativo, usar SDK Zebra
      if (this.nativeService && Capacitor.isNativePlatform()) {
        const connected = await this.nativeService.connect(printer);
        
        if (connected) {
          // Atualizar status no banco
          await this.updatePrinterStatus(printerId, 'ready');
          
          return {
            success: true,
            connection: null, // Não usa WebSocket
            printer,
            message: 'Connected via Zebra SDK'
          };
        }
      }

      // Fallback: WebSocket (para web/desktop)
      return await this.connectViaWebSocket(printer);
    } catch (error) {
      console.error('Connection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        connection: null
      };
    }
  }

  /**
   * Imprimir (usa SDK nativo se disponível)
   */
  async print(job: ZebraPrintJob): Promise<PrintJobResult> {
    try {
      // Se for app nativo, usar SDK
      if (this.nativeService && Capacitor.isNativePlatform()) {
        const isConnected = await this.nativeService.isConnected();
        
        if (!isConnected) {
          const printer = this.nativeService.getCurrentPrinter();
          if (printer) {
            await this.nativeService.connect(printer);
          } else {
            throw new Error('No printer configured');
          }
        }

        const success = await this.nativeService.print(job.zpl);
        
        if (success) {
          await this.recordPrintJob(job, 'completed');
          return {
            success: true,
            job,
            message: 'Printed successfully via Zebra SDK'
          };
        }
      }

      // Fallback: WebSocket
      return await this.printViaWebSocket(job);
    } catch (error) {
      await this.recordPrintJob(job, 'failed', error instanceof Error ? error.message : undefined);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Print failed',
        job
      };
    }
  }

  // ... resto dos métodos existentes
}
```

---

## 📱 Fase 4: Testes e Ajustes (3-5 dias)

### **PASSO 4.1: Build e Deploy no iPhone**

```bash
# Build do projeto
npm run build

# Sincronizar com iOS
npx cap sync ios

# Abrir no Xcode
npx cap open ios
```

**No Xcode:**
1. Conectar iPhone via USB
2. Selecionar seu iPhone como target
3. **Product → Build** (⌘B)
4. **Product → Run** (⌘R)

---

### **PASSO 4.2: Testar Funcionalidades**

**Checklist de Testes:**

```
□ Descoberta de impressoras
  - Abrir Tampa APP
  - Settings → Impressoras → Adicionar
  - Deve listar ZD411 Bluetooth próximas

□ Conexão
  - Tocar na impressora
  - Aguardar "Conectado"
  - Status deve mudar para "Ready"

□ Impressão de teste
  - Clicar em "Testar Impressora"
  - Etiqueta deve imprimir imediatamente

□ Impressão real
  - Labeling → Produto → Print
  - Etiqueta completa deve imprimir

□ Desconexão
  - Desligar Bluetooth iPhone
  - App deve mostrar erro apropriado
  - Religar Bluetooth
  - Deve reconectar automaticamente

□ Background
  - Imprimir etiqueta
  - Minimizar app (Home)
  - Aguardar 30s
  - Voltar ao app
  - Imprimir novamente
  - Deve funcionar normalmente
```

---

### **PASSO 4.3: Debug de Problemas Comuns**

#### **Problema: "Bluetooth permission denied"**

**Solução:** Verificar Info.plist tem as permissões corretas:
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Tampa APP precisa de acesso Bluetooth...</string>
```

#### **Problema: "Printer not found"**

**Solução:**
1. Verificar Bluetooth iPhone está ON
2. Impressora está ligada
3. Impressora já foi pareada nas Configurações → Bluetooth
4. Zebra SDK precisa de "Made for iPhone" (MFi) certified printers

#### **Problema: "Connection timeout"**

**Solução:**
```swift
// Aumentar timeout na conexão
connection?.open(withTimeout: 10000) // 10 segundos
```

---

## 🚀 Fase 5: Publicação (2-3 dias)

### **PASSO 5.1: Preparar para App Store**

**No Xcode:**

1. **Configurar Bundle ID único:**
   ```
   Target → General → Identity
   Bundle Identifier: com.tampaapp.app
   ```

2. **Configurar versão e build:**
   ```
   Version: 1.0.0
   Build: 1
   ```

3. **Adicionar ícones:**
   ```
   Assets.xcassets → AppIcon
   Adicionar ícones 1024x1024, 180x180, etc.
   ```

4. **Configurar capabilities:**
   ```
   Target → Signing & Capabilities
   - Bluetooth LE ✓
   - Background Modes → Bluetooth central ✓
   ```

5. **Configurar Team:**
   ```
   Signing → Team: Sua Apple Developer Account
   ```

---

### **PASSO 5.2: Testar Build Release**

```bash
# Build de release
Product → Scheme → Edit Scheme
Run → Build Configuration → Release

# Testar no device
Product → Build For → Running
```

---

### **PASSO 5.3: App Store Connect**

1. **Criar App:**
   - https://appstoreconnect.apple.com
   - My Apps → + → New App
   - Nome: Tampa APP
   - Language: Portuguese
   - Bundle ID: com.tampaapp.app

2. **Configurar Metadata:**
   ```
   Name: Tampa APP
   Subtitle: Sistema de Etiquetagem Profissional
   Description: Tampa APP é o sistema completo...
   Keywords: restaurant, food safety, labeling, zebra
   Category: Business
   ```

3. **Screenshots:**
   - iPhone 6.7" (16 Pro Max): mínimo 3 screenshots
   - iPhone 6.5" (15 Pro Max): mínimo 3 screenshots

4. **Privacy Policy:**
   - URL: https://tampaapp.vercel.app/privacy

---

### **PASSO 5.4: Upload para TestFlight**

```bash
# No Xcode
Product → Archive

# Aguardar build completar

# Organizer abre automaticamente
Window → Organizer → Archives

# Selecionar archive → Distribute App
→ App Store Connect
→ Upload
→ Aguardar processamento (5-10 min)
```

**TestFlight:**
1. App Store Connect → TestFlight
2. Adicionar testers internos/externos
3. Enviar convites
4. Testar por 1-2 semanas

---

### **PASSO 5.5: Submeter para Review**

1. **App Store Connect → App Information**
2. **Prepare for Submission**
3. **Fill required fields:**
   - Screenshots ✓
   - Description ✓
   - Keywords ✓
   - Support URL ✓
   - Privacy Policy ✓
4. **Add for Review**
5. **Submit for Review**

**Tempo de review:** 1-3 dias geralmente

---

## 📊 Comparação: Antes vs. Depois

| Feature | ANTES (WebSocket PWA) | DEPOIS (App Nativo) |
|---------|---------------------|-------------------|
| **Conexão Bluetooth** | ❌ Requer Zebra Setup App aberto | ✅ Direta via SDK |
| **Multitasking** | ❌ Perde conexão ao trocar app | ✅ Mantém conexão em background |
| **Offline** | ❌ Requer internet (PWA) | ✅ Funciona 100% offline |
| **Performance** | 🟡 Depende de browser | ✅ Nativo, mais rápido |
| **Instalação** | ✅ Apenas URL | 🟡 Precisa App Store |
| **Atualizações** | ✅ Instantâneas (web) | 🟡 Precisa submeter review |
| **Distribuição** | ✅ Aberta (web) | 🟡 App Store (controle Apple) |

---

## 💰 Custos

| Item | Custo |
|------|-------|
| **Apple Developer Program** | $99/ano (obrigatório para App Store) |
| **Zebra Link-OS SDK** | Grátis |
| **Capacitor** | Grátis (open-source) |
| **Desenvolvimento** | Tempo da equipe (~2-3 semanas) |

---

## 🎯 Timeline Final

```
SEMANA 1:
├─ Dia 1-2: Setup Capacitor + iOS
├─ Dia 3-4: Criar plugin Zebra
└─ Dia 5: Integrar no Tampa APP

SEMANA 2:
├─ Dia 1-3: Testes no iPhone real
├─ Dia 4: Ajustes e correções
└─ Dia 5: Preparar para App Store

SEMANA 3:
├─ Dia 1-2: TestFlight beta testing
├─ Dia 3: Submeter para review
└─ Dia 4-5: Aguardar aprovação

RESULTADO: App iOS nativo funcionando! 🎉
```

---

## 📝 Próximos Passos Imediatos

1. **Criar conta Apple Developer** (se ainda não tem)
2. **Instalar Xcode** (última versão)
3. **Executar PASSO 1.1** (instalar Capacitor)
4. **Testar build iOS** básico
5. **Me confirmar que funcionou** para prosseguir com Zebra SDK

---

Quer que eu comece implementando alguma fase específica? Posso criar os arquivos de código prontos! 🚀

**Última atualização:** 20 de Janeiro de 2026  
**Versão:** 1.0
