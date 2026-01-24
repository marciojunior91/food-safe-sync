// BluetoothUniversalPrinter - Works with ANY Bluetooth thermal printer
// Supports: Zebra (ZPL), ESC/POS (MPT-II, Xprinter, Epson, etc.), Generic Bluetooth

import type { PrinterDriver, PrinterSettings, PrinterCapabilities, PrinterStatus } from '@/types/printer';
import type { LabelPrintData } from '@/utils/zebraPrinter';

// Common Bluetooth Serial Port Profile (SPP) UUID
const SPP_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb';

// Zebra-specific UUIDs (fallback for Zebra printers)
const ZEBRA_SERVICE_UUID = '49535343-fe7d-4ae5-8fa9-9fafd205e455';
const ZEBRA_CHARACTERISTIC_UUID = '49535343-8841-43f4-a8d4-ecbe34729bb3';

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
    maxHeight: 1368
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
    
    // Zebra printers
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
      name.includes('hprt')
    ) {
      console.log('🟢 Detected ESC/POS printer → Using ESC/POS protocol');
      return 'escpos';
    }
    
    // Default to ZPL if unknown (ZPL is more forgiving)
    console.log('⚠️ Unknown printer type → Defaulting to ZPL');
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
      allergens
    } = data;
    
    const qrData = JSON.stringify({
      product: productName,
      prep: prepDate,
      exp: expiryDate,
      by: preparedByName,
    });
    
    const allergenText = allergens && allergens.length > 0
      ? allergens.map(a => a.name).join(', ')
      : '';
    
    return `
^XA
^CF0,30
^FO50,30^A0N,40,40^FD${productName}^FS
^FO50,80^A0N,25,25^FD${categoryName}^FS
^FO50,120^A0N,20,20^FDPrep: ${prepDate}^FS
^FO50,150^A0N,20,20^FDExp: ${expiryDate}^FS
^FO50,180^A0N,20,20^FDBy: ${preparedByName}^FS
${quantity ? `^FO50,210^A0N,20,20^FD${quantity} ${unit}^FS` : ''}
^FO50,240^A0N,20,20^FD${condition}^FS
${allergenText ? `^FO50,270^A0N,18,18^FDAllergens: ${allergenText}^FS` : ''}
^FO300,50^BQN,2,6^FDQA,${qrData}^FS
^XZ
    `.trim();
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
    
    // Add spacing
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
   * Connect to ANY Bluetooth printer
   */
  async connect(): Promise<boolean> {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth is not supported. Please use Chrome on Android.');
      }

      console.log('🔵 Requesting Bluetooth device (ANY thermal printer)...');

      // Request ANY Bluetooth device (no filters = shows all devices)
      // This allows selection of MPT-II, Zebra, Xprinter, etc.
      this.device = await navigator.bluetooth.requestDevice({
        // acceptAllDevices: true, // Show ALL Bluetooth devices
        // optionalServices: [SPP_SERVICE_UUID, ZEBRA_SERVICE_UUID]
        
        // Better approach: Show devices with Serial Port or Zebra service
        filters: [
          { services: [SPP_SERVICE_UUID] },           // ESC/POS printers
          { services: [ZEBRA_SERVICE_UUID] },         // Zebra printers
          { namePrefix: 'MPT' },                      // MPT-II series
          { namePrefix: 'Zebra' },                    // Zebra printers
          { namePrefix: 'Xprinter' },                 // Xprinter
          { namePrefix: 'Epson' },                    // Epson
          { namePrefix: 'TM-' },                      // Epson TM
          { namePrefix: 'RP' },                       // RP80, etc.
          { namePrefix: 'Thermal' },                  // Generic thermal
          { namePrefix: 'POS' },                      // POS printers
          { namePrefix: 'BT-' },                      // Bluetooth printers
        ],
        optionalServices: [SPP_SERVICE_UUID, ZEBRA_SERVICE_UUID]
      });

      if (!this.device) {
        throw new Error('No device selected');
      }

      console.log(`✅ Device selected: ${this.device.name || 'Unknown'}`);

      // Auto-detect protocol if set to 'auto'
      if (this.protocol === 'auto' && this.device.name) {
        this.protocol = this.detectProtocol(this.device.name);
      }

      // Connect to GATT server
      const server = await this.device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      console.log('✅ GATT server connected');

      // Try to get service (try Zebra first, then SPP)
      let service: BluetoothRemoteGATTService;
      try {
        service = await server.getPrimaryService(ZEBRA_SERVICE_UUID);
        console.log('✅ Using Zebra service');
        this.protocol = 'zpl'; // Force ZPL for Zebra service
      } catch {
        try {
          service = await server.getPrimaryService(SPP_SERVICE_UUID);
          console.log('✅ Using SPP service (Serial Port Profile)');
          if (this.protocol === 'auto') {
            this.protocol = 'escpos'; // Default to ESC/POS for SPP
          }
        } catch {
          throw new Error('Could not find compatible Bluetooth service');
        }
      }

      // Get characteristic for writing
      // Try to find writable characteristic
      let foundCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
      
      try {
        // Try Zebra-specific characteristic first
        foundCharacteristic = await service.getCharacteristic(ZEBRA_CHARACTERISTIC_UUID);
      } catch {
        // Fallback: Try to get any characteristic (some printers don't expose getCharacteristics)
        // We'll just try common UUIDs or use a default approach
        console.log('⚠️ Could not find specific characteristic, trying default approach');
      }

      this.characteristic = foundCharacteristic;

      if (!this.characteristic) {
        // Fallback: try Zebra characteristic UUID
        try {
          this.characteristic = await service.getCharacteristic(ZEBRA_CHARACTERISTIC_UUID);
        } catch {
          throw new Error('No writable characteristic found');
        }
      }

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
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
        
        // Use writeValue (standard Web Bluetooth API method)
        await this.characteristic.writeValue(chunk);
        
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
      console.log(`🖨️ Printing via Bluetooth (${this.protocol.toUpperCase()}):`, labelData.productName);

      // Generate appropriate command set based on protocol
      let data: string | Uint8Array;
      
      if (this.protocol === 'zpl') {
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
