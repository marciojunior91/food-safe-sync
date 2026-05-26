// WebUSB thermal printer driver — fallback when the printer has no
// Bluetooth module (or when the customer's device has no BLE). Works in
// Chrome / Edge / Chrome-on-Android with a USB OTG cable. Same ZPL/ESC-POS
// payload as the Bluetooth path so labels look identical regardless of
// transport.
//
// Browser support: navigator.usb (Chrome, Edge, Opera, Samsung Internet).
// NOT supported on iOS Safari / Firefox.
//
// Windows note: most USB thermal printers come with a kernel-mode printer
// driver that claims the USB interface, blocking WebUSB. On Android and
// Chrome OS this is not an issue (no kernel claims the interface), so the
// realistic happy path is "Android tablet + USB OTG + printer."

import type {
  PrinterDriver,
  PrinterSettings,
  PrinterCapabilities,
  PrinterStatus,
} from '@/types/printer';
import type { LabelPrintData } from '@/utils/zebraPrinter';
import { generateLabelZPL, formatDateDMY } from '@/utils/labelZpl';
import {
  loadUsbPrinterCache,
  saveUsbPrinterCache,
  clearUsbPrinterCache,
  findCachedUsbDevice,
} from './webUsbPrinterCache';

export const WEBUSB_PRINTER_STATUS_EVENT = 'webusb-printer-status';

export interface WebUsbPrinterStatusDetail {
  connected: boolean;
  deviceName?: string;
  reason?: string;
}

function emitStatus(detail: WebUsbPrinterStatusDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<WebUsbPrinterStatusDetail>(
    WEBUSB_PRINTER_STATUS_EVENT,
    { detail }
  ));
}

// Common USB Vendor IDs for thermal printers — used in the picker filter so
// the user only sees relevant devices (instead of every USB peripheral).
const KNOWN_VENDOR_IDS = [
  0x0A5F, // Zebra
  0x04B8, // Epson
  0x0519, // Star Micronics
  0x04F9, // Brother
  0x0DD4, // Custom America
  0x154F, // SNBC
  0x0FE6, // ICS Advent (used by some generic ESC/POS)
  0x28E9, // Misc Chinese ESC/POS printers (MPT-II family)
];

export type UsbPrinterProtocol = 'zpl' | 'escpos' | 'auto';

export class WebUsbPrinter implements PrinterDriver {
  type: 'webusb' = 'webusb';
  name: string;
  protocol: UsbPrinterProtocol = 'auto';
  capabilities: PrinterCapabilities = {
    supportsZPL: true,
    supportsPDF: false,
    supportsColor: false,
    maxWidth: 832,
    maxHeight: 1368,
    supportedProtocols: ['zpl', 'escpos', 'auto'],
    supportedConnections: ['usb'],
  };

  private settings: PrinterSettings;
  private device: USBDevice | null = null;
  private endpointOut: number | null = null;
  private interfaceNumber: number | null = null;

  constructor(name: string, settings?: Partial<PrinterSettings>, protocol: UsbPrinterProtocol = 'auto') {
    this.name = name;
    this.protocol = protocol;
    this.settings = {
      type: 'webusb',
      name,
      paperWidth: 50,
      paperHeight: 50,
      defaultQuantity: 1,
      darkness: 20,
      speed: 4,
      ...settings,
    };
  }

  /**
   * Detect ZPL vs ESC/POS from the device's manufacturer/product string.
   */
  private detectProtocol(device: USBDevice): UsbPrinterProtocol {
    const mfr = (device.manufacturerName || '').toLowerCase();
    const prod = (device.productName || '').toLowerCase();
    const haystack = `${mfr} ${prod}`;

    if (haystack.includes('zebra') || haystack.includes(' zd') || haystack.includes(' zt')) {
      return 'zpl';
    }
    if (
      haystack.includes('mpt') || haystack.includes('xprinter') || haystack.includes('epson') ||
      haystack.includes('star') || haystack.includes('thermal') || haystack.includes('pos') ||
      haystack.includes('rongta') || haystack.includes('hprt') || haystack.includes('brother')
    ) {
      return 'escpos';
    }
    // When in doubt, ZPL (matches Bluetooth driver's bias toward Zebra)
    return 'zpl';
  }

  private generateZPL(data: LabelPrintData): string {
    return generateLabelZPL(data, {
      widthMm: this.settings.paperWidth || 50,
      heightMm: this.settings.paperHeight || 50,
      dpi: this.settings.dpi || 203,
    });
  }

  private generateESCPOS(data: LabelPrintData): Uint8Array {
    // Mirror BluetoothUniversalPrinter ESC/POS layout — same look as ZPL.
    const {
      productName, categoryName, subcategoryName, condition,
      prepDate, expiryDate, preparedByName, quantity, unit, allergens,
    } = data;

    const enc = new TextEncoder();
    const bytes = (s: string) => Array.from(enc.encode(s));
    const cmd: number[] = [];
    const sep = '------------------------------\n';

    cmd.push(0x1B, 0x40);              // ESC @ - init
    cmd.push(0x1B, 0x61, 0x00);         // ESC a 0 - left align

    // Title (triple size + bold)
    cmd.push(0x1D, 0x21, 0x22);
    cmd.push(0x1B, 0x45, 0x01);
    cmd.push(...bytes(productName + '\n'));
    cmd.push(0x1B, 0x45, 0x00);
    cmd.push(0x1D, 0x21, 0x00);

    const catParts: string[] = [];
    if (categoryName) catParts.push(categoryName);
    if (subcategoryName) catParts.push(subcategoryName);
    if (catParts.length) cmd.push(...bytes(catParts.join(' - ') + '\n'));

    cmd.push(...bytes(sep));

    // Dates (bold + double height)
    cmd.push(0x1D, 0x21, 0x01);
    cmd.push(0x1B, 0x45, 0x01);
    cmd.push(...bytes(`PREPARED DATE: ${formatDateDMY(prepDate)}\n`));
    cmd.push(...bytes(`EXPIRE DATE: ${formatDateDMY(expiryDate)}\n`));
    cmd.push(0x1B, 0x45, 0x00);
    cmd.push(0x1D, 0x21, 0x00);

    cmd.push(...bytes(sep));

    cmd.push(...bytes(`PRINTED BY: ${preparedByName || 'Unknown'}\n`));
    if (quantity) {
      cmd.push(...bytes(`QUANTITY: ${quantity}${unit ? ' ' + unit.toUpperCase() : ''}\n`));
    }
    if (condition) {
      cmd.push(...bytes(`CONDITION: ${condition.toUpperCase()}\n`));
    }

    if (allergens && allergens.length > 0) {
      cmd.push(...bytes(sep));
      cmd.push(0x1B, 0x45, 0x01);
      cmd.push(...bytes('ALLERGENS\n'));
      cmd.push(0x1B, 0x45, 0x00);
      cmd.push(...bytes(allergens.map(a => a.name.toUpperCase()).join(', ') + '\n'));
    }

    cmd.push(0x0A, 0x0A, 0x0A);
    cmd.push(0x1D, 0x56, 0x00); // cut
    return new Uint8Array(cmd);
  }

  async connect(silent: boolean = false): Promise<boolean> {
    try {
      if (typeof navigator === 'undefined' || !('usb' in navigator)) {
        throw new Error('WebUSB is not supported in this browser. Use Chrome or Edge.');
      }

      // ── Tier 1: cached device (granted permission, no picker) ─────────
      this.device = await findCachedUsbDevice();
      if (this.device) {
        console.log(`🟡 USB cached device: ${this.device.productName || 'Unknown'}`);
      }

      // ── Tier 2: any already-granted device ────────────────────────────
      if (!this.device) {
        const granted = await navigator.usb.getDevices();
        if (granted.length > 0) {
          this.device = granted[0];
          console.log(`🟡 USB previously granted: ${this.device.productName || 'Unknown'}`);
        }
      }

      // ── Tier 3: show picker ───────────────────────────────────────────
      if (!this.device) {
        if (silent) return false;
        console.log('🟡 USB: showing device picker…');
        this.device = await navigator.usb.requestDevice({
          filters: KNOWN_VENDOR_IDS.map(vendorId => ({ vendorId })),
        });
      }

      if (!this.device) throw new Error('No USB device selected');

      // ── Open + claim interface ────────────────────────────────────────
      if (!this.device.opened) await this.device.open();
      if (this.device.configuration === null) await this.device.selectConfiguration(1);

      const { iface, endpointNumber } = findPrinterInterface(this.device);
      this.interfaceNumber = iface;
      this.endpointOut = endpointNumber;

      try {
        await this.device.claimInterface(iface);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.toLowerCase().includes('access denied') || msg.toLowerCase().includes('claim')) {
          throw new Error(
            'USB interface is claimed by another driver (typically the OS printer driver on Windows). ' +
            'Unplug the printer, install WinUSB via Zadig, or use a different OS (Android works out of the box).'
          );
        }
        throw e;
      }

      // ── Detect protocol ───────────────────────────────────────────────
      const cache = loadUsbPrinterCache();
      if (cache?.vendorId === this.device.vendorId && cache.productId === this.device.productId && cache.protocol) {
        this.protocol = cache.protocol;
      } else if (this.protocol === 'auto') {
        this.protocol = this.detectProtocol(this.device);
      }

      saveUsbPrinterCache({
        vendorId: this.device.vendorId,
        productId: this.device.productId,
        deviceName: this.device.productName || 'USB Printer',
        manufacturer: this.device.manufacturerName || undefined,
        protocol: this.protocol,
        endpointOut: this.endpointOut,
        interfaceNumber: this.interfaceNumber,
      });

      console.log(`✅ USB ready (protocol: ${this.protocol.toUpperCase()}, endpoint: ${this.endpointOut})`);
      emitStatus({ connected: true, deviceName: this.device.productName || undefined });

      // Listen for unplug (Chrome fires 'disconnect' on navigator.usb)
      navigator.usb.addEventListener('disconnect', this.handleDisconnect);

      return true;
    } catch (error) {
      console.error('❌ WebUSB connection failed:', error);
      emitStatus({
        connected: false,
        reason: error instanceof Error ? error.message : String(error),
      });
      if (silent) return false;
      throw error;
    }
  }

  private async sendBytes(bytes: Uint8Array): Promise<void> {
    if (!this.device || this.endpointOut === null) {
      throw new Error('WebUSB printer is not connected');
    }
    const CHUNK = 4096; // USB bulk transfer max packet size varies; 4KB is safe
    for (let i = 0; i < bytes.length; i += CHUNK) {
      const slice = bytes.slice(i, Math.min(i + CHUNK, bytes.length));
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const result = await this.device!.transferOut(this.endpointOut, slice);
      if (result.status !== 'ok') {
        throw new Error(`USB transferOut failed with status: ${result.status}`);
      }
    }
  }

  async print(labelData: LabelPrintData): Promise<boolean> {
    if (!this.device || this.endpointOut === null) {
      await this.connect();
    }

    const payload: Uint8Array = this.protocol === 'escpos'
      ? this.generateESCPOS(labelData)
      : new TextEncoder().encode(this.generateZPL(labelData));

    console.log(`🖨️ WebUSB printing (${this.protocol.toUpperCase()}, ${payload.length} bytes): ${labelData.productName}`);
    await this.sendBytes(payload);
    return true;
  }

  async printBatch(labels: LabelPrintData[]): Promise<boolean> {
    if (!this.device || this.endpointOut === null) await this.connect();
    for (const label of labels) {
      const payload: Uint8Array = this.protocol === 'escpos'
        ? this.generateESCPOS(label)
        : new TextEncoder().encode(this.generateZPL(label));
      await this.sendBytes(payload);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return true;
  }

  async disconnect(): Promise<void> {
    if (this.device?.opened) {
      try {
        if (this.interfaceNumber !== null) {
          await this.device.releaseInterface(this.interfaceNumber);
        }
        await this.device.close();
      } catch (e) {
        console.warn('USB disconnect error:', e);
      }
    }
    this.device = null;
    this.endpointOut = null;
    this.interfaceNumber = null;
  }

  isConnected(): boolean {
    return this.device !== null && this.device.opened === true;
  }

  getSettings(): PrinterSettings {
    return this.settings;
  }

  async updateSettings(newSettings: Partial<PrinterSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
  }

  async getStatus(): Promise<PrinterStatus> {
    return {
      isReady: this.isConnected(),
      paperOut: false,
      error: this.isConnected() ? undefined : 'Not connected',
    };
  }

  async test(): Promise<boolean> {
    try {
      const testZPL = `^XA
^FO50,50^A0N,50,50^FDTest Print^FS
^FO50,120^A0N,30,30^FDWebUSB works!^FS
^FO50,170^A0N,25,25^FD${new Date().toLocaleString()}^FS
^XZ`;
      if (this.protocol === 'escpos') {
        const cmd: number[] = [];
        const txt = (s: string) => cmd.push(...Array.from(new TextEncoder().encode(s)));
        cmd.push(0x1B, 0x40);
        cmd.push(0x1B, 0x45, 0x01);
        txt('Test Print\n');
        cmd.push(0x1B, 0x45, 0x00);
        txt('WebUSB works!\n');
        txt(new Date().toLocaleString() + '\n');
        cmd.push(0x0A, 0x0A, 0x0A);
        cmd.push(0x1D, 0x56, 0x00);
        await this.sendBytes(new Uint8Array(cmd));
      } else {
        await this.sendBytes(new TextEncoder().encode(testZPL));
      }
      return true;
    } catch (error) {
      console.error('❌ WebUSB test failed:', error);
      return false;
    }
  }

  /** Bound handler so add/removeListener use the same reference. */
  private handleDisconnect = (event: USBConnectionEvent): void => {
    if (event.device === this.device) {
      console.log('⚠️ USB device disconnected');
      const deviceName = this.device?.productName || undefined;
      this.device = null;
      this.endpointOut = null;
      this.interfaceNumber = null;
      emitStatus({ connected: false, deviceName, reason: 'device unplugged' });
    }
  };

  /** Forget the USB cache so the next connect shows the picker. */
  static forget(): void {
    clearUsbPrinterCache();
  }
}

/**
 * Find the USB interface + bulk-OUT endpoint on a printer device.
 * Thermal printers expose the printer class (interfaceClass = 7) with at
 * least one BULK OUT endpoint. Falls back to the first BULK OUT endpoint
 * on any interface if no class-7 interface is present (some generic
 * ESC/POS devices misreport the class).
 */
function findPrinterInterface(device: USBDevice): { iface: number; endpointNumber: number } {
  const config = device.configuration;
  if (!config) throw new Error('USB device has no active configuration');

  // 1️⃣ Prefer the standard USB printer class (7)
  for (const iface of config.interfaces) {
    for (const alt of iface.alternates) {
      if (alt.interfaceClass === 7) {
        const ep = alt.endpoints.find(e => e.direction === 'out' && e.type === 'bulk');
        if (ep) return { iface: iface.interfaceNumber, endpointNumber: ep.endpointNumber };
      }
    }
  }

  // 2️⃣ Fallback: any bulk OUT endpoint
  for (const iface of config.interfaces) {
    for (const alt of iface.alternates) {
      const ep = alt.endpoints.find(e => e.direction === 'out' && e.type === 'bulk');
      if (ep) return { iface: iface.interfaceNumber, endpointNumber: ep.endpointNumber };
    }
  }

  throw new Error('No bulk OUT endpoint found on this USB device — not a recognized thermal printer');
}
