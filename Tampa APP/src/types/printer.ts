// Printer type definitions for Tampa APP
// Supports Zebra thermal printers, PDF export, Bluetooth, and generic browser printing

export type PrinterType = 'zebra' | 'pdf' | 'generic' | 'bluetooth';

export interface PrinterCapabilities {
  supportsZPL: boolean;
  supportsPDF: boolean;
  supportsColor: boolean;
  maxWidth: number; // in dots or mm
  maxHeight: number;
}

export interface PrintJob {
  id: string;
  labelData: any; // Will use LabelData from labels.ts
  timestamp: Date;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  error?: string;
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
}

export interface PrinterSettings {
  type: PrinterType;
  name: string;
  ipAddress?: string; // For network Zebra printers
  port?: number;
  paperWidth: number; // in mm
  paperHeight: number;
  darkness?: number; // 0-30 for Zebra
  speed?: number; // Print speed
  defaultQuantity: number;
}

export interface PrinterStatus {
  isReady: boolean;
  paperOut: boolean;
  ribbonOut?: boolean;
  error?: string;
  temperature?: number;
}
