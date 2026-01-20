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
  serialNumber: string; // Zebra serial number (maps to serial_number in DB)
  
  // Connection details
  connectionType: ConnectionType; // maps to connection_type in DB
  
  // Bluetooth specific
  bluetoothAddress?: string; // MAC address
  bluetoothName?: string; // Device name from pairing
  
  // Wi-Fi / Network specific
  ipAddress?: string; // e.g., "192.168.1.100" (maps to ip_address in DB)
  port?: number; // Default: 9100 (Web Services) or 6101 (Browser Print)
  websocketPort?: number; // WebSocket port (maps to websocket_port in DB)
  
  // Physical location
  location?: string; // e.g., "Kitchen Station 1"
  station?: string; // Workstation identifier
  
  // Settings
  paperWidth?: number; // in mm (default: 102) - maps to label_width_mm in DB
  paperHeight?: number; // in mm (default: 152) - maps to label_height_mm in DB
  dpi?: number; // 203 or 300 - maps to print_density_dpi in DB
  darkness?: number; // 0-30 (print darkness) - maps to default_darkness in DB
  speed?: number; // 2-12 (print speed) - maps to default_print_speed in DB
  
  // State
  status: PrinterStatus;
  lastSeen?: string; // ISO timestamp (maps to last_seen_at in DB)
  isDefault: boolean; // Default printer for this station (maps to is_default in DB)
  enabled?: boolean; // Is printer enabled
  
  // Metadata
  createdAt: string; // maps to created_at in DB
  updatedAt: string; // maps to updated_at in DB
  organizationId: string; // RLS (maps to organization_id in DB)
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
  latencyMs?: number; // ms - alias for latency
  timestamp: string;
  method?: string; // Connection method used
  port?: number; // Port used for connection
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
  id?: string; // Optional unique identifier
  name: string;
  model?: string;
  serialNumber?: string;
  connectionType: ConnectionType;
  
  // Connection details
  bluetoothAddress?: string;
  bluetoothName?: string; // Bluetooth device name
  ipAddress?: string;
  port?: number;
  method?: string; // Discovery method (e.g., "WebSocket", "Bluetooth")
  
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
  avgLatencyMs?: number; // ms - alias for averageLatency
  lastJobAt?: string;
  uptime?: number; // percentage
  uptimePercentage?: number; // percentage - alias for uptime
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
