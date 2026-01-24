// PrinterFactory - Factory pattern for creating printer instances
import { PrinterDriver, PrinterType, PrinterSettings } from '@/types/printer';
import { GenericPrinter } from './GenericPrinter';
import { PDFPrinter } from './PDFPrinter';
import { ZebraPrinter } from './ZebraPrinter';
import { BluetoothUniversalPrinter } from './BluetoothUniversalPrinter'; // NEW: Universal Bluetooth support
// import { BluetoothZebraPrinter } from './BluetoothZebraPrinter'; // OLD: Zebra-only

export class PrinterFactory {
  static createPrinter(type: PrinterType, settings?: Partial<PrinterSettings>): PrinterDriver {
    switch (type) {
      case 'generic':
        return new GenericPrinter(settings?.name || 'Browser Print', settings);
      
      case 'pdf':
        return new PDFPrinter(settings?.name || 'PDF Export', settings);
      
      case 'zebra':
        return new ZebraPrinter(settings?.name || 'Zebra Thermal', settings);
      
      case 'bluetooth':
        // NEW: Universal Bluetooth support (Zebra, ESC/POS, etc.)
        return new BluetoothUniversalPrinter(
          settings?.name || 'Bluetooth Printer', 
          settings,
          'auto' // Auto-detect protocol (ZPL or ESC/POS)
        );
      
      default:
        throw new Error(`Unknown printer type: ${type}`);
    }
  }

  static getAvailablePrinters(): Array<{ type: PrinterType; name: string; description: string }> {
    return [
      {
        type: 'bluetooth',
        name: 'Bluetooth Printer',
        description: '🔵 ANY Bluetooth thermal printer (Zebra, MPT-II, Xprinter, ESC/POS, etc.)'
      },
      {
        type: 'zebra',
        name: 'Zebra Network',
        description: '🌐 Network connection to Zebra printer via IP address'
      },
      {
        type: 'pdf',
        name: 'PDF Export',
        description: '📄 Generate PDF files for labels (for testing or manual printing)'
      },
      {
        type: 'generic',
        name: 'Browser Print',
        description: '🖨️ Use your browser\'s print dialog (fallback option)'
      }
    ];
  }

  static getDefaultSettings(type: PrinterType): PrinterSettings {
    const baseSettings = {
      type,
      name: '',
      paperWidth: 102,
      paperHeight: 180,
      defaultQuantity: 1
    };

    switch (type) {
      case 'generic':
        return {
          ...baseSettings,
          name: 'Browser Print'
        };
      
      case 'pdf':
        return {
          ...baseSettings,
          name: 'PDF Export'
        };
      
      case 'zebra':
        return {
          ...baseSettings,
          name: 'Zebra Network',
          ipAddress: '192.168.1.100',
          port: 9100,
          darkness: 20,
          speed: 4
        };
      
      case 'bluetooth':
        return {
          ...baseSettings,
          name: 'Bluetooth Printer',
          darkness: 20,
          speed: 4
        };
      
      default:
        return baseSettings;
    }
  }
}

