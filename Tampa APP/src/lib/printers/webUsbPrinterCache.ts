// Persistent cache for the paired WebUSB printer.
//
// WebUSB permissions persist per-origin in Chrome's permission registry, so
// navigator.usb.getDevices() returns previously-granted devices on every
// page load without showing the picker. We save vendor+product IDs + the
// detected protocol + endpoint number so re-connection is instant.

const STORAGE_KEY = 'tampa_webusb_printer';

export interface UsbPrinterCache {
  vendorId: number;
  productId: number;
  deviceName: string;
  manufacturer?: string;
  protocol?: 'zpl' | 'escpos' | 'auto';
  endpointOut?: number;
  interfaceNumber?: number;
  lastConnectedAt?: string;
}

export function loadUsbPrinterCache(): UsbPrinterCache | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UsbPrinterCache;
    if (typeof parsed.vendorId !== 'number' || typeof parsed.productId !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveUsbPrinterCache(cache: UsbPrinterCache): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...cache,
      lastConnectedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('[webUsbPrinterCache] failed to save:', e);
  }
}

export function clearUsbPrinterCache(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

/**
 * Find the previously authorized USB device via Chrome's per-origin
 * permission registry. Returns null if the device is no longer present
 * or the user revoked permission in chrome://settings.
 */
export async function findCachedUsbDevice(): Promise<USBDevice | null> {
  if (typeof navigator === 'undefined' || !('usb' in navigator)) return null;
  const cache = loadUsbPrinterCache();
  if (!cache) return null;
  try {
    const devices = await navigator.usb.getDevices();
    return (
      devices.find(d => d.vendorId === cache.vendorId && d.productId === cache.productId) ??
      null
    );
  } catch (e) {
    console.warn('[webUsbPrinterCache] getDevices failed:', e);
    return null;
  }
}
