// Printer Management — Bluetooth + WebUSB only.
//
// The TCP/IP / local print-server path was removed. Both supported paths
// (Web Bluetooth and WebUSB) are browser-direct, persist their pairing in
// localStorage for silent reconnect, and produce identical labels via the
// shared ZPL generator at src/utils/labelZpl.ts.

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Printer, Bluetooth, Usb, Search, Loader2, ChevronDown, Save, TestTube,
  Info, RefreshCw, CheckCircle2, XCircle,
} from 'lucide-react';
import { PrinterSettings, PrinterType } from '@/types/printer';
import { PrinterFactory } from '@/lib/printers/PrinterFactory';
import { useToast } from '@/hooks/use-toast';
import { useBluetoothPrinterStatus } from '@/hooks/useBluetoothPrinterStatus';
import { useWebUsbPrinterStatus } from '@/hooks/useWebUsbPrinterStatus';
import { savePrinterCache as saveBluetoothCache } from '@/lib/printers/bluetoothPrinterCache';
import { BluetoothUniversalPrinter } from '@/lib/printers/BluetoothUniversalPrinter';
import { WebUsbPrinter } from '@/lib/printers/WebUsbPrinter';

const STORAGE_KEY = 'printer_settings';
const PRINTER_SETTINGS_CHANGED_EVENT = 'printer-settings-changed';

type ConnectionMethod = 'bluetooth' | 'webusb';

interface PrinterSettingsChangedDetail {
  storageKey: string;
  settings: PrinterSettings;
}

function loadSavedSettings(): PrinterSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as PrinterSettings;
  } catch { /* ignore */ }
  return PrinterFactory.getDefaultSettings('bluetooth');
}

export function PrinterManagementTab() {
  const { toast } = useToast();
  const btStatus = useBluetoothPrinterStatus();
  const usbStatus = useWebUsbPrinterStatus();

  const [settings, setSettings] = useState<PrinterSettings>(loadSavedSettings);
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>(() => {
    const saved = loadSavedSettings();
    return saved.type === 'webusb' ? 'webusb' : 'bluetooth';
  });
  const [printerName, setPrinterName] = useState(() => loadSavedSettings().name || 'My Printer');
  const [isScanning, setIsScanning] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [paperWidth, setPaperWidth] = useState(() => loadSavedSettings().paperWidth ?? 50);
  const [paperHeight, setPaperHeight] = useState(() => loadSavedSettings().paperHeight ?? 50);
  const [darkness, setDarkness] = useState(() => loadSavedSettings().darkness ?? 20);
  const [speed, setSpeed] = useState(() => loadSavedSettings().speed ?? 4);

  // Keep the printer name in sync with whichever device is currently paired,
  // so the form pre-fills sensible values after a pair / unpair.
  useEffect(() => {
    if (connectionMethod === 'bluetooth' && btStatus.deviceName) {
      setPrinterName(btStatus.deviceName);
    } else if (connectionMethod === 'webusb' && usbStatus.deviceName) {
      setPrinterName(usbStatus.deviceName);
    }
  }, [connectionMethod, btStatus.deviceName, usbStatus.deviceName]);

  // ── Persist + broadcast ─────────────────────────────────────────────────
  const persistSettings = useCallback((newSettings: PrinterSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);
    window.dispatchEvent(
      new CustomEvent<PrinterSettingsChangedDetail>(PRINTER_SETTINGS_CHANGED_EVENT, {
        detail: { storageKey: STORAGE_KEY, settings: newSettings },
      }),
    );
  }, []);

  const buildSettings = useCallback((): PrinterSettings => {
    const type: PrinterType = connectionMethod;
    return {
      type,
      name: printerName,
      protocol: 'auto',
      connectionType: connectionMethod === 'bluetooth' ? 'bluetooth-le' : 'usb',
      connectionConfig: {
        bluetoothDeviceName: connectionMethod === 'bluetooth' ? printerName : undefined,
        autoReconnect: true,
        timeout: 5000,
      },
      paperWidth,
      paperHeight,
      darkness,
      speed,
      dpi: 203,
      defaultQuantity: 1,
    };
  }, [connectionMethod, printerName, paperWidth, paperHeight, darkness, speed]);

  const handleSave = () => {
    const newSettings = buildSettings();
    persistSettings(newSettings);
    toast({ title: 'Printer Saved', description: `"${printerName}" configured successfully.` });
  };

  // ── Bluetooth pair ──────────────────────────────────────────────────────
  const handleBluetoothScan = async () => {
    if (!navigator.bluetooth) {
      toast({
        title: 'Not Supported',
        description: 'Web Bluetooth requires Chrome on Android, Windows, Mac, or Linux.',
        variant: 'destructive',
      });
      return;
    }
    setIsScanning(true);
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISS (MPT-II, many BLE printers)
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Nordic UART
          '38eb4a80-c570-11e3-9507-0002a5d5c51b', // Zebra BLE Parser
          '000018f0-0000-1000-8000-00805f9b34fb', // Zebra BTLE
          '00001101-0000-1000-8000-00805f9b34fb', // SPP
          '0000ff00-0000-1000-8000-00805f9b34fb',
          '0000fff0-0000-1000-8000-00805f9b34fb',
          '0000ae30-0000-1000-8000-00805f9b34fb',
        ],
      });
      if (device) {
        // Persist immediately so any subsequent reload / print-from-Labeling
        // reuses the same device without a picker.
        saveBluetoothCache({
          deviceId: device.id,
          deviceName: device.name || 'Bluetooth Printer',
        });
        // Drop any stale module-level connection (e.g. paired with a different
        // device earlier) so the next print uses the freshly picked one.
        BluetoothUniversalPrinter.forget();
        setPrinterName(device.name || 'Bluetooth Printer');
        toast({ title: 'Paired', description: `${device.name || 'Bluetooth Printer'} is ready to use.` });
      }
    } catch (err) {
      if (err instanceof Error && !err.message.toLowerCase().includes('cancel')) {
        toast({ title: 'Scan Failed', description: err.message, variant: 'destructive' });
      }
    } finally {
      setIsScanning(false);
    }
  };

  // ── WebUSB pair ─────────────────────────────────────────────────────────
  const handleUsbScan = async () => {
    if (typeof navigator === 'undefined' || !('usb' in navigator)) {
      toast({
        title: 'Not Supported',
        description: 'WebUSB requires Chrome or Edge. Not supported on iOS Safari.',
        variant: 'destructive',
      });
      return;
    }
    setIsScanning(true);
    try {
      const printer = PrinterFactory.createPrinter('webusb', { name: printerName });
      // silent=false → shows the device picker (this is the only non-silent USB path).
      const ok = await (printer as WebUsbPrinter).connect(false);
      if (ok) {
        toast({ title: 'USB Printer Connected', description: 'Ready to print.' });
      }
    } catch (err) {
      if (err instanceof Error && !err.message.toLowerCase().includes('no device selected')) {
        toast({ title: 'Connection Failed', description: err.message, variant: 'destructive' });
      }
    } finally {
      setIsScanning(false);
    }
  };

  // ── Test print ──────────────────────────────────────────────────────────
  const handlePrintTest = async () => {
    setIsPrinting(true);
    try {
      const settingsForTest = buildSettings();
      const printer = PrinterFactory.createPrinter(settingsForTest.type, settingsForTest);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const success = await (printer as any).test();
      if (success) {
        toast({ title: 'Test Label Sent', description: 'Check your printer.' });
      } else {
        toast({ title: 'Test Failed', description: 'Could not send the test label.', variant: 'destructive' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: 'Test Failed', description: msg, variant: 'destructive' });
    } finally {
      setIsPrinting(false);
    }
  };

  const activeStatus = connectionMethod === 'bluetooth' ? btStatus : usbStatus;
  const StatusIcon = activeStatus.connected ? CheckCircle2 : activeStatus.hasPairedDevice ? RefreshCw : XCircle;
  const statusIconClass = activeStatus.connected
    ? 'text-green-500'
    : activeStatus.hasPairedDevice
      ? 'text-amber-500'
      : 'text-muted-foreground';

  return (
    <div className="space-y-6">
      {/* ── Printer Basics ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Printer Setup
          </CardTitle>
          <CardDescription>
            Configure your thermal label printer. Settings are saved locally on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="printer-name">Printer Name</Label>
            <Input
              id="printer-name"
              placeholder="e.g. Kitchen Printer"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Connection Method ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connection</CardTitle>
          <CardDescription>
            Choose how the app talks to the printer. Both options work direct from the browser — no
            local server or driver install required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method toggle */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={connectionMethod === 'bluetooth' ? 'default' : 'outline'}
              className="h-16 flex flex-col gap-1"
              onClick={() => setConnectionMethod('bluetooth')}
            >
              <Bluetooth className="h-5 w-5" />
              <span className="text-sm">Bluetooth</span>
            </Button>
            <Button
              variant={connectionMethod === 'webusb' ? 'default' : 'outline'}
              className="h-16 flex flex-col gap-1"
              onClick={() => setConnectionMethod('webusb')}
            >
              <Usb className="h-5 w-5" />
              <span className="text-sm">USB Cable</span>
            </Button>
          </div>

          {/* ── Bluetooth panel ───────────────────────────────────────── */}
          {connectionMethod === 'bluetooth' && (
            <div className="space-y-4">
              {btStatus.hasPairedDevice && (
                <PairedPrinterCard
                  connected={btStatus.connected}
                  deviceName={btStatus.deviceName}
                  reason={btStatus.reason}
                  icon={<Bluetooth className="h-5 w-5" />}
                  onReconnect={async () => {
                    const ok = await btStatus.reconnect();
                    if (!ok) {
                      toast({
                        title: 'Reconnect Failed',
                        description: 'Make sure the printer is powered on and in range.',
                        variant: 'destructive',
                      });
                    }
                  }}
                  onForget={() => {
                    btStatus.forget();
                    toast({
                      title: 'Printer Forgotten',
                      description: 'Pair a new printer with the Search button.',
                    });
                  }}
                />
              )}

              <Button
                variant={btStatus.hasPairedDevice ? 'outline' : 'default'}
                className="w-full gap-2"
                onClick={handleBluetoothScan}
                disabled={isScanning}
              >
                {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {isScanning
                  ? 'Scanning…'
                  : btStatus.hasPairedDevice
                    ? 'Pair a Different Bluetooth Printer'
                    : 'Search for Bluetooth Printers'}
              </Button>

              {!navigator.bluetooth && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Bluetooth requires <strong>Chrome</strong> (or another Chromium-based browser).
                    Not available on iOS Safari or Firefox — use the USB Cable option instead.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* ── WebUSB panel ─────────────────────────────────────────── */}
          {connectionMethod === 'webusb' && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm space-y-2">
                  <p>
                    Connect the printer to this device with a USB cable, then click the search
                    button. The browser will show a picker — choose your printer.
                  </p>
                  <p className="text-xs">
                    <strong>Android tablet:</strong> use a USB-C OTG adapter to plug the printer in.
                  </p>
                  <p className="text-xs">
                    <strong>Windows:</strong> WebUSB may fail if the OS printer driver has claimed
                    the device. If you hit an "access denied" error, unplug the printer, then use
                    Zadig (https://zadig.akeo.ie) to install the WinUSB driver for it.
                  </p>
                </AlertDescription>
              </Alert>

              {usbStatus.hasPairedDevice && (
                <PairedPrinterCard
                  connected={usbStatus.connected}
                  deviceName={usbStatus.deviceName}
                  reason={usbStatus.reason}
                  icon={<Usb className="h-5 w-5" />}
                  onReconnect={async () => {
                    const ok = await usbStatus.reconnect();
                    if (!ok) {
                      toast({
                        title: 'Reconnect Failed',
                        description: 'Make sure the printer is plugged in and powered on.',
                        variant: 'destructive',
                      });
                    }
                  }}
                  onForget={() => {
                    usbStatus.forget();
                    toast({
                      title: 'Printer Forgotten',
                      description: 'Pair a new printer with the search button.',
                    });
                  }}
                />
              )}

              <Button
                variant={usbStatus.hasPairedDevice ? 'outline' : 'default'}
                className="w-full gap-2"
                onClick={handleUsbScan}
                disabled={isScanning}
              >
                {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {isScanning
                  ? 'Opening picker…'
                  : usbStatus.hasPairedDevice
                    ? 'Pair a Different USB Printer'
                    : 'Search for USB Printers'}
              </Button>

              {typeof navigator !== 'undefined' && !('usb' in navigator) && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    WebUSB requires <strong>Chrome or Edge</strong>. Not supported on iOS Safari or
                    Firefox — use the Bluetooth option instead.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* ── Status row + actions ─────────────────────────────────── */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <StatusIcon className={`h-5 w-5 ${statusIconClass} ${
              !activeStatus.connected && activeStatus.hasPairedDevice ? 'animate-pulse' : ''
            }`} />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {activeStatus.connected
                  ? 'Connected'
                  : activeStatus.hasPairedDevice
                    ? 'Saved — will reconnect on next print'
                    : 'Not Configured'}
              </p>
              {(activeStatus.deviceName || activeStatus.reason) && (
                <p className="text-xs text-muted-foreground">
                  {activeStatus.deviceName}
                  {activeStatus.reason ? ` — ${activeStatus.reason}` : ''}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handlePrintTest}
            disabled={isPrinting || !activeStatus.hasPairedDevice}
          >
            {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
            Print Test Label
          </Button>
        </CardContent>
      </Card>

      {/* ── Advanced ────────────────────────────────────────────────────── */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Advanced Settings</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label>Label Size</Label>
                <Select
                  value={`${paperWidth}x${paperHeight}`}
                  onValueChange={(v) => {
                    const [w, h] = v.split('x').map(Number);
                    setPaperWidth(w);
                    setPaperHeight(h);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50x50">50 × 50 mm (Standard)</SelectItem>
                    <SelectItem value="102x180">102 × 180 mm</SelectItem>
                    <SelectItem value="102x152">102 × 152 mm (4×6 in)</SelectItem>
                    <SelectItem value="76x127">76 × 127 mm (3×5 in)</SelectItem>
                    <SelectItem value="57x32">57 × 32 mm (Small)</SelectItem>
                    <SelectItem value="50x25">50 × 25 mm (Tiny)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="darkness">Darkness (0–30)</Label>
                  <Input
                    id="darkness"
                    type="number"
                    min={0}
                    max={30}
                    value={darkness}
                    onChange={(e) => setDarkness(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Higher = darker print (Zebra only)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speed">Speed (2–12)</Label>
                  <Input
                    id="speed"
                    type="number"
                    min={2}
                    max={12}
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Higher = faster (Zebra only)</p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Button onClick={handleSave} size="lg" className="w-full gap-2">
        <Save className="h-4 w-4" />
        Save Printer Settings
      </Button>

      {settings.name && (
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wide">
              Current Saved Configuration
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{settings.name}</span>
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{settings.type === 'bluetooth' ? 'Bluetooth' : 'USB'}</span>
              <span className="text-muted-foreground">Label:</span>
              <span className="font-medium">{settings.paperWidth}×{settings.paperHeight} mm</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Reusable status card ──────────────────────────────────────────────────
interface PairedPrinterCardProps {
  connected: boolean;
  deviceName: string | null;
  reason?: string;
  icon: React.ReactNode;
  onReconnect: () => void | Promise<void>;
  onForget: () => void;
}

function PairedPrinterCard({
  connected, deviceName, reason, icon, onReconnect, onForget,
}: PairedPrinterCardProps) {
  return (
    <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${
      connected
        ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900'
        : 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={connected ? 'text-green-600' : 'text-amber-600'}>{icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{deviceName || 'Printer'}</p>
          <p className="text-xs text-muted-foreground">
            {connected ? 'Connected — ready to print' : reason || 'Saved, will reconnect on next print'}
          </p>
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {!connected && (
          <Button size="sm" variant="outline" onClick={onReconnect}>
            <RefreshCw className="h-3 w-3 mr-1" /> Reconnect
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onForget}>Forget</Button>
      </div>
    </div>
  );
}
