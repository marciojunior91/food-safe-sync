# 🏗️ Universal Printer SDK - Visual Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Tampa APP (React)                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         Enhanced Printer Settings UI (Component)           │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                │ │
│  │  │  Basic   │  │Connection│  │ Advanced │                │ │
│  │  │ Settings │  │ Settings │  │ Settings │                │ │
│  │  └──────────┘  └──────────┘  └──────────┘                │ │
│  └──────────────────────┬─────────────────────────────────────┘ │
│                         │                                        │
│  ┌──────────────────────▼─────────────────────────────────────┐ │
│  │               usePrinter Hook (React)                       │ │
│  │  • Load/Save Settings                                       │ │
│  │  • Print Requests                                           │ │
│  │  • State Management                                         │ │
│  └──────────────────────┬─────────────────────────────────────┘ │
│                         │                                        │
│  ┌──────────────────────▼─────────────────────────────────────┐ │
│  │              PrinterFactory (Factory Pattern)               │ │
│  │  Creates the right printer based on type:                  │ │
│  │  • UniversalPrinter (NEW) ⭐                               │ │
│  │  • BluetoothUniversalPrinter                               │ │
│  │  • ZebraPrinter (Legacy)                                    │ │
│  │  • PDFPrinter                                               │ │
│  │  • GenericPrinter                                           │ │
│  └──────────────────────┬─────────────────────────────────────┘ │
│                         │                                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  UniversalPrinter Driver                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Connection Strategy (Fallback Chain)           │  │
│  │  1. Try Preferred Connection                              │  │
│  │  2. If fail → Try Fallback #1                            │  │
│  │  3. If fail → Try Fallback #2                            │  │
│  │  4. If fail → Report Error                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Protocol Detection (Auto)                      │  │
│  │  • Zebra → ZPL                                           │  │
│  │  • Epson/Star/Citizen → ESC/POS                          │  │
│  │  • TSC → TSPL                                            │  │
│  │  • Unknown → ZPL (default)                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Command Generation                             │  │
│  │  • generateZPL() → Zebra commands                        │  │
│  │  • generateESCPOS() → ESC/POS commands                   │  │
│  │  • Include QR codes, barcodes, formatting                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────┬────────────┬────────────┬────────────┬───────────┘
               │            │            │            │
               ▼            ▼            ▼            ▼
      ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
      │ Bluetooth  │ │  TCP/IP  │ │   WiFi   │ │  Bridge  │
      │    LE      │ │ Network  │ │ Network  │ │ Adapter  │⭐
      └─────┬──────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
            │             │            │            │
            ▼             ▼            ▼            ▼
     ┌──────────┐  ┌──────────┐ ┌──────────┐ ┌──────────┐
     │ Printer  │  │ Printer  │ │ Printer  │ │  Bridge  │
     │ (Direct) │  │ (Direct) │ │ (Direct) │ │  Device  │
     └──────────┘  └──────────┘ └──────────┘ └────┬─────┘
                                                   │
                                                   │ Bluetooth
                                                   ▼
                                            ┌──────────────┐
                                            │   Printer    │
                                            │  (Zebra D411)│
                                            └──────────────┘
```

---

## Australia Client's Setup (Zebra D411 + Bridge)

```
┌──────────────────────────────────────────────────────────────────┐
│                          TAMPA APP                                │
│                     (iPad/Tablet/Phone/PC)                        │
│                                                                   │
│  Create Label → Click Print → Label Data                        │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │ WiFi Network (192.168.1.x)
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              UniversalPrinter Driver (in browser)                 │
│  • Detects: Zebra D411 → Use ZPL protocol                       │
│  • Connection: Bridge Adapter (TCP/IP)                           │
│  • IP: 192.168.1.150:9100                                        │
│  • Generates ZPL commands with QR code                           │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │ WebSocket/TCP
                       │ (to bridge IP:port)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│          BLUETOOTH-TO-TCP BRIDGE ADAPTER                          │
│          (Your new device - e.g., USR-BLE101)                     │
│                                                                   │
│  Receives:  ZPL commands via TCP (port 9100)                     │
│  Converts:  TCP → Bluetooth packets                              │
│  Sends:     To paired Zebra D411                                 │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │ Bluetooth LE
                       │ (paired connection)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                   ZEBRA D411 THERMAL PRINTER                      │
│                                                                   │
│  Receives:  ZPL commands via Bluetooth                           │
│  Processes: Generates label bitmap                               │
│  Prints:    Thermal label with:                                  │
│             • Product name                                        │
│             • Dates (prep/expiry)                                │
│             • QR code                                             │
│             • Allergens                                           │
│  Result:    📄 Physical label!                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Connection Flow with Fallback

```
┌─────────────────────────────────────────────────────────────┐
│                    Connection Attempt                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │ 1. Try Bridge  │ ← Preferred (configured)
              │ (192.168.1.150)│
              └────────┬───────┘
                       │
                ┌──────▼─────┐
                │  Success?  │
                └──┬──────┬──┘
                   │      │
              Yes  │      │ No
                   │      │
                   ▼      ▼
           ┌──────────┐  ┌─────────────────┐
           │   USE    │  │ 2. Try TCP/IP   │ ← Fallback #1
           │  BRIDGE  │  │ (direct to 9100)│
           └──────────┘  └────────┬────────┘
                                  │
                           ┌──────▼─────┐
                           │  Success?  │
                           └──┬──────┬──┘
                              │      │
                         Yes  │      │ No
                              │      │
                              ▼      ▼
                      ┌──────────┐  ┌──────────────────┐
                      │   USE    │  │ 3. Try Bluetooth │ ← Fallback #2
                      │  TCP/IP  │  │ (direct pairing) │
                      └──────────┘  └────────┬─────────┘
                                             │
                                      ┌──────▼─────┐
                                      │  Success?  │
                                      └──┬──────┬──┘
                                         │      │
                                    Yes  │      │ No
                                         │      │
                                         ▼      ▼
                                 ┌──────────┐  ┌────────────┐
                                 │   USE    │  │   ERROR    │
                                 │BLUETOOTH │  │  MESSAGE   │
                                 └──────────┘  └────────────┘
```

---

## Data Flow (Label Printing)

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: User Creates Label                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Tampa APP UI:                                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Product: Grilled Chicken                                │  │
│  │ Prep Date: 2026-02-11                                   │  │
│  │ Expiry: 2026-02-14                                      │  │
│  │ Prepared By: Chef John                                  │  │
│  │ Allergens: None                                         │  │
│  │                        [Print] ← User clicks            │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: usePrinter Hook Processes                               │
├─────────────────────────────────────────────────────────────────┤
│  • Validates label data                                         │
│  • Saves to Supabase database → Gets labelId                   │
│  • Calls printer.print(labelData)                              │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: UniversalPrinter Converts Data                          │
├─────────────────────────────────────────────────────────────────┤
│  • Detects protocol: Zebra D411 → ZPL                          │
│  • Generates ZPL commands:                                      │
│    ^XA                                                          │
│    ^FO50,30^A0N,40,40^FDGrilled Chicken^FS                     │
│    ^FO50,120^A0N,20,20^FDPrep: 2026-02-11^FS                  │
│    ^FO50,150^A0N,20,20^FDExp: 2026-02-14^FS                   │
│    ^FO450,50^BQN,2,6^FDQA,{labelId:"123",...}^FS              │
│    ^XZ                                                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Send to Printer via Bridge                              │
├─────────────────────────────────────────────────────────────────┤
│  • Connection: TCP/IP to bridge (192.168.1.150:9100)          │
│  • Send: ZPL commands as byte array                            │
│  • Bridge converts: TCP → Bluetooth packets                     │
│  • Bridge sends to: Zebra D411 via Bluetooth                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Zebra D411 Prints                                       │
├─────────────────────────────────────────────────────────────────┤
│  • Receives ZPL via Bluetooth                                   │
│  • Processes commands                                           │
│  • Prints thermal label                                         │
│  • Result: Physical label! 🎉                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
src/
├── types/
│   └── printer.ts
│       ├── PrinterType (5 types including 'universal')
│       ├── ConnectionType (7 types including 'bridge')
│       ├── PrinterProtocol (5 protocols + 'auto')
│       ├── ConnectionConfig (all connection settings)
│       ├── PrinterSettings (enhanced interface)
│       ├── PrinterDriver (interface)
│       └── DiscoveredPrinter (for discovery)
│
├── lib/
│   └── printers/
│       ├── PrinterFactory.ts
│       │   ├── createPrinter() → Returns correct driver
│       │   ├── getAvailablePrinters() → List for UI
│       │   └── getDefaultSettings() → Defaults per type
│       │
│       ├── UniversalPrinter.ts ⭐ NEW
│       │   ├── connect() → Multi-connection with fallback
│       │   ├── connectTCP() → Network/bridge connection
│       │   ├── connectBluetoothLE() → Direct BLE
│       │   ├── detectProtocol() → Auto-detect from model
│       │   ├── generateZPL() → Zebra commands
│       │   ├── generateESCPOS() → ESC/POS commands
│       │   ├── print() → Main print method
│       │   └── sendToPrinter() → Route to correct connection
│       │
│       ├── ZebraPrinter.ts (Legacy - still works)
│       ├── BluetoothUniversalPrinter.ts (BT-only)
│       ├── PDFPrinter.ts (PDF export)
│       └── GenericPrinter.ts (Browser print)
│
├── hooks/
│   └── usePrinter.ts
│       ├── loadSettings() → From localStorage
│       ├── saveSettings() → To localStorage + dispatch event
│       ├── print() → Single label
│       ├── printBatch() → Multiple labels
│       └── changePrinter() → Switch printer type
│
└── components/
    └── labels/
        ├── PrinterSettings.tsx (Original - still works)
        │
        └── EnhancedPrinterSettings.tsx ⭐ NEW
            ├── Tab 1: Basic Settings
            │   ├── Printer type selector
            │   ├── Model/manufacturer
            │   ├── Protocol selector
            │   └── Paper size
            │
            ├── Tab 2: Connection Settings
            │   ├── Visual connection type selector
            │   ├── Bridge adapter config ⭐
            │   ├── Network config
            │   ├── Bluetooth config
            │   └── Fallback strategy display
            │
            └── Tab 3: Advanced Settings
                ├── Print quality (darkness, speed, DPI)
                ├── Connection timeout
                ├── Auto-reconnect toggle
                ├── Advanced Bluetooth UUIDs
                └── Configuration summary
```

---

## Settings Storage Structure

```typescript
// localStorage key: 'printer_settings' (or 'printer_settings_<context>')

{
  // Basic Info
  id: "printer-001",
  type: "universal",
  name: "Zebra D411 - Kitchen",
  model: "D411",
  manufacturer: "Zebra",
  
  // Protocol
  protocol: "auto", // or "zpl", "escpos"
  
  // Connection
  connectionType: "bridge", // ⭐
  connectionConfig: {
    // Bridge-specific (Australia client)
    bridgeIpAddress: "192.168.1.150",
    bridgePort: 9100,
    bridgeMacAddress: "00:11:22:33:44:55",
    
    // Network (fallback)
    ipAddress: "192.168.1.151",
    port: 9100,
    
    // Behavior
    preferredConnection: "bridge",
    fallbackConnections: ["tcp-ip", "bluetooth-le"],
    autoReconnect: true,
    timeout: 5000
  },
  
  // Paper
  paperWidth: 102,
  paperHeight: 152,
  
  // Quality
  darkness: 20,
  speed: 4,
  dpi: 203,
  
  // Behavior
  defaultQuantity: 1
}
```

---

## Error Handling Flow

```
┌────────────────────────────────────────────────────────┐
│              Print Request from User                    │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │  Validate Data │
            └────────┬───────┘
                     │
              ┌──────▼──────┐
              │ Valid Data? │
              └──┬───────┬──┘
                 │       │
            Yes  │       │ No
                 │       │
                 ▼       ▼
         ┌──────────┐  ┌───────────────────────┐
         │ Try Print│  │ Show Validation Error │
         └────┬─────┘  │ "Missing required..."  │
              │        └───────────────────────┘
              ▼
     ┌────────────────┐
     │ Try Connection │
     └────────┬───────┘
              │
       ┌──────▼──────┐
       │ Connected?  │
       └──┬───────┬──┘
          │       │
     Yes  │       │ No
          │       │
          ▼       ▼
  ┌──────────┐  ┌──────────────────────────┐
  │Send Data │  │ Try Fallback Connection  │
  └────┬─────┘  └──────────┬───────────────┘
       │                   │
       │            ┌──────▼──────┐
       │            │ Connected?  │
       │            └──┬───────┬──┘
       │               │       │
       │          Yes  │       │ No
       │               │       │
       ▼               ▼       ▼
┌──────────┐   ┌──────────┐  ┌────────────────────┐
│ Success! │   │Send Data │  │ Show Error:        │
│ Toast ✅ │   └────┬─────┘  │ "Failed to connect"│
└──────────┘        │        │ "Check bridge IP"  │
                    ▼        │ "Verify network"   │
             ┌──────────┐   └────────────────────┘
             │ Success! │
             │ Toast ✅ │
             └──────────┘
```

---

## Protocol Detection Logic

```
Input: Printer Model/Name
       │
       ▼
┌────────────────┐
│ toLowerCase()  │
└───────┬────────┘
        │
        ▼
┌──────────────────────────────────────┐
│ Check for keywords:                  │
├──────────────────────────────────────┤
│ Contains "zebra" or "zd" or "zt"?   │
│   → Yes: Return "zpl"                │
│   → No: Continue                     │
├──────────────────────────────────────┤
│ Contains "epson" or "tm-" or "star"? │
│   → Yes: Return "escpos"             │
│   → No: Continue                     │
├──────────────────────────────────────┤
│ Contains "citizen"?                  │
│   → Yes: Return "cpcl"               │
│   → No: Continue                     │
├──────────────────────────────────────┤
│ Contains "tsc"?                      │
│   → Yes: Return "tspl"               │
│   → No: Continue                     │
├──────────────────────────────────────┤
│ Default: Return "zpl"                │
│ (Most common for thermal printers)   │
└──────────────────────────────────────┘

Examples:
  "Zebra D411" → "zpl" ✅
  "ZD421 Thermal" → "zpl" ✅
  "Epson TM-T88V" → "escpos" ✅
  "Star TSP143III" → "escpos" ✅
  "Unknown Printer" → "zpl" (default) ✅
```

---

## Complete Setup Timeline

```
🕐 Day 1: Bridge Configuration (30 min - 1 hour)
    │
    ├─ 10 min: Unbox and power on bridge adapter
    ├─ 15 min: Connect bridge to WiFi (via app/web)
    ├─ 10 min: Pair bridge with Zebra D411 (Bluetooth)
    ├─ 5 min: Find bridge IP address
    └─ 5 min: Set static IP in router (recommended)
    
🕐 Day 1: Tampa APP Configuration (5-10 min)
    │
    ├─ 2 min: Open Settings → Printer Configuration
    ├─ 3 min: Fill in printer details (name, model, etc.)
    ├─ 2 min: Select "Bridge Adapter" and enter IP
    ├─ 1 min: Save settings
    └─ 2 min: Test print

🕐 Day 2-7: Testing & Fine-tuning (30 min total)
    │
    ├─ 10 min: Test from multiple devices (iPad, phones, etc.)
    ├─ 10 min: Adjust darkness if needed (print quality)
    ├─ 5 min: Test connection recovery (restart bridge)
    └─ 5 min: Train staff on basic operation

🕐 Ongoing: Maintenance (5 min/month)
    │
    ├─ 2 min: Clean printer rollers (monthly)
    ├─ 1 min: Check firmware updates (quarterly)
    ├─ 1 min: Verify connection (weekly test print)
    └─ 1 min: Replace paper as needed

Total Setup Time: ~2 hours (one-time)
Daily Usage Time: 0 seconds (just print!)
Monthly Maintenance: 5 minutes
```

---

**This architecture provides:**
- ✅ Clear separation of concerns
- ✅ Easy to understand and maintain
- ✅ Flexible and extensible
- ✅ Robust error handling
- ✅ User-friendly interface
- ✅ Production-ready quality

---

**Created for:** Tampa APP - Australia Client  
**Date:** February 11, 2026  
**Purpose:** Zebra D411 + Bridge Adapter Integration
