// Live-status hook for the cached Bluetooth printer.
//
// Subscribes to BLUETOOTH_PRINTER_STATUS_EVENT (dispatched by
// BluetoothUniversalPrinter whenever the GATT connection opens or drops)
// and exposes the current connection state to any React component.
//
// Also attempts a silent reconnect on mount, so a freshly loaded page shows
// "Connected to X" within ~200ms if the device was paired in a prior session.

import { useEffect, useState, useCallback } from 'react';
import {
  BLUETOOTH_PRINTER_STATUS_EVENT,
  BluetoothUniversalPrinter,
  type BluetoothPrinterStatusDetail,
} from '@/lib/printers/BluetoothUniversalPrinter';
import {
  loadPrinterCache,
  clearPrinterCache,
  findCachedDevice,
} from '@/lib/printers/bluetoothPrinterCache';
import { PrinterFactory } from '@/lib/printers/PrinterFactory';

export interface BluetoothPrinterStatus {
  /** True when GATT is connected right now. */
  connected: boolean;
  /** Friendly device name (from cache or live device). */
  deviceName: string | null;
  /** True if a paired device exists in the cache (regardless of connection). */
  hasPairedDevice: boolean;
  /** ISO timestamp of last successful connect (for "last used" display). */
  lastConnectedAt: string | null;
  /** Optional human-readable reason for the current state. */
  reason?: string;
  /** Forget the cached printer (revokes app-side memory only — user can
   *  also revoke permission in chrome://settings to fully unpair). */
  forget: () => void;
  /** Force a silent reconnect attempt (no picker). Returns true if reconnected. */
  reconnect: () => Promise<boolean>;
}

export function useBluetoothPrinterStatus(): BluetoothPrinterStatus {
  const initialCache = loadPrinterCache();
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(
    initialCache?.deviceName ?? null,
  );
  const [reason, setReason] = useState<string | undefined>();
  const [hasPairedDevice, setHasPairedDevice] = useState(!!initialCache);
  const [lastConnectedAt, setLastConnectedAt] = useState<string | null>(
    initialCache?.lastConnectedAt ?? null,
  );

  // Silent reconnect — never shows the picker, used by callers that just want
  // to bring the cached printer back online (e.g. on app mount or after sleep).
  const reconnect = useCallback(async (): Promise<boolean> => {
    const cache = loadPrinterCache();
    if (!cache) return false;

    // Verify the device is still visible to the browser's Web Bluetooth
    // permission registry before bothering to spin up a printer instance.
    const device = await findCachedDevice();
    if (!device) {
      setConnected(false);
      setReason('paired device not available (permission may be revoked)');
      return false;
    }

    try {
      const printer = PrinterFactory.createPrinter('bluetooth', {
        name: cache.deviceName,
        connectionConfig: { bluetoothDeviceName: cache.deviceName },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ok = await (printer as any).connect(true); // silent = true
      return !!ok;
    } catch (e) {
      setReason(e instanceof Error ? e.message : String(e));
      return false;
    }
  }, []);

  const forget = useCallback(() => {
    clearPrinterCache();
    BluetoothUniversalPrinter.forget(); // also drop module-level shared conn
    setConnected(false);
    setDeviceName(null);
    setHasPairedDevice(false);
    setLastConnectedAt(null);
    setReason('printer forgotten');
  }, []);

  // Subscribe to status events from BluetoothUniversalPrinter
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<BluetoothPrinterStatusDetail>).detail;
      setConnected(detail.connected);
      if (detail.deviceName) setDeviceName(detail.deviceName);
      setReason(detail.reason);
      if (detail.connected) {
        setHasPairedDevice(true);
        setLastConnectedAt(new Date().toISOString());
      }
    };
    window.addEventListener(BLUETOOTH_PRINTER_STATUS_EVENT, handler);
    return () => window.removeEventListener(BLUETOOTH_PRINTER_STATUS_EVENT, handler);
  }, []);

  // Silent reconnect on first mount so UI shows real status, not stale cache
  useEffect(() => {
    if (initialCache) reconnect();
    // We intentionally run once — reconnect is stable, initialCache is a snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    connected,
    deviceName,
    hasPairedDevice,
    lastConnectedAt,
    reason,
    forget,
    reconnect,
  };
}
