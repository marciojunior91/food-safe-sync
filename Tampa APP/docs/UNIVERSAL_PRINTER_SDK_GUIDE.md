# 🖨️ Universal Printer SDK - Complete Guide

## Overview

The Universal Printer SDK provides flexible, easy-to-use printer support for Tampa APP with multi-connection capabilities. Perfect for **Zebra D411 with Bluetooth-to-TCP adapters** and any thermal printer!

## 🌟 Key Features

### ✅ Multi-Connection Support
- **Bluetooth LE** (Web Bluetooth API)
- **Bluetooth Classic** (via bridge adapter)
- **TCP/IP** (direct network connection)
- **WiFi** (network printer)
- **Bridge Adapters** (Bluetooth-to-TCP/IP converters)
- **Automatic Fallback** (tries multiple connections)

### ✅ Multi-Protocol Support
- **ZPL** (Zebra Programming Language)
- **ESC/POS** (Epson, Star, Citizen, etc.)
- **CPCL** (Citizen Printer Command Language)
- **Auto-detection** based on printer model

### ✅ Easy Registration
- Simple UI wizard
- Auto-discovery (where supported)
- Save multiple printer profiles
- One-click switching between printers

---

## 🚀 Quick Start Guide

### For Zebra D411 with Bluetooth-to-TCP Adapter (Australia Client)

#### Step 1: Configure the Bridge Adapter

Your Bluetooth-to-TCP adapter converts the Zebra D411's Bluetooth LE to a network connection.

1. **Connect the adapter** to your Zebra D411 (follow adapter's instructions)
2. **Connect adapter to WiFi** (check adapter manual for setup)
3. **Note the adapter's IP address** (usually shown in adapter's app or web interface)
   - Example: `192.168.1.150`

#### Step 2: Configure Tampa APP

1. Open Tampa APP
2. Go to **Settings** → **Printer Configuration**
3. Select **"Universal Printer (Recommended)"**
4. Click **"Connection"** tab
5. Select **"Bridge Adapter"**
6. Enter:
   - **Bridge IP Address**: `192.168.1.150` (your adapter's IP)
   - **Bridge Port**: `9100` (default)
7. Click **"Advanced"** tab
8. Set:
   - **Model**: `D411` or `Zebra D411`
   - **Protocol**: `Auto-detect` (or `ZPL` for Zebra)
   - **DPI**: `203` (standard for D411)
9. Click **"Save Configuration"**

#### Step 3: Test Print

1. Create a label
2. Click **"Print"**
3. System will:
   - Connect to bridge adapter via WiFi
   - Bridge adapter sends to Zebra D411 via Bluetooth
   - Label prints! 🎉

---

## 📋 Connection Type Guide

### 1. TCP/IP (Direct Network)

**Best for:** Printers with built-in Ethernet/WiFi

```typescript
{
  connectionType: 'tcp-ip',
  connectionConfig: {
    ipAddress: '192.168.1.100',
    port: 9100,
    preferredConnection: 'tcp-ip',
    autoReconnect: true
  }
}
```

**Setup:**
1. Connect printer to network (Ethernet or WiFi)
2. Find printer's IP address (from printer's LCD or network scan)
3. Enter IP address in Tampa APP settings
4. Done!

---

### 2. WiFi (Wireless Network)

**Best for:** WiFi-enabled printers (Zebra ZD421, ZD611, etc.)

```typescript
{
  connectionType: 'wifi',
  connectionConfig: {
    ipAddress: '192.168.1.101',
    port: 9100,
    hostname: 'printer.local', // Optional mDNS
    preferredConnection: 'wifi'
  }
}
```

**Setup:**
1. Configure printer's WiFi settings (use Zebra Setup Utilities)
2. Note the assigned IP address
3. Enter in Tampa APP
4. Optional: Use hostname if printer supports mDNS/Bonjour

---

### 3. Bridge Adapter (Bluetooth-to-TCP)

**Best for:** BLE-only printers with adapter (PERFECT for your Zebra D411!)

```typescript
{
  connectionType: 'bridge',
  connectionConfig: {
    bridgeIpAddress: '192.168.1.150',
    bridgePort: 9100,
    bridgeMacAddress: '00:11:22:33:44:55', // Optional
    preferredConnection: 'bridge',
    autoReconnect: true
  }
}
```

**Compatible Bridge Devices:**
- Zebra ZebraNet Bridge
- USR-BLE101 (Bluetooth to WiFi/Ethernet)
- HC-05/HC-06 modules with WiFi bridge
- ESP32-based Bluetooth-WiFi bridges
- Commercial Bluetooth print servers

**Setup:**
1. Pair adapter with Zebra D411 (via adapter's app)
2. Connect adapter to WiFi network
3. Find adapter's IP address
4. Enter in Tampa APP as "Bridge Adapter"
5. System routes: Tampa APP → WiFi → Bridge → Bluetooth → Printer

---

### 4. Bluetooth LE (Direct)

**Best for:** Direct Bluetooth connection from device to printer

```typescript
{
  connectionType: 'bluetooth-le',
  connectionConfig: {
    bluetoothDeviceName: 'D411-1234', // Optional
    bluetoothServiceUUID: '49535343-fe7d-4ae5-8fa9-9fafd205e455',
    bluetoothCharacteristicUUID: '49535343-8841-43f4-a8d4-ecbe34729bb3',
    preferredConnection: 'bluetooth-le'
  }
}
```

**Limitations:**
- ⚠️ iOS: Very limited Web Bluetooth support
- ✅ Android: Full support via Chrome
- ✅ Desktop: Full support (Chrome, Edge)

**Setup:**
1. Make sure printer is in pairing mode
2. Click "Connect" in Tampa APP
3. Select printer from list
4. Done!

---

### 5. Bluetooth Classic (via Bridge)

**Best for:** Bluetooth Classic printers with bridge adapter

```typescript
{
  connectionType: 'bluetooth-classic',
  connectionConfig: {
    bridgeIpAddress: '192.168.1.151', // Bridge that supports Classic
    bridgePort: 9100,
    preferredConnection: 'bluetooth-classic'
  }
}
```

**Note:** Web browsers can't connect to Bluetooth Classic directly. Use a bridge adapter.

---

## 🔧 Protocol Configuration

### Auto-Detect (Recommended)

```typescript
{
  protocol: 'auto',
  model: 'Zebra D411'
}
```

The system will detect:
- **Zebra** models → ZPL
- **Epson/Star/Citizen** → ESC/POS
- Unknown → ZPL (default)

### Manual Selection

```typescript
{
  protocol: 'zpl',  // or 'escpos', 'cpcl', 'tspl'
}
```

**When to use manual:**
- Protocol detection fails
- Using custom printer driver
- Testing different protocols

---

## 🎯 Advanced Features

### Connection Fallback Strategy

Universal Printer automatically tries multiple connections:

```typescript
{
  connectionConfig: {
    preferredConnection: 'bridge',
    fallbackConnections: ['tcp-ip', 'bluetooth-le', 'wifi'],
    autoReconnect: true,
    timeout: 5000
  }
}
```

**Flow:**
1. Try bridge adapter first
2. If fails, try direct TCP/IP
3. If fails, try Bluetooth LE
4. If fails, try WiFi
5. Report error if all fail

### Automatic Reconnection

If connection drops during printing:
1. System detects disconnection
2. Waits 2 seconds
3. Attempts to reconnect
4. Retries up to 3 times
5. Shows error if can't reconnect

### Multiple Printer Profiles

Save different configurations:

```typescript
// Kitchen Printer (Zebra D411 with bridge)
{
  id: 'printer-1',
  name: 'Kitchen Zebra D411',
  connectionType: 'bridge',
  connectionConfig: { bridgeIpAddress: '192.168.1.150' }
}

// Bar Printer (Epson USB)
{
  id: 'printer-2',
  name: 'Bar Epson TM-T88',
  connectionType: 'usb',
  protocol: 'escpos'
}
```

Switch between printers instantly in the UI!

---

## 📱 Device Compatibility

### ✅ Fully Supported
- **Android Tablets** (Chrome, Edge) - All connection types
- **Windows PCs** (Chrome, Edge) - All connection types
- **Mac** (Chrome, Edge) - All connection types
- **iPad/iPhone** (Safari) - Bridge/TCP/IP only (no direct Bluetooth)

### ⚠️ Limited Support
- **iOS Web** - No direct Bluetooth LE
  - **Solution:** Use bridge adapter (TCP/IP)
  - **Alternative:** Use Android tablet

---

## 🛠️ Troubleshooting

### Connection Issues

#### "Failed to connect via bridge"

**Check:**
1. Bridge adapter is powered on
2. Bridge is connected to WiFi (same network as Tampa APP device)
3. IP address is correct
4. Port 9100 is not blocked by firewall
5. Printer is paired with bridge adapter

**Test:**
```bash
# From terminal/command prompt
ping 192.168.1.150

# Check if port is open
telnet 192.168.1.150 9100
```

#### "Bluetooth device not found"

**Check:**
1. Printer is in pairing mode (check printer manual)
2. Printer is not already paired with another device
3. Browser supports Web Bluetooth (Chrome/Edge on Android/Desktop)
4. Location permission is granted (required for Bluetooth on Android)

#### "Print sent but nothing prints"

**Check:**
1. Printer protocol is correct (ZPL for Zebra, ESC/POS for others)
2. Paper is loaded correctly
3. Printer is not in pause/offline mode
4. Darkness setting is high enough (increase to 25-30)

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Tampa APP (React)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │         UniversalPrinter Driver                  │  │
│  │  • Multi-connection support                      │  │
│  │  • Protocol auto-detection                       │  │
│  │  • Connection fallback                           │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│                          ▼                              │
│         ┌────────────────┴────────────────┐            │
│         │                                  │            │
│    ┌────▼─────┐                      ┌────▼─────┐     │
│    │Bluetooth │                      │TCP/IP/   │     │
│    │LE (Web   │                      │WiFi      │     │
│    │Bluetooth)│                      │(WebSocket│     │
│    └────┬─────┘                      └────┬─────┘     │
│         │                                  │            │
└─────────┼──────────────────────────────────┼───────────┘
          │                                  │
          ▼                                  ▼
    ┌──────────┐                    ┌─────────────┐
    │ Printer  │                    │Bridge Adapter│
    │(Direct   │                    │  (BT to TCP) │
    │Bluetooth)│                    └──────┬───────┘
    └──────────┘                           │
                                           ▼
                                    ┌──────────────┐
                                    │   Printer    │
                                    │  (Zebra D411)│
                                    └──────────────┘
```

### Code Structure

```
src/
├── types/
│   └── printer.ts                 # Type definitions (enhanced)
├── lib/
│   └── printers/
│       ├── UniversalPrinter.ts    # NEW: Multi-connection driver
│       ├── ZebraPrinter.ts        # Legacy: TCP/IP only
│       ├── BluetoothUniversalPrinter.ts  # Bluetooth-only
│       ├── PDFPrinter.ts          # PDF export
│       ├── GenericPrinter.ts      # Browser print
│       └── PrinterFactory.ts      # Factory pattern (updated)
├── hooks/
│   └── usePrinter.ts              # React hook (compatible)
└── components/
    └── labels/
        ├── PrinterSettings.tsx            # Original UI
        └── EnhancedPrinterSettings.tsx    # NEW: Advanced UI
```

---

## 📖 API Reference

### PrinterSettings Interface

```typescript
interface PrinterSettings {
  id?: string;                    // Unique identifier
  type: PrinterType;              // 'universal', 'bluetooth', 'zebra', etc.
  name: string;                   // Display name
  model?: string;                 // e.g., 'D411', 'ZD421'
  manufacturer?: string;          // e.g., 'Zebra', 'Epson'
  
  protocol?: PrinterProtocol;     // 'auto', 'zpl', 'escpos', 'cpcl'
  connectionType?: ConnectionType; // 'bridge', 'tcp-ip', 'bluetooth-le', etc.
  
  paperWidth: number;             // mm
  paperHeight: number;            // mm
  darkness?: number;              // 0-30 (Zebra)
  speed?: number;                 // 2-12 (Zebra)
  dpi?: number;                   // 203, 300, 600
  defaultQuantity: number;        // Default labels per print
  
  connectionConfig?: ConnectionConfig;
}
```

### ConnectionConfig Interface

```typescript
interface ConnectionConfig {
  // Network
  ipAddress?: string;
  port?: number;
  hostname?: string;
  
  // Bridge
  bridgeIpAddress?: string;
  bridgePort?: number;
  bridgeMacAddress?: string;
  
  // Bluetooth
  bluetoothDeviceId?: string;
  bluetoothDeviceName?: string;
  bluetoothServiceUUID?: string;
  bluetoothCharacteristicUUID?: string;
  
  // USB
  usbVendorId?: string;
  usbProductId?: string;
  
  // Behavior
  preferredConnection?: ConnectionType;
  fallbackConnections?: ConnectionType[];
  autoReconnect?: boolean;
  timeout?: number;
}
```

### Usage Example

```typescript
import { usePrinter } from '@/hooks/usePrinter';

function MyComponent() {
  const { printer, settings, print, saveSettings } = usePrinter();
  
  const handleConfigure = () => {
    saveSettings({
      type: 'universal',
      name: 'Zebra D411 (Bridge)',
      model: 'D411',
      manufacturer: 'Zebra',
      protocol: 'auto',
      connectionType: 'bridge',
      paperWidth: 102,
      paperHeight: 152,
      darkness: 20,
      speed: 4,
      dpi: 203,
      defaultQuantity: 1,
      connectionConfig: {
        bridgeIpAddress: '192.168.1.150',
        bridgePort: 9100,
        preferredConnection: 'bridge',
        fallbackConnections: ['tcp-ip', 'bluetooth-le'],
        autoReconnect: true,
        timeout: 5000
      }
    });
  };
  
  const handlePrint = async () => {
    const success = await print({
      productName: 'Grilled Chicken',
      prepDate: '2026-02-11',
      expiryDate: '2026-02-14',
      // ... more data
    });
    
    if (success) {
      console.log('✅ Print successful!');
    }
  };
  
  return (
    <div>
      <button onClick={handleConfigure}>Configure Printer</button>
      <button onClick={handlePrint}>Print Label</button>
    </div>
  );
}
```

---

## ✅ Migration Guide

### From Old System to Universal Printer

#### Before (Legacy ZebraPrinter):

```typescript
{
  type: 'zebra',
  name: 'Zebra Network',
  ipAddress: '192.168.1.100',
  port: 9100,
  paperWidth: 102,
  paperHeight: 152
}
```

#### After (UniversalPrinter):

```typescript
{
  type: 'universal',
  name: 'Zebra D411 (Bridge)',
  model: 'D411',
  protocol: 'auto',
  connectionType: 'bridge',
  paperWidth: 102,
  paperHeight: 152,
  connectionConfig: {
    bridgeIpAddress: '192.168.1.100',
    bridgePort: 9100,
    preferredConnection: 'bridge',
    fallbackConnections: ['tcp-ip']
  }
}
```

**Benefits:**
- ✅ Automatic protocol detection
- ✅ Connection fallback support
- ✅ Better error handling
- ✅ Works with bridge adapters
- ✅ Future-proof architecture

---

## 🎓 Best Practices

### 1. Always Use Auto-Detect Protocol

Unless you have a specific reason, use `protocol: 'auto'`. The system is smart!

### 2. Configure Fallback Connections

```typescript
{
  preferredConnection: 'bridge',
  fallbackConnections: ['tcp-ip', 'bluetooth-le']
}
```

This ensures printing works even if primary connection fails.

### 3. Save Multiple Printer Profiles

For restaurants with multiple printers (kitchen, bar, expo), save separate profiles:

```typescript
// Kitchen
localStorage.setItem('printer_settings_kitchen', JSON.stringify(kitchenConfig));

// Bar
localStorage.setItem('printer_settings_bar', JSON.stringify(barConfig));
```

Use the `usePrinter('kitchen')` hook with context parameter.

### 4. Test Connection Before Production

Always test the printer setup:
1. Save configuration
2. Print a test label
3. Verify label quality
4. Adjust darkness/speed if needed

### 5. Keep Bridge Adapter Firmware Updated

Check your bridge adapter manufacturer's website for firmware updates periodically.

---

## 📞 Support

### Common Questions

**Q: Which connection type should I use?**
A: For Zebra D411 in Australia with bridge adapter, use **"Bridge Adapter"** connection type.

**Q: My bridge adapter IP keeps changing**
A: Configure a **static IP** in your router's DHCP settings for the bridge adapter's MAC address.

**Q: Can I use multiple printers?**
A: Yes! Save different printer profiles and switch between them in the UI.

**Q: Does this work offline?**
A: Yes, once configured. The printer connects directly via your local network (no internet required).

---

## 🚀 Future Enhancements

Planned features:
- [ ] Automatic printer discovery (network scan)
- [ ] Cloud print service integration
- [ ] USB printer support (requires native app)
- [ ] Printer status monitoring (paper level, errors)
- [ ] Print queue management UI
- [ ] Label template designer
- [ ] Multi-language label support

---

## 📄 License

Part of Tampa APP - Food Safety Management System

---

**Need Help?** Contact the development team or check the main Tampa APP documentation.
