// PrinterFactory — creates printer driver instances.
//
// Tampa APP supports two printing transports, both browser-direct (no local
// server / no install required):
//   - 'bluetooth' → BluetoothUniversalPrinter (Web Bluetooth, BLE)
//   - 'webusb'   → WebUsbPrinter            (WebUSB, USB OTG cable)
//
// TCP/IP / network printing was removed in favor of these two paths.

import { PrinterDriver, PrinterType, PrinterSettings } from '@/types/printer';
import { BluetoothUniversalPrinter } from './BluetoothUniversalPrinter';
import { WebUsbPrinter } from './WebUsbPrinter';

export class PrinterFactory {
  static createPrinter(type: PrinterType, settings?: Partial<PrinterSettings>): PrinterDriver {
    switch (type) {
      case 'bluetooth':
        return new BluetoothUniversalPrinter(
          settings?.name || 'Bluetooth Printer',
          settings,
          'auto',
        );

      case 'webusb':
        return new WebUsbPrinter(
          settings?.name || 'USB Printer',
          settings,
          'auto',
        );

      default:
        throw new Error(`Unknown printer type: ${type}. Expected 'bluetooth' or 'webusb'.`);
    }
  }

  static getAvailablePrinters(): Array<{ type: PrinterType; name: string; description: string }> {
    return [
      {
        type: 'bluetooth',
        name: 'Bluetooth Printer (Recommended)',
        description: 'Wireless via Web Bluetooth — works on Chrome (Android, Windows, Mac, Linux). Best for tablet POS.',
      },
      {
        type: 'webusb',
        name: 'USB Printer',
        description: 'Wired via WebUSB — fallback when the printer has no Bluetooth. Chrome / Edge only.',
      },
    ];
  }

  static getDefaultSettings(type: PrinterType): PrinterSettings {
    const base: PrinterSettings = {
      type,
      name: '',
      paperWidth: 50,
      paperHeight: 50,
      defaultQuantity: 1,
      darkness: 20,
      speed: 4,
    };

    switch (type) {
      case 'bluetooth':
        return {
          ...base,
          name: 'Bluetooth Printer',
          connectionType: 'bluetooth-le',
          protocol: 'auto',
        };

      case 'webusb':
        return {
          ...base,
          name: 'USB Printer',
          connectionType: 'usb',
          protocol: 'auto',
        };

      default:
        return base;
    }
  }
}
