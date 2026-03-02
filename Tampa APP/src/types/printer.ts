// Printer type definitions for Tampa APP
// Universal printer SDK supporting multiple connection types and protocols

export type PrinterType = 'zebra' | 'pdf' | 'generic' | 'bluetooth' | 'universal';

export type ConnectionType = 
  | 'bluetooth-le'        // Bluetooth Low Energy (BLE)
  | 'bluetooth-classic'   // Bluetooth Classic (SPP)
  | 'tcp-ip'              // TCP/IP network connection
  | 'wifi'                // WiFi direct or network
  | 'usb'                 // USB connection
  | 'bridge'              // Bluetooth-to-TCP bridge/adapter
  | 'cloud'               // Cloud print service
  | 'browser';            // Browser native print

export type PrinterProtocol = 
  | 'zpl'                 // Zebra Programming Language
  | 'escpos'              // ESC/POS (Epson, Star, etc.)
  | 'cpcl'                // Citizen Printer Command Language
  | 'tspl'                // TSC Programming Language
  | 'pdf'                 // PDF generation
  | 'auto';               // Auto-detect protocol

export interface PrinterCapabilities {
  supportsZPL: boolean;
  supportsPDF: boolean;
  supportsColor: boolean;
  maxWidth: number; // in dots or mm
  maxHeight: number;
  supportedProtocols: PrinterProtocol[];
  supportedConnections: ConnectionType[];
}

export interface PrintJob {
  id: string;
  labelData: any; // Will use LabelData from labels.ts
  timestamp: Date;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  error?: string;
  connectionUsed?: ConnectionType;
}

export interface ConnectionConfig {
  // Bluetooth settings
  bluetoothDeviceId?: string;
  bluetoothDeviceName?: string;
  bluetoothServiceUUID?: string;
  bluetoothCharacteristicUUID?: string;
  
  // Network settings (TCP/IP, WiFi)
  ipAddress?: string;
  port?: number;
  hostname?: string;
  
  // Bridge/Adapter settings (for Bluetooth-to-TCP adapters)
  bridgeIpAddress?: string;
  bridgePort?: number;
  bridgeMacAddress?: string;
  
  // USB settings
  usbVendorId?: string;
  usbProductId?: string;
  
  // Connection preferences
  preferredConnection?: ConnectionType;
  fallbackConnections?: ConnectionType[];
  autoReconnect?: boolean;
  timeout?: number; // Connection timeout in ms
}

export interface PrinterDriver {
  // Printer identity
  type: PrinterType;
  name: string;
  capabilities: PrinterCapabilities;
  
  // Core methods
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Printing
  print(labelData: any): Promise<boolean>;
  printBatch(labels: any[]): Promise<boolean>;
  
  // Configuration
  getSettings(): PrinterSettings;
  updateSettings(settings: Partial<PrinterSettings>): Promise<void>;
  
  // Status
  getStatus(): Promise<PrinterStatus>;
  
  // Discovery (optional)
  discover?(): Promise<DiscoveredPrinter[]>;
}

export interface PrinterSettings {
  // Basic info
  id?: string; // Unique identifier for saved printers
  type: PrinterType;
  name: string;
  model?: string; // e.g., "Zebra D411", "Zebra ZD421"
  manufacturer?: string; // e.g., "Zebra", "Epson"
  
  // Protocol settings
  protocol?: PrinterProtocol;
  
  // Connection configuration
  connectionType?: ConnectionType;
  connectionConfig?: ConnectionConfig;
  
  // Paper settings
  paperWidth: number; // in mm
  paperHeight: number;
  
  // Print quality settings
  darkness?: number; // 0-30 for Zebra
  speed?: number; // Print speed
  dpi?: number; // Dots per inch (203, 300, 600)
  
  // Behavior settings
  defaultQuantity: number;
  
  // Legacy compatibility (deprecated - use connectionConfig instead)
  ipAddress?: string;
  port?: number;
}

export interface PrinterStatus {
  isReady: boolean;
  paperOut: boolean;
  ribbonOut?: boolean;
  error?: string;
  temperature?: number;
  connectionType?: ConnectionType;
  lastConnected?: Date;
}

export interface DiscoveredPrinter {
  name: string;
  model?: string;
  manufacturer?: string;
  connectionType: ConnectionType;
  connectionConfig: ConnectionConfig;
  isAvailable: boolean;
  signalStrength?: number; // For wireless connections
  capabilities?: Partial<PrinterCapabilities>;
}
