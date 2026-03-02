// PrinterFactory - Factory pattern for creating printer instances
import { PrinterDriver, PrinterType, PrinterSettings } from '@/types/printer';
import { GenericPrinter } from './GenericPrinter';
import { PDFPrinter } from './PDFPrinter';
import { ZebraPrinter } from './ZebraPrinter';
import { BluetoothUniversalPrinter } from './BluetoothUniversalPrinter'; // Universal Bluetooth support
import { UniversalPrinter } from './UniversalPrinter'; // NEW: Multi-connection universal printer
// import { BluetoothZebraPrinter } from './BluetoothZebraPrinter'; // OLD: Zebra-only

export class PrinterFactory {
  static createPrinter(type: PrinterType, settings?: Partial<PrinterSettings>): PrinterDriver {
    console.log(`🏭 PrinterFactory: Creating ${type} printer...`, settings);
    
    switch (type) {
      case 'generic':
        console.log('✅ PrinterFactory: Instantiating GenericPrinter');
        return new GenericPrinter(settings?.name || 'Browser Print', settings);
      
      case 'pdf':
        console.log('✅ PrinterFactory: Instantiating PDFPrinter');
        return new PDFPrinter(settings?.name || 'PDF Export', settings);
      
      case 'zebra':
        console.log('✅ PrinterFactory: Instantiating ZebraPrinter (Legacy)');
        return new ZebraPrinter(settings?.name || 'Zebra Thermal', settings);
      
      case 'bluetooth':
        // Universal Bluetooth support (Zebra, ESC/POS, etc.)
        console.log('✅ PrinterFactory: Instantiating BluetoothUniversalPrinter');
        return new BluetoothUniversalPrinter(
          settings?.name || 'Bluetooth Printer', 
          settings,
          'auto' // Auto-detect protocol (ZPL or ESC/POS)
        );
      
      case 'universal':
        // NEW: Multi-connection universal printer (Bluetooth LE, TCP/IP, Bridge, etc.)
        console.log('✅ PrinterFactory: Instantiating UniversalPrinter');
        return new UniversalPrinter(
          settings?.name || 'Universal Printer',
          settings
        );
      
      default:
        throw new Error(`Unknown printer type: ${type}`);
    }
  }

  static getAvailablePrinters(): Array<{ type: PrinterType; name: string; description: string }> {
    return [
      {
        type: 'universal',
        name: 'Universal Printer (Recommended)',
        description: '⭐ Multi-connection: Bluetooth, TCP/IP, WiFi, Bridge adapters - Perfect for Zebra D411 with adapter!'
      },
      {
        type: 'bluetooth',
        name: 'Bluetooth Printer',
        description: '🔵 Bluetooth-only thermal printer (Zebra BLE, MPT-II, Xprinter, ESC/POS)'
      },
      {
        type: 'zebra',
        name: 'Zebra Network (Legacy)',
        description: '🌐 Network connection to Zebra printer via IP address only'
      },
      {
        type: 'pdf',
        name: 'PDF Export',
        description: '📄 Generate PDF files for labels (testing or manual printing)'
      },
      {
        type: 'generic',
        name: 'Browser Print',
        description: '🖨️ Use browser print dialog (basic fallback)'
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
          speed: 4,
          connectionType: 'tcp-ip',
          protocol: 'zpl'
        };
      
      case 'bluetooth':
        return {
          ...baseSettings,
          name: 'Bluetooth Printer',
          darkness: 20,
          speed: 4,
          connectionType: 'bluetooth-le',
          protocol: 'auto'
        };
      
      case 'universal':
        return {
          ...baseSettings,
          name: 'Universal Printer',
          model: 'Zebra D411',
          manufacturer: 'Zebra',
          darkness: 20,
          speed: 4,
          dpi: 203,
          protocol: 'auto',
          connectionType: 'tcp-ip',
          connectionConfig: {
            ipAddress: '192.168.1.100',
            port: 9100,
            preferredConnection: 'tcp-ip',
            fallbackConnections: ['bluetooth-le', 'wifi'],
            autoReconnect: true,
            timeout: 5000
          }
        };
      
      default:
        return baseSettings;
    }
  }
}

