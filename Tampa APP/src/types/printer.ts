// Printer type definitions for Tampa APP.
//
// Two driver types are supported, both browser-direct (no local server):
//   - 'bluetooth' → Web Bluetooth (BLE)
//   - 'webusb'   → WebUSB (USB OTG cable)

export type PrinterType = 'bluetooth' | 'webusb';

export type ConnectionType =
  | 'bluetooth-le'        // Bluetooth Low Energy
  | 'bluetooth-classic'   // Bluetooth Classic (SPP) — legacy, BLE preferred
  | 'usb';                // WebUSB

export type PrinterProtocol =
  | 'zpl'                 // Zebra Programming Language
  | 'escpos'              // ESC/POS (Epson, Star, MPT-II, Xprinter, …)
  | 'auto';               // Auto-detect from device name / metadata

export interface PrinterCapabilities {
  supportsZPL: boolean;
  supportsPDF: boolean;
  supportsColor: boolean;
  /** Max width in dots (203 DPI) */
  maxWidth: number;
  /** Max height in dots (203 DPI) */
  maxHeight: number;
  supportedProtocols: PrinterProtocol[];
  supportedConnections: ConnectionType[];
}

export interface PrintJob {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  labelData: any;
  timestamp: Date;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  error?: string;
  connectionUsed?: ConnectionType;
}

export interface ConnectionConfig {
  // Bluetooth (Web Bluetooth GATT)
  bluetoothDeviceId?: string;
  bluetoothDeviceName?: string;
  bluetoothServiceUUID?: string;
  bluetoothCharacteristicUUID?: string;

  // USB (WebUSB)
  usbVendorId?: number;
  usbProductId?: number;

  // Behavior
  autoReconnect?: boolean;
  /** Connection timeout in ms */
  timeout?: number;
}

export interface PrinterDriver {
  type: PrinterType;
  name: string;
  capabilities: PrinterCapabilities;

  connect(silent?: boolean): Promise<boolean>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  print(labelData: any): Promise<boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  printBatch(labels: any[]): Promise<boolean>;

  getSettings(): PrinterSettings;
  updateSettings(settings: Partial<PrinterSettings>): Promise<void>;
  getStatus(): Promise<PrinterStatus>;
}

export interface PrinterSettings {
  id?: string;
  type: PrinterType;
  name: string;
  model?: string;
  manufacturer?: string;
  protocol?: PrinterProtocol;
  connectionType?: ConnectionType;
  connectionConfig?: ConnectionConfig;

  /** Paper width in millimetres (default: 50) */
  paperWidth: number;
  /** Paper height in millimetres (default: 50) */
  paperHeight: number;

  /** Zebra-only darkness, 0–30 */
  darkness?: number;
  /** Print speed (Zebra: 2–12) */
  speed?: number;
  /** Dots per inch (203 / 300 / 600) */
  dpi?: number;

  defaultQuantity: number;
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
  /** RSSI for BLE devices, if known */
  signalStrength?: number;
  capabilities?: Partial<PrinterCapabilities>;
}
