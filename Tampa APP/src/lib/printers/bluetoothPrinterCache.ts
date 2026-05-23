// Persistent cache for the paired Bluetooth printer.
//
// Two things get saved in localStorage:
//   1. The device identity (id + name) so getDevices() can find it without
//      showing the picker on subsequent visits.
//   2. The GATT service + characteristic UUIDs that worked for that device,
//      so we skip enumerating services on every connect (huge speed-up on
//      ESC/POS printers that don't advertise standard UUIDs).
//
// Permission model note: Chrome retains Web Bluetooth permissions per origin
// across reloads, so navigator.bluetooth.getDevices() can return the paired
// device by id without any UI. If the user revokes permission, getDevices()
// returns an empty list and we transparently fall back to the picker.

const STORAGE_KEY = 'tampa_bluetooth_printer';

export interface BluetoothPrinterCache {
  /** BluetoothDevice.id — opaque per-origin identifier. */
  deviceId: string;
  /** Friendly name shown to the user (e.g. "MPT-II_309F"). */
  deviceName: string;
  /** GATT service UUID that worked last time. */
  serviceUuid?: string;
  /** Writable characteristic UUID within that service. */
  characteristicUuid?: string;
  /** Protocol detected for this device. */
  protocol?: 'zpl' | 'escpos' | 'auto';
  /** ISO timestamp of the last successful connect. */
  lastConnectedAt?: string;
}

export function loadPrinterCache(): BluetoothPrinterCache | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BluetoothPrinterCache;
    if (!parsed.deviceId || !parsed.deviceName) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePrinterCache(cache: BluetoothPrinterCache): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...cache,
      lastConnectedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('[bluetoothPrinterCache] failed to save:', e);
  }
}

/**
 * Merge a partial update into the existing cache (preserves fields the caller
 * doesn't know about, e.g. update GATT UUIDs without touching device identity).
 */
export function updatePrinterCache(partial: Partial<BluetoothPrinterCache>): void {
  const current = loadPrinterCache();
  if (!current) {
    if (partial.deviceId && partial.deviceName) {
      savePrinterCache(partial as BluetoothPrinterCache);
    }
    return;
  }
  savePrinterCache({ ...current, ...partial });
}

export function clearPrinterCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

/**
 * Look up the previously paired device via the Web Bluetooth permissions
 * registry — no picker shown. Returns null if the device is unknown to the
 * browser (permission revoked, different origin, never paired).
 */
export async function findCachedDevice(): Promise<BluetoothDevice | null> {
  if (typeof navigator === 'undefined' || !navigator.bluetooth) return null;
  if (!('getDevices' in navigator.bluetooth)) return null;

  const cache = loadPrinterCache();
  if (!cache) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const devices: BluetoothDevice[] = await (navigator.bluetooth as any).getDevices();
    // Prefer match by id (stable); fall back to name if id doesn't match
    // (Chrome occasionally rotates ids on certain platforms).
    return (
      devices.find(d => d.id === cache.deviceId) ??
      devices.find(d => d.name === cache.deviceName) ??
      null
    );
  } catch (e) {
    console.warn('[bluetoothPrinterCache] getDevices failed:', e);
    return null;
  }
}
