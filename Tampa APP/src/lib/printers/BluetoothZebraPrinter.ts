// BluetoothZebraPrinter - Direct Bluetooth connection for Android + Zebra D411
// Uses Web Bluetooth API (Progressive Web App approach)

import type { PrinterDriver, PrinterSettings, PrinterCapabilities, PrinterStatus } from '@/types/printer';
import { printLabel, saveLabelToDatabase, type LabelPrintData } from '@/utils/zebraPrinter';

// Zebra Bluetooth Service UUID (standard for most Zebra printers)
const ZEBRA_SERVICE_UUID = '49535343-fe7d-4ae5-8fa9-9fafd205e455';
const ZEBRA_CHARACTERISTIC_UUID = '49535343-8841-43f4-a8d4-ecbe34729bb3';

export class BluetoothZebraPrinter implements PrinterDriver {
  type: 'bluetooth' = 'bluetooth';
  name: string;
  capabilities: PrinterCapabilities = {
    supportsZPL: true,
    supportsPDF: false,
    supportsColor: false,
    maxWidth: 832, // 4 inches at 203 DPI
    maxHeight: 1368 // 6.75 inches at 203 DPI
  };
  
  private settings: PrinterSettings;
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  constructor(name: string, settings?: Partial<PrinterSettings>) {
    this.name = name;
    this.settings = {
      type: 'bluetooth',
      name,
      paperWidth: 102,
      paperHeight: 180,
      defaultQuantity: 1,
      darkness: 20,
      speed: 4,
      ...settings
    };
  }
  
  /**
   * Generate ZPL code from label data
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
    
    // Generate QR Code data
    const qrData = JSON.stringify({
      product: productName,
      prep: prepDate,
      exp: expiryDate,
      by: preparedByName,
    });
    
    // Format allergen text
    const allergenText = allergens && allergens.length > 0
      ? allergens.map(a => a.name).join(', ')
      : '';
    
    // Professional ZPL layout for 102mm x 180mm label
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
   * Connect to Zebra printer via Bluetooth
   */
  async connect(): Promise<boolean> {
    try {
      // Check if Web Bluetooth is supported
      if (!navigator.bluetooth) {
        console.error('❌ Web Bluetooth API not supported in this browser');
        throw new Error('Web Bluetooth is not supported. Please use Chrome on Android.');
      }

      console.log('🔵 Requesting Bluetooth device...');

      // Request device with Zebra service filter
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [ZEBRA_SERVICE_UUID] },
          { namePrefix: 'Zebra' }
        ],
        optionalServices: [ZEBRA_SERVICE_UUID]
      });

      if (!this.device) {
        throw new Error('No device selected');
      }

      console.log(`✅ Device selected: ${this.device.name}`);

      // Connect to GATT server
      const server = await this.device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      console.log('✅ GATT server connected');

      // Get Zebra service
      const service = await server.getPrimaryService(ZEBRA_SERVICE_UUID);
      console.log('✅ Zebra service found');

      // Get characteristic for writing
      this.characteristic = await service.getCharacteristic(ZEBRA_CHARACTERISTIC_UUID);
      console.log('✅ Characteristic ready for writing');

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
   * Send ZPL commands to printer via Bluetooth
   */
  private async sendZPL(zplCode: string): Promise<boolean> {
    try {
      // Ensure connected
      if (!this.characteristic) {
        console.log('📡 Not connected, attempting to connect...');
        await this.connect();
      }

      if (!this.characteristic) {
        throw new Error('Failed to establish Bluetooth connection');
      }

      // Convert ZPL string to bytes
      const encoder = new TextEncoder();
      const data = encoder.encode(zplCode);

      // Send data in chunks (Bluetooth has MTU limits, typically 20-512 bytes)
      const chunkSize = 512; // Conservative chunk size
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
        await this.characteristic.writeValue(chunk);
        
        // Small delay between chunks
        if (i + chunkSize < data.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      console.log('✅ ZPL sent via Bluetooth');
      return true;

    } catch (error) {
      console.error('❌ Failed to send ZPL via Bluetooth:', error);
      
      // Reset connection on error
      this.device = null;
      this.characteristic = null;
      
      throw error;
    }
  }

  /**
   * Print single label
   */
  async print(labelData: LabelPrintData): Promise<boolean> {
    try {
      console.log('🖨️ Printing via Bluetooth Zebra printer:', labelData.productName);

      // Generate ZPL code
      const zplCode = this.generateZPL(labelData);
      console.log('✅ ZPL generated:', zplCode.substring(0, 100) + '...');

      // Send to printer via Bluetooth
      await this.sendZPL(zplCode);

      // Save to database (optional, for history)
      // await saveLabelToDatabase(labelData);

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
          throw new Error('Zebra printer not found. Make sure it is powered on and in range.');
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
        const zplCode = this.generateZPL(labelData);
        await this.sendZPL(zplCode);
        
        // Small delay between labels
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
      // Test by printing a simple calibration label
      const testZPL = `
^XA
^FO50,50^A0N,50,50^FDTest Print^FS
^FO50,120^A0N,30,30^FDIf you see this, Bluetooth works!^FS
^FO50,170^A0N,25,25^FD${new Date().toLocaleString()}^FS
^XZ
      `.trim();

      await this.sendZPL(testZPL);
      return true;

    } catch (error) {
      console.error('❌ Test print failed:', error);
      return false;
    }
  }
}
