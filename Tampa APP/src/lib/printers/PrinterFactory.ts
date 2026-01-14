// PrinterFactory - Factory pattern for creating printer instances
import { PrinterDriver, PrinterType, PrinterSettings } from '@/types/printer';
import { GenericPrinter } from './GenericPrinter';
import { PDFPrinter } from './PDFPrinter';
import { ZebraPrinter } from './ZebraPrinter';

export class PrinterFactory {
  static createPrinter(type: PrinterType, settings?: Partial<PrinterSettings>): PrinterDriver {
    switch (type) {
      case 'generic':
        return new GenericPrinter(settings?.name || 'Browser Print', settings);
      
      case 'pdf':
        return new PDFPrinter(settings?.name || 'PDF Export', settings);
      
      case 'zebra':
        return new ZebraPrinter(settings?.name || 'Zebra Thermal', settings);
      
      default:
        throw new Error(`Unknown printer type: ${type}`);
    }
  }

  static getAvailablePrinters(): Array<{ type: PrinterType; name: string; description: string }> {
    return [
      {
        type: 'generic',
        name: 'Browser Print',
        description: 'Use your browser\'s print dialog to print labels'
      },
      {
        type: 'pdf',
        name: 'PDF Export',
        description: 'Generate PDF files for labels'
      },
      {
        type: 'zebra',
        name: 'Zebra Thermal',
        description: 'Direct printing to Zebra thermal printers (ZPL format)'
      }
    ];
  }

  static getDefaultSettings(type: PrinterType): PrinterSettings {
    const baseSettings = {
      type,
      name: '',
      paperWidth: 102,
      paperHeight: 180, // Increased from 152 to 180mm to accommodate full label content
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
          name: 'Zebra Thermal',
          ipAddress: '192.168.1.100',
          port: 9100,
          darkness: 20,
          speed: 4
        };
      
      default:
        return baseSettings;
    }
  }
}
