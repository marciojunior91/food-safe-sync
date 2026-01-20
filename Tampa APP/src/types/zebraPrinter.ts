/**
 * Zebra Printer Management Types
 * Based on: Documento Técnico — Integração iPad (iOS) + Zebra ZD411
 * Version: 1.0
 */

export type ConnectionType = 'bluetooth' | 'wifi' | 'usb';
export type PrinterStatus = 'ready' | 'busy' | 'offline' | 'error' | 'paused';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'failed';

/**
 * Zebra Printer Configuration
 * Stores printer details for connection management
 */
export interface ZebraPrinterConfig {
  id: string; // Unique identifier (UUID)
  name: string; // User-friendly name (e.g., "ZD411-Kitchen")
  model: string; // "ZD411", "ZD620", etc.
  serialNumber: string; // Zebra serial number
  
  // Connection details
  connectionType: ConnectionType;
  
  // Bluetooth specific
  bluetoothAddress?: string; // MAC address
  bluetoothName?: string; // Device name from pairing
  
  // Wi-Fi / Network specific
  ipAddress?: string; // e.g., "192.168.1.100"
  port?: number; // Default: 9100 (Web Services) or 6101 (Browser Print)
  
  // Physical location
  location?: string; // e.g., "Kitchen Station 1"
  station?: string; // Workstation identifier
  
  // Settings
  paperWidth: number; // in mm (default: 102)
  paperHeight: number; // in mm (default: 152)
  dpi: number; // 203 or 300
  darkness: number; // 0-30 (print darkness)
  speed: number; // 2-12 (print speed)
  
  // State
  status: PrinterStatus;
  lastSeen?: string; // ISO timestamp
  isDefault: boolean; // Default printer for this station
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  organizationId: string; // RLS
}

/**
 * Connection Attempt Result
 */
export interface ConnectionResult {
  success: boolean;
  status: ConnectionStatus;
  printer?: ZebraPrinterConfig;
  error?: string;
  latency?: number; // ms
  timestamp: string;
}

/**
 * Print Job Request
 */
export interface ZebraPrintJob {
  id: string; // Job UUID
  labelId?: string; // From printed_labels table
  printerId: string; // Target printer
  zpl: string; // ZPL code to print
  quantity: number;
  priority: 'low' | 'normal' | 'high';
  
  // Metadata
  createdBy: string; // User ID
  createdAt: string;
  status: 'pending' | 'printing' | 'completed' | 'failed' | 'cancelled';
}

/**
 * Print Job Result (for audit)
 */
export interface PrintJobResult {
  jobId: string;
  labelId?: string;
  printerId: string;
  printerName: string;
  status: 'success' | 'failed' | 'partial';
  printedAt: string;
  printedBy: string;
  error?: string;
  latency?: number; // ms
  retryCount?: number;
}

/**
 * Printer Discovery Result
 */
export interface DiscoveredPrinter {
  name: string;
  model?: string;
  serialNumber?: string;
  connectionType: ConnectionType;
  
  // Connection details
  bluetoothAddress?: string;
  ipAddress?: string;
  port?: number;
  
  // Signal strength (if available)
  rssi?: number; // Bluetooth signal strength
  
  // Discovery metadata
  discoveredAt: string;
}

/**
 * Printer Statistics (for monitoring)
 */
export interface PrinterStats {
  printerId: string;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  averageLatency: number; // ms
  lastJobAt?: string;
  uptime?: number; // percentage
}

/**
 * WebSocket Port Configuration
 * For multi-port fallback strategy
 */
export interface PortConfig {
  port: number;
  name: string;
  protocol: 'WebSocket' | 'TCP' | 'Bluetooth';
  description: string;
  requiresFeature?: string; // e.g., "Web Services"
}

/**
 * Available Ports for Zebra Printers
 */
export const ZEBRA_PORTS: PortConfig[] = [
  {
    port: 6101,
    name: 'Zebra Browser Print',
    protocol: 'WebSocket',
    description: 'Primary port for browser-based printing and Zebra Printer Setup app',
  },
  {
    port: 9100,
    name: 'Web Services',
    protocol: 'WebSocket',
    description: 'Link-OS Web Services (requires feature enabled on printer)',
    requiresFeature: 'Web Services',
  },
  {
    port: 9200,
    name: 'Setup Utilities',
    protocol: 'WebSocket',
    description: 'Zebra Setup Utilities port',
  },
];
