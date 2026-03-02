/**
 * UniversalPrinter - Multi-connection, multi-protocol printer driver
 * 
 * Supports:
 * - Bluetooth LE (Web Bluetooth API)
 * - Bluetooth Classic (via bridge/adapter)
 * - TCP/IP (direct network connection)
 * - WiFi (network printer)
 * - Bluetooth-to-TCP Bridge (for BLE-only printers with adapter)
 * 
 * Protocols:
 * - ZPL (Zebra Programming Language)
 * - ESC/POS (Epson, Star, etc.)
 * - Auto-detection based on printer model
 * 
 * Perfect for Zebra D411 with Bluetooth-to-TCP adapter!
 */

import type { 
  PrinterDriver, 
  PrinterSettings, 
  PrinterCapabilities, 
  PrinterStatus,
  ConnectionType,
  PrinterProtocol,
  DiscoveredPrinter,
  ConnectionConfig
} from '@/types/printer';
import type { LabelPrintData } from '@/utils/zebraPrinter';
import { saveLabelToDatabase } from '@/utils/zebraPrinter';

// Bluetooth UUIDs
const SPP_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb'; // Serial Port Profile
const ZEBRA_SERVICE_UUID = '49535343-fe7d-4ae5-8fa9-9fafd205e455';
const ZEBRA_CHARACTERISTIC_UUID = '49535343-8841-43f4-a8d4-ecbe34729bb3';

// Default ports for different connection types
const DEFAULT_PORTS = {
  'tcp-ip': 9100,      // Standard ZPL port
  'wifi': 9100,
  'bridge': 9100,      // Bridge adapter typically uses 9100
  'escpos': 9100,
};

export class UniversalPrinter implements PrinterDriver {
  type: 'universal' = 'universal';
  name: string;
  capabilities: PrinterCapabilities;
  
  private settings: PrinterSettings;
  private connected: boolean = false;
  private currentConnection: ConnectionType | null = null;
  
  // Connection objects
  private bluetoothDevice: BluetoothDevice | null = null;
  private bluetoothCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private tcpSocket: WebSocket | null = null;

  constructor(name: string, settings?: Partial<PrinterSettings>) {
    this.name = name;
    this.settings = {
      type: 'universal',
      name,
      model: 'Universal Thermal Printer',
      protocol: 'auto',
      connectionType: 'tcp-ip',
      paperWidth: 102,
      paperHeight: 152,
      defaultQuantity: 1,
      darkness: 20,
      speed: 4,
      connectionConfig: {
        preferredConnection: 'tcp-ip',
        fallbackConnections: ['bluetooth-le', 'bluetooth-classic'],
        autoReconnect: true,
        timeout: 5000,
        port: 9100,
      },
      ...settings
    };
    
    this.capabilities = {
      supportsZPL: true,
      supportsPDF: false,
      supportsColor: false,
      maxWidth: 832,
      maxHeight: 1368,
      supportedProtocols: ['zpl', 'escpos', 'auto'],
      supportedConnections: ['bluetooth-le', 'bluetooth-classic', 'tcp-ip', 'wifi', 'bridge']
    };
  }

  /**
   * Auto-detect printer protocol from model name
   */
  private detectProtocol(modelOrName?: string): PrinterProtocol {
    if (!modelOrName) return 'zpl';
    
    const name = modelOrName.toLowerCase();
    
    // Zebra printers use ZPL
    if (name.includes('zebra') || name.includes('zd') || name.includes('zt')) {
      return 'zpl';
    }
    
    // ESC/POS printers
    if (
      name.includes('epson') ||
      name.includes('star') ||
      name.includes('citizen') ||
      name.includes('escpos') ||
      name.includes('pos-') ||
      name.includes('thermal')
    ) {
      return 'escpos';
    }
    
    // Default to ZPL (client's main use case)
    return 'zpl';
  }

  /**
   * Connect to printer using configured connection type with fallback
   */
  async connect(): Promise<boolean> {
    console.log('🔌 UniversalPrinter: Starting connection...');
    console.log('📋 Settings:', this.settings);
    
    const config = this.settings.connectionConfig;
    if (!config) {
      console.error('❌ No connection configuration found');
      return false;
    }

    // Get connection priority list
    const connectionTypes: ConnectionType[] = [
      config.preferredConnection || 'tcp-ip',
      ...(config.fallbackConnections || [])
    ];

    // Try each connection type
    for (const connType of connectionTypes) {
      console.log(`🔄 Attempting connection via ${connType}...`);
      
      try {
        let success = false;
        
        switch (connType) {
          case 'tcp-ip':
          case 'wifi':
          case 'bridge':
            success = await this.connectTCP(config);
            break;
            
          case 'bluetooth-le':
            success = await this.connectBluetoothLE(config);
            break;
            
          case 'bluetooth-classic':
            // Bluetooth Classic typically requires bridge on web
            success = await this.connectBluetoothClassicViaBridge(config);
            break;
            
          default:
            console.warn(`⚠️ Unsupported connection type: ${connType}`);
        }
        
        if (success) {
          this.connected = true;
          this.currentConnection = connType;
          console.log(`✅ Connected via ${connType}`);
          return true;
        }
      } catch (error) {
        console.warn(`⚠️ Failed to connect via ${connType}:`, error);
      }
    }
    
    console.error('❌ All connection attempts failed');
    return false;
  }

  /**
   * Connect via TCP/IP (for network printers or bridge adapters)
   */
  private async connectTCP(config: ConnectionConfig): Promise<boolean> {
    const ip = config.ipAddress || config.bridgeIpAddress;
    const port = config.port || config.bridgePort || DEFAULT_PORTS['tcp-ip'];
    
    if (!ip) {
      console.error('❌ No IP address configured for TCP connection');
      return false;
    }

    return new Promise((resolve) => {
      try {
        // For web applications, we use WebSocket to communicate with a local server
        // that handles the actual TCP socket connection
        // This requires a print server running locally (e.g., our print-server/)
        
        const wsUrl = `ws://localhost:3001/printer/${ip}/${port}`;
        console.log(`🌐 Connecting to print server: ${wsUrl}`);
        
        this.tcpSocket = new WebSocket(wsUrl);
        
        this.tcpSocket.onopen = () => {
          console.log('✅ TCP WebSocket connection established');
          resolve(true);
        };
        
        this.tcpSocket.onerror = (error) => {
          console.error('❌ TCP WebSocket error:', error);
          resolve(false);
        };
        
        this.tcpSocket.onclose = () => {
          console.log('🔌 TCP WebSocket connection closed');
          this.connected = false;
        };
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (!this.connected) {
            this.tcpSocket?.close();
            resolve(false);
          }
        }, config.timeout || 5000);
        
      } catch (error) {
        console.error('❌ TCP connection error:', error);
        resolve(false);
      }
    });
  }

  /**
   * Connect via Bluetooth LE (Web Bluetooth API)
   */
  private async connectBluetoothLE(config: ConnectionConfig): Promise<boolean> {
    if (!navigator.bluetooth) {
      console.error('❌ Web Bluetooth not supported in this browser');
      return false;
    }

    try {
      console.log('🔵 Requesting Bluetooth device...');
      
      // Request device with optional filters
      const options: RequestDeviceOptions = {
        acceptAllDevices: true,
        optionalServices: [SPP_SERVICE_UUID, ZEBRA_SERVICE_UUID]
      };
      
      if (config.bluetoothDeviceName) {
        options.acceptAllDevices = false;
        options.filters = [{ name: config.bluetoothDeviceName }];
      }
      
      this.bluetoothDevice = await navigator.bluetooth.requestDevice(options);
      console.log(`📱 Device selected: ${this.bluetoothDevice.name}`);
      
      // Connect to GATT server
      const server = await this.bluetoothDevice.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }
      
      console.log('🔗 GATT server connected');
      
      // Get primary service
      const serviceUUID = config.bluetoothServiceUUID || ZEBRA_SERVICE_UUID;
      const service = await server.getPrimaryService(serviceUUID);
      console.log(`📡 Service found: ${serviceUUID}`);
      
      // Get characteristic
      const charUUID = config.bluetoothCharacteristicUUID || ZEBRA_CHARACTERISTIC_UUID;
      this.bluetoothCharacteristic = await service.getCharacteristic(charUUID);
      console.log(`✉️ Characteristic found: ${charUUID}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Bluetooth LE connection error:', error);
      return false;
    }
  }

  /**
   * Connect via Bluetooth Classic (requires bridge/adapter)
   */
  private async connectBluetoothClassicViaBridge(config: ConnectionConfig): Promise<boolean> {
    // Bluetooth Classic from browser requires a bridge device
    // If the client has a Bluetooth-to-TCP adapter, we connect via TCP
    
    if (config.bridgeIpAddress) {
      console.log('🌉 Using Bluetooth-to-TCP bridge adapter');
      return this.connectTCP(config);
    }
    
    console.warn('⚠️ Bluetooth Classic requires a bridge adapter with IP address');
    return false;
  }

  /**
   * Disconnect from printer
   */
  async disconnect(): Promise<void> {
    if (this.bluetoothDevice?.gatt?.connected) {
      this.bluetoothDevice.gatt.disconnect();
      console.log('🔵 Bluetooth disconnected');
    }
    
    if (this.tcpSocket?.readyState === WebSocket.OPEN) {
      this.tcpSocket.close();
      console.log('🌐 TCP socket closed');
    }
    
    this.connected = false;
    this.currentConnection = null;
    this.bluetoothDevice = null;
    this.bluetoothCharacteristic = null;
    this.tcpSocket = null;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Print a label
   */
  async print(labelData: any): Promise<boolean> {
    console.log('🖨️ UniversalPrinter: Print request');
    
    if (!this.connected) {
      console.warn('⚠️ Printer not connected, attempting to connect...');
      const connected = await this.connect();
      if (!connected) {
        console.error('❌ Failed to connect to printer');
        return false;
      }
    }

    try {
      // Convert to LabelPrintData format
      const printData = await this.convertToLabelPrintData(labelData);
      
      // Save to database first (get labelId for QR code)
      const labelId = await saveLabelToDatabase(printData);
      if (!labelId) {
        throw new Error('Failed to save label to database');
      }
      
      printData.labelId = labelId;
      console.log(`💾 Label saved to database with ID: ${labelId}`);
      
      // Detect protocol if set to auto
      let protocol = this.settings.protocol;
      if (protocol === 'auto') {
        protocol = this.detectProtocol(this.settings.model || this.settings.name);
        console.log(`🔍 Auto-detected protocol: ${protocol}`);
      }
      
      // Generate print commands
      let commands: Uint8Array;
      
      if (protocol === 'zpl') {
        const zplString = this.generateZPL(printData);
        commands = new Uint8Array(this.stringToBytes(zplString));
      } else if (protocol === 'escpos') {
        commands = this.generateESCPOS(printData);
      } else {
        throw new Error(`Unsupported protocol: ${protocol}`);
      }
      
      console.log(`📄 Generated ${protocol.toUpperCase()} commands (${commands.length} bytes)`);
      
      // Send to printer based on connection type
      await this.sendToPrinter(commands);
      
      console.log('✅ Print successful');
      return true;
      
    } catch (error) {
      console.error('❌ Print error:', error);
      return false;
    }
  }

  /**
   * Print multiple labels
   */
  async printBatch(labels: any[]): Promise<boolean> {
    console.log(`🖨️ UniversalPrinter: Batch print (${labels.length} labels)`);
    
    for (let i = 0; i < labels.length; i++) {
      console.log(`📄 Printing label ${i + 1}/${labels.length}`);
      const success = await this.print(labels[i]);
      if (!success) {
        console.error(`❌ Failed to print label ${i + 1}`);
        return false;
      }
      
      // Small delay between prints
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ Batch print successful');
    return true;
  }

  /**
   * Send raw commands to printer
   */
  private async sendToPrinter(commands: Uint8Array): Promise<void> {
    if (this.currentConnection === 'bluetooth-le' && this.bluetoothCharacteristic) {
      // Send via Bluetooth LE
      await this.sendViaBluetooth(commands);
    } else if (this.tcpSocket && this.tcpSocket.readyState === WebSocket.OPEN) {
      // Send via TCP/WebSocket
      await this.sendViaTCP(commands);
    } else {
      throw new Error('No active connection available');
    }
  }

  /**
   * Send data via Bluetooth LE
   */
  private async sendViaBluetooth(data: Uint8Array): Promise<void> {
    if (!this.bluetoothCharacteristic) {
      throw new Error('Bluetooth characteristic not available');
    }

    // Send in chunks (Bluetooth MTU limit is typically 512 bytes)
    const chunkSize = 512;
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
      await this.bluetoothCharacteristic.writeValue(chunk);
      
      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Send data via TCP/WebSocket
   */
  private async sendViaTCP(data: Uint8Array): Promise<void> {
    if (!this.tcpSocket || this.tcpSocket.readyState !== WebSocket.OPEN) {
      throw new Error('TCP socket not available');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('TCP send timeout'));
      }, 10000);

      this.tcpSocket!.send(data);
      
      // Wait for confirmation (simple approach)
      setTimeout(() => {
        clearTimeout(timeout);
        resolve();
      }, 500);
    });
  }

  /**
   * Generate ZPL commands for Zebra printers
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
      organizationId
    } = data;

    // QR code data including labelId
    const qrData = JSON.stringify({
      labelId,
      product: productName,
      prep: prepDate,
      exp: expiryDate,
      org: organizationId
    });

    const allergenText = allergens && allergens.length > 0
      ? allergens.map(a => a.name).join(', ')
      : '';

    return `
^XA
^CF0,30
^FO50,30^A0N,40,40^FD${productName}^FS
^FO50,80^A0N,25,25^FD${categoryName || ''}^FS
^FO50,120^A0N,20,20^FDPrep: ${prepDate || ''}^FS
^FO50,150^A0N,20,20^FDExp: ${expiryDate || ''}^FS
^FO50,180^A0N,20,20^FDBy: ${preparedByName || ''}^FS
${quantity ? `^FO50,210^A0N,20,20^FD${quantity} ${unit || ''}^FS` : ''}
^FO50,240^A0N,20,20^FD${condition || ''}^FS
${allergenText ? `^FO50,270^A0N,18,18^FDAllergens: ${allergenText}^FS` : ''}
^FO450,50^BQN,2,6^FDQA,${qrData}^FS
^XZ
    `.trim();
  }

  /**
   * Generate ESC/POS commands
   */
  private generateESCPOS(data: LabelPrintData): Uint8Array {
    const commands: number[] = [];
    
    // Initialize
    commands.push(0x1B, 0x40); // ESC @ - Initialize
    
    // Product name (large, bold)
    commands.push(0x1D, 0x21, 0x11); // Double size
    commands.push(0x1B, 0x45, 0x01); // Bold on
    commands.push(...this.stringToBytes(data.productName + '\n'));
    commands.push(0x1B, 0x45, 0x00); // Bold off
    commands.push(0x1D, 0x21, 0x00); // Normal size
    
    // Details
    if (data.categoryName) {
      commands.push(...this.stringToBytes(`${data.categoryName}\n`));
    }
    commands.push(...this.stringToBytes(`Prep: ${data.prepDate || ''}\n`));
    commands.push(...this.stringToBytes(`Exp: ${data.expiryDate || ''}\n`));
    commands.push(...this.stringToBytes(`By: ${data.preparedByName || ''}\n`));
    
    if (data.quantity) {
      commands.push(...this.stringToBytes(`Qty: ${data.quantity} ${data.unit || ''}\n`));
    }
    
    // QR Code
    const qrData = JSON.stringify({
      labelId: data.labelId,
      product: data.productName,
      prep: data.prepDate,
      exp: data.expiryDate
    });
    
    const qrBytes = this.stringToBytes(qrData);
    const qrLength = qrBytes.length + 3;
    const pL = qrLength % 256;
    const pH = Math.floor(qrLength / 256);
    
    commands.push(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00); // Model 2
    commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x06); // Size
    commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31); // Error correction
    commands.push(0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30); // Store data
    commands.push(...qrBytes);
    commands.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30); // Print QR
    
    // Cut paper
    commands.push(0x0A, 0x0A);
    commands.push(0x1D, 0x56, 0x00);
    
    return new Uint8Array(commands);
  }

  /**
   * Convert string to byte array
   */
  private stringToBytes(str: string): number[] {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(str));
  }

  /**
   * Convert label data to LabelPrintData format
   */
  private async convertToLabelPrintData(labelData: any): Promise<LabelPrintData> {
    // Import supabase to get user/org info
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    let organizationId = labelData.organizationId;
    let preparedBy = labelData.preparedBy;
    let preparedByName = labelData.preparedByName;
    
    if (user && !organizationId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, display_name')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        organizationId = profile.organization_id;
        preparedBy = preparedBy || user.id;
        preparedByName = preparedByName || profile.display_name || 'Unknown';
      }
    }

    return {
      productId: labelData.productId,
      productName: labelData.productName,
      categoryId: labelData.categoryId,
      categoryName: labelData.categoryName,
      subcategoryId: labelData.subcategoryId || null,
      prepDate: labelData.prepDate || labelData.preparedDate,
      expiryDate: labelData.expiryDate || labelData.useByDate,
      allergens: labelData.allergens || [],
      preparedBy: preparedBy || 'unknown',
      preparedByName: preparedByName || 'Unknown',
      quantity: labelData.quantity,
      unit: labelData.unit,
      condition: labelData.condition || 'Fresh',
      organizationId: organizationId || 'unknown',
      batchNumber: labelData.batchNumber || 'N/A'
    };
  }

  /**
   * Get current settings
   */
  getSettings(): PrinterSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  async updateSettings(settings: Partial<PrinterSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    
    // Reconnect if connection settings changed
    if (settings.connectionConfig || settings.connectionType) {
      await this.disconnect();
    }
  }

  /**
   * Get printer status
   */
  async getStatus(): Promise<PrinterStatus> {
    return {
      isReady: this.connected,
      paperOut: false,
      connectionType: this.currentConnection || undefined,
      lastConnected: this.connected ? new Date() : undefined
    };
  }

  /**
   * Discover printers on network (TCP/IP)
   */
  async discover(): Promise<DiscoveredPrinter[]> {
    console.log('🔍 Discovering printers...');
    
    // This would typically use a discovery protocol
    // For now, return empty array
    // Implementation would require a backend service to scan network
    
    return [];
  }
}
