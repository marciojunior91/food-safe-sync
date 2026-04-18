// BluetoothUniversalPrinter - Works with ANY Bluetooth thermal printer
// Supports: Zebra (ZPL), ESC/POS (MPT-II, Xprinter, Epson, etc.), Generic Bluetooth

import type { PrinterDriver, PrinterSettings, PrinterCapabilities, PrinterStatus } from '@/types/printer';
import type { LabelPrintData } from '@/utils/zebraPrinter';

// Common Bluetooth Serial Port Profile (SPP) UUID
const SPP_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb';

// Zebra-specific UUIDs
const ZEBRA_SERVICE_UUID = '49535343-fe7d-4ae5-8fa9-9fafd205e455';
const ZEBRA_CHARACTERISTIC_UUID = '49535343-8841-43f4-a8d4-ecbe34729bb3';

// Zebra BLE Parser (ZD411, ZD421, ZD621 + P1112640-017C adapter)
const ZEBRA_BLE_PARSER_SERVICE = '38eb4a80-c570-11e3-9507-0002a5d5c51b';
const ZEBRA_BLE_PARSER_CHAR = '38eb4a82-c570-11e3-9507-0002a5d5c51b';

// All optional services to request during pairing
const ALL_OPTIONAL_SERVICES = [
  ZEBRA_SERVICE_UUID,
  ZEBRA_BLE_PARSER_SERVICE,
  SPP_SERVICE_UUID,
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Nordic UART
  '000018f0-0000-1000-8000-00805f9b34fb', // Zebra BTLE
  '0000ff00-0000-1000-8000-00805f9b34fb', // Generic vendor
  '0000fff0-0000-1000-8000-00805f9b34fb', // Common printer service
  '0000ae30-0000-1000-8000-00805f9b34fb', // Zebra write service
];

export type PrinterProtocol = 'zpl' | 'escpos' | 'auto';

export class BluetoothUniversalPrinter implements PrinterDriver {
  type: 'bluetooth' = 'bluetooth';
  name: string;
  protocol: PrinterProtocol = 'auto';
  capabilities: PrinterCapabilities = {
    supportsZPL: true,
    supportsPDF: false,
    supportsColor: false,
    maxWidth: 832,
    maxHeight: 1368,
    supportedProtocols: ['zpl', 'escpos', 'auto'],
    supportedConnections: ['bluetooth-le', 'bluetooth-classic']
  };
  
  private settings: PrinterSettings;
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  constructor(name: string, settings?: Partial<PrinterSettings>, protocol: PrinterProtocol = 'auto') {
    this.name = name;
    this.protocol = protocol;
    this.settings = {
      type: 'bluetooth',
      name,
      paperWidth: 58, // Common thermal paper size (58mm or 80mm)
      paperHeight: 180,
      defaultQuantity: 1,
      darkness: 20,
      speed: 4,
      ...settings
    };
  }

  /**
   * Auto-detect printer protocol based on device name
   */
  private detectProtocol(deviceName: string): PrinterProtocol {
    const name = deviceName.toLowerCase();
    
    console.log(`🔍 Detecting protocol for device: "${deviceName}"`);
    
    // Zebra printers (specific check)
    if (name.includes('zebra') || name.includes('zd') || name.includes('zt')) {
      console.log('🔵 Detected Zebra printer → Using ZPL protocol');
      return 'zpl';
    }
    
    // Common ESC/POS printer brands
    if (
      name.includes('mpt') ||      // MPT-II, MPT-III
      name.includes('xprinter') ||
      name.includes('epson') ||
      name.includes('tm-') ||       // Epson TM series
      name.includes('rp') ||        // RP80, RP326, etc.
      name.includes('pos') ||
      name.includes('thermal') ||
      name.includes('rongta') ||
      name.includes('hprt') ||
      name.includes('mini') ||      // Mini printers
      name.includes('_') ||         // MPT-II_309F has underscore
      name.includes('309')          // MPT-II_309F has 309
    ) {
      console.log('🟢 Detected ESC/POS printer → Using ESC/POS protocol');
      return 'escpos';
    }
    
    // Default to ZPL (client's main printer is Zebra D411 in Australia)
    console.log('⚠️ Unknown printer type → Defaulting to ZPL (Zebra protocol)');
    return 'zpl';
  }

  /**
   * Generate ZPL code for Zebra printers
   */
  private generateZPL(data: LabelPrintData): string {
    const { 
      productName, 
      categoryName, 
      condition, 
      prepDate, 
      expiryDate, 
      preparedByName, 
      quantity, 
      unit, 
      allergens,
      labelId,
    } = data;
    
    // QR code URL to label preview (same as zebraPrinter.ts)
    const qrValue = labelId
      ? `https://app.tampaapp.com.br/labels/${labelId}/preview`
      : JSON.stringify({ product: productName, prep: prepDate, exp: expiryDate });
    
    const allergenText = allergens && allergens.length > 0
      ? allergens.map(a => a.name).join(', ')
      : '';
    
    // Use saved label dimensions (mm → dots at 203dpi: 1mm = 8 dots)
    const DPI = 203;
    const MM_TO_DOT = DPI / 25.4; // ~8 dots per mm
    const labelWidthMm = this.settings.paperWidth || 102;
    const labelHeightMm = this.settings.paperHeight || 180;
    const PW = Math.round(labelWidthMm * MM_TO_DOT);

    // Responsive sizing based on label width
    const isSmall = labelWidthMm <= 60; // 50mm labels
    const ML = isSmall ? 10 : 30; // left margin
    const CW = PW - ML * 2;       // content width

    // Font sizes adapt to label size
    const titleFont = isSmall ? 28 : 40;
    const normalFont = isSmall ? 18 : 25;
    const smallFont = isSmall ? 16 : 20;
    const tinyFont = isSmall ? 14 : 18;

    // QR code: magnification 3 for small labels, 5 for large
    const qrMag = isSmall ? 3 : 5;
    const qrW = qrMag * 25 + 20; // approximate QR pixel width
    const leftColW = CW - qrW - 10;

    const rows: string[] = [];
    let y = isSmall ? 10 : 20;

    // Product name (truncate for small labels)
    const maxNameLen = isSmall ? 18 : 30;
    const displayName = productName.length > maxNameLen ? productName.substring(0, maxNameLen - 1) + '...' : productName;
    rows.push(`^FO${ML},${y}^A0N,${titleFont},${titleFont}^FD${displayName}^FS`);
    y += titleFont + 6;

    // Category
    if (categoryName) {
      rows.push(`^FO${ML},${y}^A0N,${normalFont},${normalFont}^FD${categoryName}^FS`);
      y += normalFont + 4;
    }

    // Separator
    rows.push(`^FO${ML},${y}^GB${CW},1,1^FS`);
    y += 6;

    const contentStartY = y;

    // Prep date
    rows.push(`^FO${ML},${y}^A0N,${smallFont},${smallFont}^FDPrep: ${prepDate || 'N/A'}^FS`);
    y += smallFont + 4;

    // Expiry date
    rows.push(`^FO${ML},${y}^A0N,${smallFont},${smallFont}^FDExp: ${expiryDate || 'N/A'}^FS`);
    y += smallFont + 4;

    // Prepared by
    rows.push(`^FO${ML},${y}^A0N,${smallFont},${smallFont}^FDBy: ${preparedByName || 'Unknown'}^FS`);
    y += smallFont + 4;

    // Quantity + unit
    if (quantity) {
      rows.push(`^FO${ML},${y}^A0N,${smallFont},${smallFont}^FD${quantity} ${unit || 'Unit'}^FS`);
      y += smallFont + 4;
    }

    // Condition
    if (condition) {
      rows.push(`^FO${ML},${y}^A0N,${smallFont},${smallFont}^FD${condition}^FS`);
      y += smallFont + 4;
    }

    // Allergens
    if (allergenText) {
      if (isSmall) {
        // Single line, truncated
        const truncAllergens = allergenText.length > 30 ? allergenText.substring(0, 29) + '…' : allergenText;
        rows.push(`^FO${ML},${y}^A0N,${tinyFont},${tinyFont}^FD${truncAllergens}^FS`);
        y += tinyFont + 4;
      } else {
        rows.push(`^FO${ML},${y}^A0N,${tinyFont},${tinyFont}^FDAllergens: ${allergenText}^FS`);
        y += tinyFont + 4;
      }
    }

    // QR code on right side, aligned to content start
    const qrX = ML + leftColW + 5;
    rows.push(`^FO${qrX},${contentStartY}^BQN,2,${qrMag}^FDQA,${qrValue}^FS`);

    // Label height: max of content Y and QR bottom, plus margin
    const qrHeight = qrMag * 25 + 10;
    const finalY = Math.max(y, contentStartY + qrHeight) + (isSmall ? 10 : 20);
    const LL = Math.min(Math.round(labelHeightMm * MM_TO_DOT), finalY);

    return `^XA
^MMT
^PW${PW}
^LL${LL}
^LS0
^CI28
${rows.join('\n')}
^XZ`;
  }

  /**
   * Generate ESC/POS commands for thermal printers (MPT-II, Xprinter, etc.)
   */
  private generateESCPOS(data: LabelPrintData): Uint8Array {
    const { 
      productName, 
      categoryName, 
      condition, 
      prepDate, 
      expiryDate, 
      preparedByName, 
      quantity, 
      unit, 
      allergens
    } = data;
    
    // ESC/POS command sequence
    const commands: number[] = [];
    
    // Initialize printer
    commands.push(0x1B, 0x40); // ESC @ - Initialize
    
    // Set character size (double width + double height for title)
    commands.push(0x1D, 0x21, 0x11); // GS ! - Double size
    
    // Print product name (bold)
    commands.push(0x1B, 0x45, 0x01); // ESC E - Bold on
    commands.push(...this.stringToBytes(productName + '\n'));
    commands.push(0x1B, 0x45, 0x00); // ESC E - Bold off
    
    // Reset to normal size
    commands.push(0x1D, 0x21, 0x00); // GS ! - Normal size
    
    // Print category
    commands.push(...this.stringToBytes(`Category: ${categoryName}\n`));
    
    // Print prep date
    commands.push(...this.stringToBytes(`Prep: ${prepDate}\n`));
    
    // Print expiry date (bold + larger)
    commands.push(0x1B, 0x45, 0x01); // Bold on
    commands.push(0x1D, 0x21, 0x01); // GS ! - Double height
    commands.push(...this.stringToBytes(`Exp: ${expiryDate}\n`));
    commands.push(0x1B, 0x45, 0x00); // Bold off
    commands.push(0x1D, 0x21, 0x00); // Normal size
    
    // Print prepared by
    commands.push(...this.stringToBytes(`By: ${preparedByName}\n`));
    
    // Print quantity if present
    if (quantity) {
      commands.push(...this.stringToBytes(`Qty: ${quantity} ${unit || ''}\n`));
    }
    
    // Print condition
    commands.push(...this.stringToBytes(`Condition: ${condition}\n`));
    
    // Print allergens if present
    if (allergens && allergens.length > 0) {
      const allergenText = allergens.map(a => a.name).join(', ');
      commands.push(...this.stringToBytes(`Allergens: ${allergenText}\n`));
    }
    
    // Add spacing before QR code
    commands.push(0x0A); // Line feed
    
    // Generate QR Code data (JSON with label info)
    const qrData = JSON.stringify({
      product: productName,
      prep: prepDate,
      exp: expiryDate,
      by: preparedByName,
    });
    
    console.log(`📊 QR Code data: ${qrData}`);
    console.log(`📏 QR Code length: ${qrData.length} characters`);
    
    // ESC/POS QR Code commands (Model 2) - ORIGINAL WORKING VERSION
    // Select QR code model
    commands.push(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00); // GS ( k - Model 2
    
    // Set QR code size (module size = 6)
    commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x06); // GS ( k - Size 6
    
    // Set error correction level (H = 51) - Sprint 4 T9.1: High error correction (30%)
    // Changed from M (49/0x31) to H (51/0x33) for maximum reliability
    commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x33); // GS ( k - Error correction H
    
    // Store QR code data
    const qrBytes = this.stringToBytes(qrData);
    const qrLength = qrBytes.length + 3;
    const pL = qrLength % 256;
    const pH = Math.floor(qrLength / 256);
    
    console.log(`📦 QR bytes length: ${qrBytes.length}, pL: ${pL}, pH: ${pH}`);
    
    commands.push(0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30); // GS ( k - Store data
    commands.push(...qrBytes);
    
    // Print QR code
    commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30); // GS ( k - Print
    
    console.log(`✅ QR Code commands added (ORIGINAL VERSION)`);
    
    // Add spacing after QR code
    commands.push(0x0A, 0x0A); // Line feeds
    
    // Cut paper (if supported)
    commands.push(0x1D, 0x56, 0x00); // GS V - Full cut
    
    return new Uint8Array(commands);
  }

  /**
   * Helper: Convert string to byte array
   */
  private stringToBytes(str: string): number[] {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(str));
  }

  /**
   * Connect to ANY Bluetooth printer.
   * Tries getDevices() first (reconnect without picker), then requestDevice().
   */
  async connect(): Promise<boolean> {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth is not supported. Please use Chrome on Android.');
      }

      // ── 1. Try to reconnect to an already-paired device (no UI picker) ────
      const savedName = this.settings.connectionConfig?.bluetoothDeviceName || this.name;
      console.log(`🔵 Trying to reconnect to previously paired device: "${savedName}"`);

      try {
        if ('getDevices' in navigator.bluetooth) {
          const pairedDevices = await (navigator.bluetooth as any).getDevices();
          console.log(`📋 Found ${pairedDevices.length} previously paired device(s):`,
            pairedDevices.map((d: BluetoothDevice) => d.name || d.id));

          // Find our device by name
          for (const dev of pairedDevices) {
            if (dev.name === savedName || dev.name === this.settings.name) {
              console.log(`✅ Found paired device: ${dev.name}`);
              this.device = dev;
              break;
            }
          }

          // If no name match, try first available paired device
          if (!this.device && pairedDevices.length > 0) {
            this.device = pairedDevices[0];
            console.log(`✅ Using first paired device: ${this.device!.name || this.device!.id}`);
          }
        }
      } catch (e) {
        console.warn('⚠️ getDevices() not available or failed:', e);
      }

      // ── 2. Fall back to requestDevice() picker if no paired device ────────
      if (!this.device) {
        console.log('🔵 No paired device found, showing Bluetooth picker...');
        this.device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ALL_OPTIONAL_SERVICES,
        });
      }

      if (!this.device) {
        throw new Error('No device selected');
      }

      console.log(`✅ Device selected: ${this.device.name || 'Unknown'}`);

      // Auto-detect protocol if set to 'auto'
      if (this.protocol === 'auto' && this.device.name) {
        this.protocol = this.detectProtocol(this.device.name);
      }

      // ── 3. Connect GATT and find writable characteristic ──────────────────
      const server = await this.device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      console.log('✅ GATT server connected');

      // Try services in order: Zebra Parser, ISS/Zebra, SPP, then enumerate all
      const SERVICE_UUIDS = [
        ZEBRA_BLE_PARSER_SERVICE,
        ZEBRA_SERVICE_UUID,
        SPP_SERVICE_UUID,
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '000018f0-0000-1000-8000-00805f9b34fb',
        '0000fff0-0000-1000-8000-00805f9b34fb',
        '0000ff00-0000-1000-8000-00805f9b34fb',
      ];
      const CHAR_UUIDS = [
        ZEBRA_BLE_PARSER_CHAR,
        ZEBRA_CHARACTERISTIC_UUID,
        'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
        '0000fff2-0000-1000-8000-00805f9b34fb',
      ];

      let foundChar: BluetoothRemoteGATTCharacteristic | null = null;

      // Try known service+char pairs
      for (const svcUUID of SERVICE_UUIDS) {
        try {
          const svc = await server.getPrimaryService(svcUUID);
          console.log(`✅ Service found: ${svcUUID.slice(0, 8)}...`);

          // Keep detected protocol (don't override based on service)
          console.log(`📌 Keeping protocol: ${this.protocol}`);

          // Try known characteristic UUIDs
          for (const charUUID of CHAR_UUIDS) {
            try {
              const ch = await svc.getCharacteristic(charUUID);
              if (ch.properties.write || ch.properties.writeWithoutResponse) {
                foundChar = ch;
                console.log(`✅ Writable char found: ${charUUID.slice(0, 8)}...`);
                break;
              }
            } catch { /* next */ }
          }
          if (foundChar) break;

          // Enumerate all characteristics of this service
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const chars: BluetoothRemoteGATTCharacteristic[] = await (svc as any)['getCharacteristics']();
            for (const ch of chars) {
              if (ch.properties.write || ch.properties.writeWithoutResponse) {
                foundChar = ch;
                console.log(`✅ Enum writable char: ${ch.uuid.slice(0, 8)}...`);
                break;
              }
            }
          } catch { /* can't enumerate */ }
          if (foundChar) break;
        } catch { /* service not found, next */ }
      }

      // Last resort: enumerate all services
      if (!foundChar) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const allServices: BluetoothRemoteGATTService[] = await (server as any)['getPrimaryServices']();
          console.log('📋 All services:', allServices.map(s => s.uuid));
          for (const svc of allServices) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const chars: BluetoothRemoteGATTCharacteristic[] = await (svc as any)['getCharacteristics']();
            for (const ch of chars) {
              if (ch.properties.write || ch.properties.writeWithoutResponse) {
                foundChar = ch;
                console.log(`✅ Full-enum char: svc=${svc.uuid.slice(0,8)} char=${ch.uuid.slice(0,8)}`);
                break;
              }
            }
            if (foundChar) break;
          }
        } catch (e) {
          console.warn('Cannot enumerate all services:', e);
        }
      }

      if (!foundChar) {
        throw new Error('No writable characteristic found on this Bluetooth device');
      }

      this.characteristic = foundChar;
      console.log('✅ Characteristic ready for writing');
      console.log(`📝 Using protocol: ${this.protocol.toUpperCase()}`);

      // Listen for disconnection
      this.device.addEventListener('gattserverdisconnected', () => {
        console.log('⚠️ Bluetooth device disconnected');
        this.device = null;
        this.characteristic = null;
      });

      return true;

    } catch (error) {
      console.error('❌ Bluetooth connection failed:', error);
      throw error;
    }
  }

  /**
   * Send data to printer (auto-detects protocol)
   */
  private async sendData(data: string | Uint8Array): Promise<boolean> {
    try {
      if (!this.characteristic) {
        console.log('📡 Not connected, attempting to connect...');
        await this.connect();
      }

      if (!this.characteristic) {
        throw new Error('Failed to establish Bluetooth connection');
      }

      // Convert string to bytes if needed
      const bytes = typeof data === 'string' 
        ? new TextEncoder().encode(data)
        : data;

      // Send data in chunks (Bluetooth MTU limits)
      const chunkSize = 512;
      const useWOR = this.characteristic.properties.writeWithoutResponse;
      console.log(`📤 Sending ${bytes.length} bytes in ${Math.ceil(bytes.length / chunkSize)} chunks (writeWithoutResponse=${useWOR})`);

      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
        
        try {
          if (useWOR) {
            await this.characteristic.writeValueWithoutResponse(chunk);
          } else {
            await this.characteristic.writeValue(chunk);
          }
        } catch (writeErr) {
          // Retry once after reconnecting (GATT can drop mid-transfer)
          console.warn('⚠️ Write failed, reconnecting and retrying...', writeErr);
          this.characteristic = null;
          await this.connect();
          if (!this.characteristic) throw new Error('Reconnect failed');
          if (useWOR) {
            await this.characteristic.writeValueWithoutResponse(chunk);
          } else {
            await this.characteristic.writeValue(chunk);
          }
        }
        
        // Small delay between chunks
        if (i + chunkSize < bytes.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      console.log(`✅ Data sent via Bluetooth (${bytes.length} bytes, protocol: ${this.protocol})`);
      return true;

    } catch (error) {
      console.error('❌ Failed to send data via Bluetooth:', error);
      
      // Reset connection on error
      this.device = null;
      this.characteristic = null;
      
      throw error;
    }
  }

  /**
   * Print label (auto-selects protocol)
   */
  async print(labelData: LabelPrintData): Promise<boolean> {
    try {
      // CRITICAL: Determine protocol based on CURRENT device, not cached value
      let currentProtocol = this.protocol;
      
      // If protocol is 'auto' and we have a device, detect it
      if (currentProtocol === 'auto' && this.device?.name) {
        currentProtocol = this.detectProtocol(this.device.name);
        console.log(`� Re-detected protocol for "${this.device.name}": ${currentProtocol.toUpperCase()}`);
      }
      
      console.log(`�🖨️ Printing via Bluetooth (${currentProtocol.toUpperCase()}):`, labelData.productName);

      // Generate appropriate command set based on protocol
      let data: string | Uint8Array;
      
      if (currentProtocol === 'zpl') {
        data = this.generateZPL(labelData);
        console.log('✅ ZPL generated:', (data as string).substring(0, 100) + '...');
      } else {
        data = this.generateESCPOS(labelData);
        console.log('✅ ESC/POS generated:', data.length, 'bytes');
      }

      // Send to printer
      await this.sendData(data);

      return true;

    } catch (error) {
      console.error('❌ Bluetooth print failed:', error);
      
      // User-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('Web Bluetooth is not supported')) {
          throw new Error('Bluetooth printing requires Chrome browser on Android');
        }
        if (error.message.includes('User cancelled')) {
          throw new Error('Bluetooth device selection cancelled');
        }
        if (error.message.includes('not found')) {
          throw new Error('Printer not found. Make sure it is powered on and in range.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Print multiple labels
   */
  async printBatch(labels: LabelPrintData[]): Promise<boolean> {
    try {
      console.log(`🖨️ Batch printing ${labels.length} labels via Bluetooth...`);

      // Connect once for the batch
      if (!this.characteristic) {
        await this.connect();
      }

      // Print each label
      for (const labelData of labels) {
        if (this.protocol === 'zpl') {
          await this.sendData(this.generateZPL(labelData));
        } else {
          await this.sendData(this.generateESCPOS(labelData));
        }
        
        // Delay between labels
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ Batch print complete: ${labels.length} labels`);
      return true;

    } catch (error) {
      console.error('❌ Batch print failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from printer
   */
  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
      console.log('🔌 Bluetooth disconnected');
    }
    this.device = null;
    this.characteristic = null;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.device?.gatt?.connected === true;
  }

  /**
   * Get printer settings
   */
  getSettings(): PrinterSettings {
    return this.settings;
  }

  /**
   * Update printer settings
   */
  async updateSettings(newSettings: Partial<PrinterSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    console.log('✅ Bluetooth printer settings updated');
  }

  /**
   * Get printer status
   */
  async getStatus(): Promise<PrinterStatus> {
    return {
      isReady: this.isConnected(),
      paperOut: false,
      error: this.isConnected() ? undefined : 'Not connected'
    };
  }

  /**
   * Test connection
   */
  async test(): Promise<boolean> {
    try {
      if (this.protocol === 'zpl') {
        // Test ZPL
        const testZPL = `
^XA
^FO50,50^A0N,50,50^FDTest Print^FS
^FO50,120^A0N,30,30^FDIf you see this, Bluetooth works!^FS
^FO50,170^A0N,25,25^FD${new Date().toLocaleString()}^FS
^XZ
        `.trim();
        await this.sendData(testZPL);
      } else {
        // Test ESC/POS
        const commands: number[] = [];
        commands.push(0x1B, 0x40); // Initialize
        commands.push(0x1B, 0x45, 0x01); // Bold on
        commands.push(...this.stringToBytes('Test Print\n'));
        commands.push(0x1B, 0x45, 0x00); // Bold off
        commands.push(...this.stringToBytes('If you see this, Bluetooth works!\n'));
        commands.push(...this.stringToBytes(new Date().toLocaleString() + '\n'));
        commands.push(0x0A, 0x0A, 0x0A); // Line feeds
        commands.push(0x1D, 0x56, 0x00); // Cut
        
        await this.sendData(new Uint8Array(commands));
      }
      
      return true;

    } catch (error) {
      console.error('❌ Test print failed:', error);
      return false;
    }
  }
}
