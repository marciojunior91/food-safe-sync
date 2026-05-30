// Live-status hook for the cached WebUSB printer. Mirrors
// useBluetoothPrinterStatus — subscribes to WEBUSB_PRINTER_STATUS_EVENT
// and silently reconnects on mount so the UI shows live status.

import { useEffect, useState, useCallback } from 'react';
import {
  WEBUSB_PRINTER_STATUS_EVENT,
  WebUsbPrinter,
  type WebUsbPrinterStatusDetail,
} from '@/lib/printers/WebUsbPrinter';
import {
  loadUsbPrinterCache,
  findCachedUsbDevice,
} from '@/lib/printers/webUsbPrinterCache';

export interface WebUsbPrinterStatus {
  connected: boolean;
  deviceName: string | null;
  hasPairedDevice: boolean;
  /** True while the on-mount silent reconnect probe is still running.
   *  Mirrors useBluetoothPrinterStatus.probing so the UI can gate the
   *  Reconnect button until we actually know the link is dead. */
  probing: boolean;
  lastConnectedAt: string | null;
  reason?: string;
  forget: () => void;
  reconnect: () => Promise<boolean>;
}

export function useWebUsbPrinterStatus(): WebUsbPrinterStatus {
  const initial = loadUsbPrinterCache();
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(initial?.deviceName ?? null);
  const [reason, setReason] = useState<string | undefined>();
  const [hasPairedDevice, setHasPairedDevice] = useState(!!initial);
  const [probing, setProbing] = useState<boolean>(!!initial);
  const [lastConnectedAt, setLastConnectedAt] = useState<string | null>(
    initial?.lastConnectedAt ?? null,
  );

  const reconnect = useCallback(async (): Promise<boolean> => {
    const cache = loadUsbPrinterCache();
    if (!cache) return false;

    const device = await findCachedUsbDevice();
    if (!device) {
      setConnected(false);
      setReason('printer is not plugged in (or permission revoked)');
      return false;
    }

    try {
      const printer = new WebUsbPrinter(cache.deviceName);
      return await printer.connect(true);
    } catch (e) {
      setReason(e instanceof Error ? e.message : String(e));
      return false;
    }
  }, []);

  const forget = useCallback(() => {
    WebUsbPrinter.forget();
    setConnected(false);
    setDeviceName(null);
    setHasPairedDevice(false);
    setLastConnectedAt(null);
    setReason('printer forgotten');
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<WebUsbPrinterStatusDetail>).detail;
      setConnected(detail.connected);
      if (detail.deviceName) setDeviceName(detail.deviceName);
      setReason(detail.reason);
      if (detail.connected) {
        setHasPairedDevice(true);
        setLastConnectedAt(new Date().toISOString());
      }
    };
    window.addEventListener(WEBUSB_PRINTER_STATUS_EVENT, handler);
    return () => window.removeEventListener(WEBUSB_PRINTER_STATUS_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!initial) return;
    let cancelled = false;
    reconnect().finally(() => {
      if (!cancelled) setProbing(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { connected, deviceName, hasPairedDevice, probing, lastConnectedAt, reason, forget, reconnect };
}
