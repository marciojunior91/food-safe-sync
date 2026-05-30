// BluetoothUniversalPrinter - Works with ANY Bluetooth thermal printer
// Supports: Zebra (ZPL), ESC/POS (MPT-II, Xprinter, Epson, etc.), Generic Bluetooth

import type { PrinterDriver, PrinterSettings, PrinterCapabilities, PrinterStatus } from '@/types/printer';
import type { LabelPrintData } from '@/utils/zebraPrinter';
import { generateLabelZPL, formatDateDMY } from '@/utils/labelZpl';
import {
  loadPrinterCache,
  savePrinterCache,
  findCachedDevice,
} from './bluetoothPrinterCache';

/** Browser-wide event fired when the active Bluetooth connection changes. */
export const BLUETOOTH_PRINTER_STATUS_EVENT = 'bluetooth-printer-status';

export interface BluetoothPrinterStatusDetail {
  connected: boolean;
  deviceName?: string;
  reason?: string;
}

function emitStatus(detail: BluetoothPrinterStatusDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<BluetoothPrinterStatusDetail>(
    BLUETOOTH_PRINTER_STATUS_EVENT,
    { detail }
  ));
}

// ── Module-level singleton ──────────────────────────────────────────────────
// React recreates BluetoothUniversalPrinter instances on every settings reload
// and each usePrinter() context (quick-print, print-queue, label-form) gets
// its own. Without a shared reference, every fresh instance would have to
// re-discover the paired device through navigator.bluetooth.getDevices() —
// an API that returns [] on desktop Chrome unless an experimental flag is on,
// forcing the picker.
//
// Holding the BluetoothDevice + writable characteristic at module scope means:
//   - Picker is shown at most once per page session.
//   - GATT idle drops null only the characteristic; device ref persists, so
//     the next print does device.gatt.connect() silently.
//   - The pair flow in PrinterManagementTab can pre-populate the singleton
//     via setSharedBluetoothDevice() so the first print uses it directly.
let sharedDevice: BluetoothDevice | null = null;
let sharedCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

// Connect-in-flight promise. Two parallel print buttons (e.g. Quick Print +
// Print Queue) used to race into connect() simultaneously — both would see an
// empty singleton, both would call requestDevice() in serial, and the user got
// two pickers. Funneling every connect call through a single shared promise
// removes the race: the second caller waits for the first to finish.
let connectInFlight: Promise<boolean> | null = null;

/** Inject a freshly-picked device into the shared singleton. Called by the
 *  pair flow in PrinterManagementTab so the next print() reuses it without
 *  re-prompting the picker. */
export function setSharedBluetoothDevice(device: BluetoothDevice): void {
  console.log('[BT] singleton ← device', device.name || device.id);
  sharedDevice = device;
  sharedCharacteristic = null; // GATT not opened yet — first print will open it
}

/** Clear the shared singleton (used by Forget). */
export function clearSharedBluetoothDevice(): void {
  console.log('[BT] singleton ← cleared');
  if (sharedDevice?.gatt?.connected) {
    try { sharedDevice.gatt.disconnect(); } catch { /* ignore */ }
  }
  sharedDevice = null;
  sharedCharacteristic = null;
  connectInFlight = null;
}

/** Diagnostic: returns whether the singleton currently holds a paired device. */
export function hasSharedBluetoothDevice(): boolean {
  return !!sharedDevice;
}

// Common Bluetooth Serial Port Profile (SPP) UUID
const SPP_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb';

// Zebra-specific UUIDs
const ZEBRA_SERVICE_UUID = '49535343-fe7d-4ae5-8fa9-9fafd205e455';
const ZEBRA_CHARACTERISTIC_UUID = '49535343-8841-43f4-a8d4-ecbe34729bb3';

// Zebra BLE Parser (ZD411, ZD421, ZD621 + P1112640-017C adapter)
const ZEBRA_BLE_PARSER_SERVICE = '38eb4a80-c570-11e3-9507-0002a5d5c51b';
const ZEBRA_BLE_PARSER_CHAR = '38eb4a82-c570-11e3-9507-0002a5d5c51b';

// All optional services to request during pairing
const ALL_OPTIONAL_SERVICES = [
  ZEBRA_SERVICE_UUID,
  ZEBRA_BLE_PARSER_SERVICE,
  SPP_SERVICE_UUID,
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Nordic UART
  '000018f0-0000-1000-8000-00805f9b34fb', // Zebra BTLE
  '0000ff00-0000-1000-8000-00805f9b34fb', // Generic vendor
  '0000fff0-0000-1000-8000-00805f9b34fb', // Common printer service
  '0000ae30-0000-1000-8000-00805f9b34fb', // Zebra write service
];

export type PrinterProtocol = 'zpl' | 'escpos' | 'auto';

export class BluetoothUniversalPrinter implements PrinterDriver {
  type = 'bluetooth' as const;
  name: string;
  protocol: PrinterProtocol = 'auto';
  capabilities: PrinterCapabilities = {
    supportsZPL: true,
    supportsPDF: false,
    supportsColor: false,
    maxWidth: 832,
    maxHeight: 1368,
    supportedProtocols: ['zpl', 'escpos', 'auto'],
    supportedConnections: ['bluetooth-le', 'bluetooth-classic']
  };
  
  private settings: PrinterSettings;

  // Instance-level proxies into the module-level singleton — every
  // BluetoothUniversalPrinter created in this page shares the same
  // BluetoothDevice + GATT characteristic, so the picker is shown at most
  // once per session regardless of how many printer instances React spawns.
  private get device(): BluetoothDevice | null { return sharedDevice; }
  private set device(d: BluetoothDevice | null) { sharedDevice = d; }
  private get characteristic(): BluetoothRemoteGATTCharacteristic | null { return sharedCharacteristic; }
  private set characteristic(c: BluetoothRemoteGATTCharacteristic | null) { sharedCharacteristic = c; }

  constructor(name: string, settings?: Partial<PrinterSettings>, protocol: PrinterProtocol = 'auto') {
    this.name = name;
    this.protocol = protocol;
    this.settings = {
      type: 'bluetooth',
      name,
      paperWidth: 50, // Standard label: 50mm × 50mm
      paperHeight: 50,
      defaultQuantity: 1,
      darkness: 20,
      speed: 4,
      ...settings
    };
  }

  /**
   * Auto-detect printer protocol based on device name
   */
  private detectProtocol(deviceName: string): PrinterProtocol {
    const name = deviceName.toLowerCase();
    
    console.log(`🔍 Detecting protocol for device: "${deviceName}"`);
    
    // Zebra printers (specific check)
    if (name.includes('zebra') || name.includes('zd') || name.includes('zt')) {
      console.log('🔵 Detected Zebra printer → Using ZPL protocol');
      return 'zpl';
    }
    
    // Common ESC/POS printer brands
    if (
      name.includes('mpt') ||      // MPT-II, MPT-III
      name.includes('xprinter') ||
      name.includes('epson') ||
      name.includes('tm-') ||       // Epson TM series
      name.includes('rp') ||        // RP80, RP326, etc.
      name.includes('pos') ||
      name.includes('thermal') ||
      name.includes('rongta') ||
      name.includes('hprt') ||
      name.includes('mini') ||      // Mini printers
      name.includes('_') ||         // MPT-II_309F has underscore
      name.includes('309')          // MPT-II_309F has 309
    ) {
      console.log('🟢 Detected ESC/POS printer → Using ESC/POS protocol');
      return 'escpos';
    }
    
    // Default to ZPL (client's main printer is Zebra D411 in Australia)
    console.log('⚠️ Unknown printer type → Defaulting to ZPL (Zebra protocol)');
    return 'zpl';
  }

  /**
   * Generate ZPL code for Zebra printers — delegates to the shared generator
   * in @/utils/labelZpl so Bluetooth and TCP/IP produce identical labels.
   */
  private generateZPL(data: LabelPrintData): string {
    return generateLabelZPL(data, {
      widthMm: this.settings.paperWidth || 50,
      heightMm: this.settings.paperHeight || 50,
      dpi: this.settings.dpi || 203,
    });
  }

  /**
   * Generate ESC/POS commands for thermal printers (MPT-II, Xprinter, etc.).
   * Layout matches ZPL layout — no QR code:
   *   PRODUCT NAME (large, bold)
   *   CATEGORY – SUBCATEGORY
   *   ──────────────────────
   *   PREPARED DATE: DD/MM/YYYY
   *   EXPIRE DATE:   DD/MM/YYYY
   *   PRINTED BY:    Name
   *   CONDITION:     REFRIGERATED
   *   ──────────────────────
   *   ALLERGENS
   *   MILK, SHELLFISH
   */
  private generateESCPOS(data: LabelPrintData): Uint8Array {
    const {
      productName,
      categoryName,
      subcategoryName,
      condition,
      prepDate,
      expiryDate,
      preparedByName,
      quantity,
      unit,
      allergens,
    } = data;

    const commands: number[] = [];
    const sep = '------------------------------\n';

    // Initialize printer
    commands.push(0x1B, 0x40); // ESC @ - Initialize
    commands.push(0x1B, 0x61, 0x00); // ESC a 0 - Left align

    // ── PRODUCT NAME (triple size + bold) ──────────────────
    commands.push(0x1D, 0x21, 0x22); // GS ! - Triple width + triple height
    commands.push(0x1B, 0x45, 0x01); // ESC E - Bold on
    commands.push(...this.stringToBytes(productName + '\n'));
    commands.push(0x1B, 0x45, 0x00); // ESC E - Bold off
    commands.push(0x1D, 0x21, 0x00); // GS ! - Normal size

    // ── CATEGORY - SUBCATEGORY ─────────────────────────────
    const catParts: string[] = [];
    if (categoryName) catParts.push(categoryName);
    if (subcategoryName) catParts.push(subcategoryName);
    if (catParts.length > 0) {
      commands.push(...this.stringToBytes(catParts.join(' - ') + '\n'));
    }

    // ── Separator ──────────────────────────────────────────
    commands.push(...this.stringToBytes(sep));

    // ── DATES (BOLD + slightly larger) ─────────────────────
    commands.push(0x1D, 0x21, 0x01); // GS ! - Double height
    commands.push(0x1B, 0x45, 0x01); // Bold on
    commands.push(...this.stringToBytes(`PREPARED DATE: ${formatDateDMY(prepDate)}\n`));
    commands.push(...this.stringToBytes(`EXPIRE DATE: ${formatDateDMY(expiryDate)}\n`));
    commands.push(0x1B, 0x45, 0x00); // Bold off
    commands.push(0x1D, 0x21, 0x00); // Normal size

    // ── Separator between dates and other info ─────────────
    commands.push(...this.stringToBytes(sep));

    // ── BODY ───────────────────────────────────────────────
    commands.push(...this.stringToBytes(`PRINTED BY: ${preparedByName || 'Unknown'}\n`));
    if (quantity) {
      commands.push(...this.stringToBytes(`QUANTITY: ${quantity}${unit ? ' ' + unit.toUpperCase() : ''}\n`));
    }
    if (condition) {
      commands.push(...this.stringToBytes(`CONDITION: ${condition.toUpperCase()}\n`));
    }

    // ── ALLERGENS ──────────────────────────────────────────
    if (allergens && allergens.length > 0) {
      const allergenText = allergens.map(a => a.name.toUpperCase()).join(', ');
      commands.push(...this.stringToBytes(sep));
      commands.push(0x1B, 0x45, 0x01); // Bold on
      commands.push(...this.stringToBytes('ALLERGENS\n'));
      commands.push(0x1B, 0x45, 0x00); // Bold off
      commands.push(...this.stringToBytes(allergenText + '\n'));
    }

    // Feed paper and cut
    commands.push(0x0A, 0x0A, 0x0A);
    commands.push(0x1D, 0x56, 0x00); // GS V - Full cut

    return new Uint8Array(commands);
  }

  /**
   * Helper: Convert string to byte array
   */
  private stringToBytes(str: string): number[] {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(str));
  }

  /**
   * Connect to ANY Bluetooth printer.
   *
   * Lifecycle (fastest path first):
   *   • **Hot reuse** — singleton has a live device + live GATT + characteristic.
   *     Return immediately. Sub-millisecond.
   *   • **Warm reopen** — singleton has the device ref but GATT is closed (idle
   *     drop, sleep, etc.). Open GATT silently; reuse cached service /
   *     characteristic UUIDs if we have them so we skip enumeration. No picker.
   *   • **Cold cache lookup** — singleton empty (fresh page load). Look the
   *     device up by id through navigator.bluetooth.getDevices(); if that works,
   *     proceed as warm. If `getDevices()` fails or returns nothing AND silent
   *     mode is off, show the picker. Silent mode returns false.
   *
   * Whichever path succeeds, the device id + GATT UUIDs are persisted to
   * localStorage so the next page load goes straight to "warm reopen".
   *
   * Concurrency: every call funnels through `connectInFlight` so two parallel
   * print buttons can't open two pickers / race on the same GATT.
   */
  async connect(silent: boolean = false): Promise<boolean> {
    if (connectInFlight) {
      console.log('[BT] connect: joining in-flight attempt');
      return connectInFlight;
    }
    connectInFlight = this.doConnect(silent).finally(() => {
      connectInFlight = null;
    });
    return connectInFlight;
  }

  private async doConnect(silent: boolean): Promise<boolean> {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth is not supported. Please use Chrome on Android.');
      }

      console.log(`[BT] connect(silent=${silent}) — singleton: device=${this.device?.name || this.device?.id || 'none'} characteristic=${this.characteristic ? 'set' : 'none'} gatt=${this.device?.gatt?.connected ? 'open' : 'closed'}`);

      // ── Hot reuse: device + characteristic + GATT all live ───────────────
      if (this.device && this.characteristic && this.device.gatt?.connected) {
        console.log(`[BT] ⚡ hot reuse — ${this.device.name || this.device.id}`);
        emitStatus({ connected: true, deviceName: this.device.name || undefined });
        return true;
      }

      // ── Cold cache lookup: singleton empty, ask the browser by id ────────
      // Only run findCachedDevice() if the singleton is empty — once we have a
      // device ref, we never throw it away (handleDisconnect keeps it).
      if (!this.device) {
        console.log('[BT] singleton empty — checking browser permission registry');
        this.device = await findCachedDevice();
        if (this.device) {
          console.log(`[BT] 🔵 recovered cached device: ${this.device.name || this.device.id}`);
          sharedDevice = this.device;
        }
      }

      // Legacy: navigator.bluetooth.getDevices() may surface other paired
      // devices we didn't write to our cache (e.g. paired before the cache
      // shipped). Fall back to a name match.
      if (!this.device && 'getDevices' in navigator.bluetooth) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const paired: BluetoothDevice[] = await (navigator.bluetooth as any).getDevices();
          const savedName = this.settings.connectionConfig?.bluetoothDeviceName || this.name;
          this.device =
            paired.find(d => d.name === savedName) ??
            paired.find(d => d.name === this.settings.name) ??
            paired[0] ??
            null;
          if (this.device) {
            console.log(`[BT] 🔵 recovered legacy paired device: ${this.device.name || this.device.id}`);
            sharedDevice = this.device;
          }
        } catch (e) {
          console.warn('[BT] getDevices() failed:', e);
        }
      }

      // ── Picker: only if we still have no device AND not silent ──────────
      if (!this.device) {
        if (silent) {
          console.log('[BT] silent reconnect: no cached device, returning false');
          return false;
        }
        console.log('[BT] no paired device — showing Bluetooth picker (first pair)');
        this.device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ALL_OPTIONAL_SERVICES,
        });
        sharedDevice = this.device;
      }

      if (!this.device) throw new Error('No device selected');
      console.log(`[BT] ✅ device ready: ${this.device.name || 'Unknown'}`);

      // Restore protocol from cache if we have one for this device
      const cache = loadPrinterCache();
      if (cache && cache.deviceId === this.device.id && cache.protocol) {
        this.protocol = cache.protocol;
      } else if (this.protocol === 'auto' && this.device.name) {
        this.protocol = this.detectProtocol(this.device.name);
      }

      // ── Warm reopen: open GATT if not already open ──────────────────────
      if (!this.device.gatt?.connected) {
        console.log('[BT] opening GATT server…');
        const server = await this.device.gatt?.connect();
        if (!server) throw new Error('Failed to connect to GATT server');
        console.log('[BT] ✅ GATT server connected');
      } else {
        console.log('[BT] GATT already connected — reusing');
      }

      const server = this.device.gatt;
      if (!server) throw new Error('GATT unavailable after connect');

      // ── Find writable characteristic (cached UUIDs first) ────────────────
      // If the characteristic from a previous connect is still bound to the
      // live GATT, reuse it — `locateWritableCharacteristic` will try the
      // cached UUIDs first and the fast path is one round-trip.
      if (!this.characteristic) {
        this.characteristic = await this.locateWritableCharacteristic(server, cache);
      }

      if (!this.characteristic) {
        throw new Error('No writable characteristic found on this Bluetooth device');
      }
      console.log(`[BT] ✅ characteristic ready (protocol: ${this.protocol.toUpperCase()})`);

      // ── Persist what worked ──────────────────────────────────────────────
      savePrinterCache({
        deviceId: this.device.id,
        deviceName: this.device.name || 'Bluetooth Printer',
        serviceUuid: this.characteristic.service.uuid,
        characteristicUuid: this.characteristic.uuid,
        protocol: this.protocol,
      });

      // ── Listen for disconnection ─────────────────────────────────────────
      this.device.removeEventListener('gattserverdisconnected', this.handleDisconnect);
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect);

      emitStatus({ connected: true, deviceName: this.device.name || undefined });
      return true;

    } catch (error) {
      console.error('[BT] ❌ connect failed:', error);
      emitStatus({
        connected: false,
        reason: error instanceof Error ? error.message : String(error),
      });
      if (silent) return false;
      throw error;
    }
  }

  /**
   * Find a writable GATT characteristic. Tries the cached UUIDs first
   * (fast path — single getPrimaryService + getCharacteristic call) and
   * falls back to enumerating known UUIDs, then all services.
   */
  private async locateWritableCharacteristic(
    server: BluetoothRemoteGATTServer,
    cache: ReturnType<typeof loadPrinterCache>,
  ): Promise<BluetoothRemoteGATTCharacteristic | null> {
    // ── Fast path: try cached UUIDs ──────────────────────────────────────
    if (cache?.serviceUuid && cache?.characteristicUuid && this.device && cache.deviceId === this.device.id) {
      try {
        const svc = await server.getPrimaryService(cache.serviceUuid);
        const ch = await svc.getCharacteristic(cache.characteristicUuid);
        if (ch.properties.write || ch.properties.writeWithoutResponse) {
          console.log('⚡ Cached GATT UUIDs worked — skipping enumeration');
          return ch;
        }
      } catch {
        console.log('Cached GATT UUIDs no longer valid; falling back to discovery');
      }
    }

    // ── Slow path: known UUIDs ───────────────────────────────────────────
    const SERVICE_UUIDS = [
      ZEBRA_BLE_PARSER_SERVICE,
      ZEBRA_SERVICE_UUID,
      SPP_SERVICE_UUID,
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      '000018f0-0000-1000-8000-00805f9b34fb',
      '0000fff0-0000-1000-8000-00805f9b34fb',
      '0000ff00-0000-1000-8000-00805f9b34fb',
    ];
    const CHAR_UUIDS = [
      ZEBRA_BLE_PARSER_CHAR,
      ZEBRA_CHARACTERISTIC_UUID,
      'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
      '0000fff2-0000-1000-8000-00805f9b34fb',
    ];

    for (const svcUUID of SERVICE_UUIDS) {
      try {
        const svc = await server.getPrimaryService(svcUUID);
        for (const charUUID of CHAR_UUIDS) {
          try {
            const ch = await svc.getCharacteristic(charUUID);
            if (ch.properties.write || ch.properties.writeWithoutResponse) return ch;
          } catch { /* next */ }
        }
        // Enumerate this service's characteristics
        try {
          const chars = await svc.getCharacteristics();
          const writable = chars.find(c => c.properties.write || c.properties.writeWithoutResponse);
          if (writable) return writable;
        } catch { /* can't enumerate */ }
      } catch { /* service not found, next */ }
    }

    // ── Last resort: enumerate ALL services ──────────────────────────────
    try {
      const allServices = await server.getPrimaryServices();
      for (const svc of allServices) {
        const chars = await svc.getCharacteristics();
        const writable = chars.find(c => c.properties.write || c.properties.writeWithoutResponse);
        if (writable) return writable;
      }
    } catch (e) {
      console.warn('Cannot enumerate all services:', e);
    }

    return null;
  }

  /** Bound handler so we can add/remove it as the same reference.
   *  Keeps the BluetoothDevice reference alive on idle GATT drop — only the
   *  characteristic is invalidated. Next print() will call gatt.connect()
   *  again (no picker needed for a known device). */
  private handleDisconnect = (): void => {
    console.log('[BT] ⚠️ GATT dropped — device ref preserved for silent reconnect');
    const deviceName = this.device?.name || undefined;
    this.characteristic = null;
    emitStatus({ connected: false, deviceName, reason: 'device disconnected' });
  };

  /**
   * Send data to printer (auto-detects protocol)
   */
  private async sendData(data: string | Uint8Array): Promise<boolean> {
    try {
      if (!this.characteristic || !this.device?.gatt?.connected) {
        console.log('[BT] sendData: not connected — connecting first');
        await this.connect();
      }

      if (!this.characteristic) {
        throw new Error('Failed to establish Bluetooth connection');
      }

      // Convert string to bytes if needed
      const bytes = typeof data === 'string' 
        ? new TextEncoder().encode(data)
        : data;

      // Send data in chunks (Bluetooth MTU limits)
      const chunkSize = 512;
      const useWOR = this.characteristic.properties.writeWithoutResponse;
      console.log(`📤 Sending ${bytes.length} bytes in ${Math.ceil(bytes.length / chunkSize)} chunks (writeWithoutResponse=${useWOR})`);

      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
        
        try {
          if (useWOR) {
            await this.characteristic.writeValueWithoutResponse(chunk);
          } else {
            await this.characteristic.writeValue(chunk);
          }
        } catch (writeErr) {
          // Retry once after reconnecting (GATT can drop mid-transfer)
          console.warn('⚠️ Write failed, reconnecting and retrying...', writeErr);
          this.characteristic = null;
          await this.connect();
          if (!this.characteristic) throw new Error('Reconnect failed');
          if (useWOR) {
            await this.characteristic.writeValueWithoutResponse(chunk);
          } else {
            await this.characteristic.writeValue(chunk);
          }
        }
        
        // Small delay between chunks
        if (i + chunkSize < bytes.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      console.log(`✅ Data sent via Bluetooth (${bytes.length} bytes, protocol: ${this.protocol})`);
      return true;

    } catch (error) {
      console.error('❌ Failed to send data via Bluetooth:', error);

      // Only invalidate the characteristic — keep the device ref so the next
      // print can silently re-open GATT without a picker.
      this.characteristic = null;

      throw error;
    }
  }

  /**
   * Print label (auto-selects protocol)
   */
  async print(labelData: LabelPrintData): Promise<boolean> {
    try {
      console.log(`[BT] print() requested for "${labelData.productName}" — characteristic=${this.characteristic ? 'set' : 'none'} device=${this.device?.name || 'none'} gatt=${this.device?.gatt?.connected ? 'open' : 'closed'}`);

      // STEP 1: Ensure BLE connection BEFORE detecting protocol.
      // If the singleton already holds a live device+characteristic+GATT,
      // connect() returns in microseconds. Otherwise it walks the lifecycle
      // (hot/warm/cold) and either reuses the cached identity silently or —
      // first time ever on this device — pops the picker.
      if (!this.characteristic || !this.device?.gatt?.connected) {
        console.log('[BT] print: connection not live, connecting first');
        await this.connect();
      }

      // STEP 2: Determine protocol (connect() already updated this.protocol
      // from the device name, but double-check in case it's still 'auto')
      let currentProtocol = this.protocol;
      
      if (currentProtocol === 'auto' && this.device?.name) {
        currentProtocol = this.detectProtocol(this.device.name);
        this.protocol = currentProtocol; // cache for subsequent prints
        console.log(`🔄 Re-detected protocol for "${this.device.name}": ${currentProtocol.toUpperCase()}`);
      }
      
      console.log(`🖨️ Printing via Bluetooth (${currentProtocol.toUpperCase()}):`, labelData.productName);

      // STEP 3: Generate appropriate command set based on detected protocol
      let data: string | Uint8Array;
      
      if (currentProtocol === 'zpl') {
        data = this.generateZPL(labelData);
        console.log('✅ ZPL generated:', (data as string).substring(0, 100) + '...');
      } else {
        data = this.generateESCPOS(labelData);
        console.log('✅ ESC/POS generated:', data.length, 'bytes');
      }

      // STEP 4: Send to printer (already connected — no picker shown again)
      await this.sendData(data);

      return true;

    } catch (error) {
      console.error('❌ Bluetooth print failed:', error);
      
      // User-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('Web Bluetooth is not supported')) {
          throw new Error('Bluetooth printing requires Chrome browser on Android');
        }
        if (error.message.includes('User cancelled')) {
          throw new Error('Bluetooth device selection cancelled');
        }
        if (error.message.includes('not found')) {
          throw new Error('Printer not found. Make sure it is powered on and in range.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Print multiple labels
   */
  async printBatch(labels: LabelPrintData[]): Promise<boolean> {
    try {
      console.log(`🖨️ Batch printing ${labels.length} labels via Bluetooth...`);

      // Connect once for the batch
      if (!this.characteristic) {
        await this.connect();
      }

      // Print each label
      for (const labelData of labels) {
        if (this.protocol === 'zpl') {
          await this.sendData(this.generateZPL(labelData));
        } else {
          await this.sendData(this.generateESCPOS(labelData));
        }
        
        // Delay between labels
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ Batch print complete: ${labels.length} labels`);
      return true;

    } catch (error) {
      console.error('❌ Batch print failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from printer (intentional teardown, e.g. user clicked Forget).
   */
  async disconnect(): Promise<void> {
    clearSharedBluetoothDevice();
    console.log('🔌 Bluetooth disconnected (singleton cleared)');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.device?.gatt?.connected === true;
  }

  /**
   * Get printer settings
   */
  getSettings(): PrinterSettings {
    return this.settings;
  }

  /**
   * Update printer settings
   */
  async updateSettings(newSettings: Partial<PrinterSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    console.log('✅ Bluetooth printer settings updated');
  }

  /**
   * Get printer status
   */
  async getStatus(): Promise<PrinterStatus> {
    return {
      isReady: this.isConnected(),
      paperOut: false,
      error: this.isConnected() ? undefined : 'Not connected'
    };
  }

  /**
   * Test connection
   */
  async test(): Promise<boolean> {
    try {
      if (this.protocol === 'zpl') {
        // Test ZPL
        const testZPL = `
^XA
^FO50,50^A0N,50,50^FDTest Print^FS
^FO50,120^A0N,30,30^FDIf you see this, Bluetooth works!^FS
^FO50,170^A0N,25,25^FD${new Date().toLocaleString()}^FS
^XZ
        `.trim();
        await this.sendData(testZPL);
      } else {
        // Test ESC/POS
        const commands: number[] = [];
        commands.push(0x1B, 0x40); // Initialize
        commands.push(0x1B, 0x45, 0x01); // Bold on
        commands.push(...this.stringToBytes('Test Print\n'));
        commands.push(0x1B, 0x45, 0x00); // Bold off
        commands.push(...this.stringToBytes('If you see this, Bluetooth works!\n'));
        commands.push(...this.stringToBytes(new Date().toLocaleString() + '\n'));
        commands.push(0x0A, 0x0A, 0x0A); // Line feeds
        commands.push(0x1D, 0x56, 0x00); // Cut
        
        await this.sendData(new Uint8Array(commands));
      }
      
      return true;

    } catch (error) {
      console.error('❌ Test print failed:', error);
      return false;
    }
  }
}
