// BluetoothUniversalPrinter - Works with ANY Bluetooth thermal printer
// Supports: Zebra (ZPL), ESC/POS (MPT-II, Xprinter, Epson, etc.), Generic Bluetooth

import type { PrinterDriver, PrinterSettings, PrinterCapabilities, PrinterStatus } from '@/types/printer';
import type { LabelPrintData } from '@/utils/zebraPrinter';
import { generateLabelZPL, formatDateDMY } from '@/utils/labelZpl';
import {
  loadPrinterCache,
  savePrinterCache,
  updatePrinterCache,
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

// ─────────────────────────────────────────────────────────────────────────────
// Module-level singleton: one Bluetooth connection per browser tab, shared by
// every BluetoothUniversalPrinter instance.
//
// Why: each component using usePrinter('some-context') instantiates its own
// BluetoothUniversalPrinter. Without a shared singleton, each instance kept
// its own this.device/this.characteristic — meaning a fresh component (e.g.
// navigating from Settings to Labeling) had no connection and would
// re-prompt the user via the picker. The singleton makes the connection
// process-wide so the user pairs ONCE and every component reuses it.
// ─────────────────────────────────────────────────────────────────────────────
interface SharedConnection {
  device: BluetoothDevice;
  characteristic: BluetoothRemoteGATTCharacteristic;
  protocol: PrinterProtocol;
}
let sharedConn: SharedConnection | null = null;

/** In-flight connect promise — concurrent calls await the same result. */
let inflightConnect: Promise<SharedConnection | null> | null = null;

function clearSharedConn(reason: string): void {
  if (sharedConn) {
    console.log(`🔌 Clearing shared Bluetooth connection: ${reason}`);
  }
  sharedConn = null;
}

export class BluetoothUniversalPrinter implements PrinterDriver {
  type: 'bluetooth' = 'bluetooth';
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
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

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
   * Connect to the Bluetooth printer.
   *
   * Shared-connection model: all instances of BluetoothUniversalPrinter
   * share a single underlying GATT connection (module-level `sharedConn`),
   * so navigating between components / opening the print queue / etc. does
   * NOT re-prompt the device picker. Concurrent connect() calls coalesce
   * into a single in-flight promise.
   *
   * @param silent  When true (default), never shows the device picker —
   *                returns false instead. Picker is only shown when the
   *                user explicitly initiates pairing via the Settings UI
   *                (which passes silent=false).
   */
  async connect(silent: boolean = true): Promise<boolean> {
    // Fast path: shared connection is live and writable
    if (sharedConn && sharedConn.device.gatt?.connected) {
      this.device = sharedConn.device;
      this.characteristic = sharedConn.characteristic;
      this.protocol = sharedConn.protocol;
      return true;
    }

    // Coalesce concurrent connects — multiple components hitting print at the
    // same time should share one in-flight attempt, not race each other.
    if (inflightConnect) {
      const result = await inflightConnect;
      if (result) {
        this.device = result.device;
        this.characteristic = result.characteristic;
        this.protocol = result.protocol;
        return true;
      }
      return false;
    }

    inflightConnect = this.doConnect(silent);
    try {
      const result = await inflightConnect;
      if (!result) {
        if (silent) return false;
        throw new Error('Failed to connect to Bluetooth printer');
      }
      sharedConn = result;
      this.device = result.device;
      this.characteristic = result.characteristic;
      this.protocol = result.protocol;
      return true;
    } finally {
      inflightConnect = null;
    }
  }

  /**
   * Three-tier connect strategy. Called only by connect(); never re-entered
   * while inflightConnect is pending.
   */
  private async doConnect(silent: boolean): Promise<SharedConnection | null> {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth is not supported. Please use Chrome.');
      }

      // ── Tier 1: cached device via getDevices() (no picker) ────────────
      let device = await findCachedDevice();
      if (device) {
        console.log(`🔵 Found cached device: ${device.name || device.id}`);
      }

      // ── Tier 2: any previously-granted device with matching name ──────
      if (!device && 'getDevices' in navigator.bluetooth) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const paired: BluetoothDevice[] = await (navigator.bluetooth as any).getDevices();
          const savedName = this.settings.connectionConfig?.bluetoothDeviceName || this.name;
          device =
            paired.find(d => d.name === savedName) ??
            paired.find(d => d.name === this.settings.name) ??
            paired[0] ??
            null;
          if (device) console.log(`🔵 Found paired device: ${device.name || device.id}`);
        } catch (e) {
          console.warn('getDevices() failed:', e);
        }
      }

      // ── Tier 3: show picker (only on explicit user action) ────────────
      if (!device) {
        if (silent) {
          emitStatus({ connected: false, reason: 'no paired printer' });
          return null;
        }
        console.log('🔵 No paired device — showing Bluetooth picker…');
        device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ALL_OPTIONAL_SERVICES,
        });
      }
      if (!device) throw new Error('No device selected');

      // Restore protocol from cache for this device
      const cache = loadPrinterCache();
      let protocol = this.protocol;
      if (cache && cache.deviceId === device.id && cache.protocol) {
        protocol = cache.protocol;
      } else if (protocol === 'auto' && device.name) {
        protocol = this.detectProtocol(device.name);
      }

      // ── Connect GATT (idempotent if already connected) ────────────────
      const server = await device.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');

      const characteristic = await this.locateWritableCharacteristic(server, cache, device);
      if (!characteristic) {
        throw new Error('No writable characteristic found on this device');
      }

      // ── Persist what worked ───────────────────────────────────────────
      savePrinterCache({
        deviceId: device.id,
        deviceName: device.name || 'Bluetooth Printer',
        serviceUuid: characteristic.service.uuid,
        characteristicUuid: characteristic.uuid,
        protocol,
      });

      // ── Listen for disconnection on the shared device ─────────────────
      // Remove first in case we already wired it on a previous connect
      (device as unknown as EventTarget).removeEventListener('gattserverdisconnected', BluetoothUniversalPrinter.onSharedDisconnect);
      (device as unknown as EventTarget).addEventListener('gattserverdisconnected', BluetoothUniversalPrinter.onSharedDisconnect);

      emitStatus({ connected: true, deviceName: device.name || undefined });
      console.log(`✅ Bluetooth ready (protocol: ${protocol.toUpperCase()})`);
      return { device, characteristic, protocol };

    } catch (error) {
      console.error('❌ Bluetooth connection failed:', error);
      emitStatus({
        connected: false,
        reason: error instanceof Error ? error.message : String(error),
      });
      if (silent) return null;
      throw error;
    }
  }

  /** Static handler so add/remove use the same reference across instances. */
  private static onSharedDisconnect = (event: Event): void => {
    const device = (event.target as unknown as BluetoothDevice | null);
    const name = device?.name || 'printer';
    clearSharedConn(`gattserverdisconnected from ${name}`);
    emitStatus({ connected: false, deviceName: device?.name || undefined, reason: 'device disconnected' });
  };

  /**
   * Find a writable GATT characteristic. Tries the cached UUIDs first
   * (fast path — single getPrimaryService + getCharacteristic call) and
   * falls back to enumerating known UUIDs, then all services.
   */
  private async locateWritableCharacteristic(
    server: BluetoothRemoteGATTServer,
    cache: ReturnType<typeof loadPrinterCache>,
    device: BluetoothDevice,
  ): Promise<BluetoothRemoteGATTCharacteristic | null> {
    // ── Fast path: try cached UUIDs ──────────────────────────────────────
    if (cache?.serviceUuid && cache?.characteristicUuid && cache.deviceId === device.id) {
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const chars: BluetoothRemoteGATTCharacteristic[] = await (svc as any)['getCharacteristics']();
          const writable = chars.find(c => c.properties.write || c.properties.writeWithoutResponse);
          if (writable) return writable;
        } catch { /* can't enumerate */ }
      } catch { /* service not found, next */ }
    }

    // ── Last resort: enumerate ALL services ──────────────────────────────
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allServices: BluetoothRemoteGATTService[] = await (server as any)['getPrimaryServices']();
      for (const svc of allServices) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chars: BluetoothRemoteGATTCharacteristic[] = await (svc as any)['getCharacteristics']();
        const writable = chars.find(c => c.properties.write || c.properties.writeWithoutResponse);
        if (writable) return writable;
      }
    } catch (e) {
      console.warn('Cannot enumerate all services:', e);
    }

    return null;
  }

  /**
   * Send data to printer (auto-detects protocol).
   * Connect step uses silent=true so the picker NEVER pops up mid-print.
   * If no printer is paired, throws a clear error directing the user to
   * the Settings page.
   */
  private async sendData(data: string | Uint8Array): Promise<boolean> {
    try {
      if (!this.characteristic || !sharedConn?.device.gatt?.connected) {
        console.log('📡 Not connected, attempting silent reconnect…');
        const ok = await this.connect(true); // silent — no picker
        if (!ok) {
          throw new Error(
            'No printer paired. Open Settings → Printer Management to pair a Bluetooth printer.'
          );
        }
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
            await (this.characteristic as any).writeValueWithoutResponse(chunk);
          } else {
            await this.characteristic.writeValue(chunk);
          }
        } catch (writeErr) {
          // Retry once after reconnecting (GATT can drop mid-transfer).
          // Silent reconnect — no picker; if cache is gone, fail clearly.
          console.warn('⚠️ Write failed, reconnecting and retrying...', writeErr);
          clearSharedConn('write retry');
          this.characteristic = null;
          const reconnected = await this.connect(true);
          if (!reconnected || !this.characteristic) throw new Error('Reconnect failed');
          if (useWOR) {
            await (this.characteristic as any).writeValueWithoutResponse(chunk);
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
      // Reset connection on error so the next attempt does a fresh reconnect.
      // The picker still won't appear (sendData/connect both use silent mode).
      clearSharedConn('sendData error');
      this.device = null;
      this.characteristic = null;
      throw error;
    }
  }

  /**
   * Print label (auto-selects protocol). Uses silent reconnect — the
   * device picker is NEVER shown from print(). If no printer is paired,
   * this throws and the UI directs the user to Settings to pair one.
   */
  async print(labelData: LabelPrintData): Promise<boolean> {
    try {
      if (!this.characteristic || !sharedConn?.device.gatt?.connected) {
        console.log('📡 Not connected — silent reconnect before printing…');
        const ok = await this.connect(true); // silent
        if (!ok) {
          throw new Error(
            'No Bluetooth printer paired. Open Settings → Printer Management to pair one.'
          );
        }
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
   * Print multiple labels. Same silent-reconnect contract as print().
   */
  async printBatch(labels: LabelPrintData[]): Promise<boolean> {
    try {
      console.log(`🖨️ Batch printing ${labels.length} labels via Bluetooth...`);

      if (!this.characteristic || !sharedConn?.device.gatt?.connected) {
        const ok = await this.connect(true); // silent
        if (!ok) {
          throw new Error(
            'No Bluetooth printer paired. Open Settings → Printer Management to pair one.'
          );
        }
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
   * Disconnect from printer (also clears the module-level shared
   * connection so every other instance reflects the new state).
   */
  async disconnect(): Promise<void> {
    const device = sharedConn?.device ?? this.device;
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
      console.log('🔌 Bluetooth disconnected');
    }
    clearSharedConn('explicit disconnect');
    this.device = null;
    this.characteristic = null;
  }

  /**
   * Returns true when the shared connection is live AND this instance has
   * picked up the current characteristic reference.
   */
  isConnected(): boolean {
    return sharedConn?.device.gatt?.connected === true && !!this.characteristic;
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

  /** Forget the Bluetooth cache so the next connect shows the picker. */
  static forget(): void {
    clearSharedConn('forget');
  }
}
