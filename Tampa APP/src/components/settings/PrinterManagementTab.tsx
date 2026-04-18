import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Printer,
  Wifi,
  Bluetooth,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  Save,
  TestTube,
  Info,
  Signal,
  RefreshCw,
} from 'lucide-react';
import { PrinterSettings, ConnectionType, PrinterType, DiscoveredPrinter } from '@/types/printer';
import { PrinterFactory } from '@/lib/printers/PrinterFactory';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'printer_settings';
const PRINTER_SETTINGS_CHANGED_EVENT = 'printer-settings-changed';

type ConnectionMethod = 'wifi' | 'bluetooth';
type ConnectionStatus = 'disconnected' | 'testing' | 'connected' | 'error';

interface PrinterSettingsChangedDetail {
  storageKey: string;
  settings: PrinterSettings;
}

/**
 * Helper: read current printer settings from localStorage
 */
function loadSavedSettings(): PrinterSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as PrinterSettings;
  } catch { /* ignore */ }
  return PrinterFactory.getDefaultSettings('zebra');
}

/**
 * PrinterManagementTab
 *
 * Simple, restaurant-staff-friendly printer configuration.
 * – Choose connection: WiFi (IP) or Bluetooth
 * – Discover / manually configure the printer
 * – Test connection + print test label
 * – Save → localStorage (consumed by usePrinter hook everywhere)
 */
export function PrinterManagementTab() {
  const { toast } = useToast();

  // ── State ─────────────────────────────────────────────────────────────────
  const [settings, setSettings] = useState<PrinterSettings>(loadSavedSettings);
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>(() => {
    const saved = loadSavedSettings();
    if (saved.connectionType === 'bluetooth-le' || saved.connectionType === 'bluetooth-classic') {
      return 'bluetooth';
    }
    return 'wifi';
  });
  const [ipAddress, setIpAddress] = useState(() => {
    const saved = loadSavedSettings();
    return saved.connectionConfig?.ipAddress || saved.ipAddress || '';
  });
  const [port, setPort] = useState(() => {
    const saved = loadSavedSettings();
    return String(saved.connectionConfig?.port || saved.port || '9100');
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [statusMessage, setStatusMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredPrinter[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const btDeviceRef = useRef<BluetoothDevice | null>(null);
  const btGattInfoRef = useRef<{ serviceUUID: string; characteristicUUID: string } | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [darkness, setDarkness] = useState(() => loadSavedSettings().darkness ?? 20);
  const [speed, setSpeed] = useState(() => loadSavedSettings().speed ?? 4);
  const [paperWidth, setPaperWidth] = useState(() => loadSavedSettings().paperWidth ?? 102);
  const [paperHeight, setPaperHeight] = useState(() => loadSavedSettings().paperHeight ?? 180);
  const [printerName, setPrinterName] = useState(() => loadSavedSettings().name || 'My Printer');
  const [printerType, setPrinterType] = useState<PrinterType>(() => loadSavedSettings().type || 'zebra');

  // ── Persist & broadcast ───────────────────────────────────────────────────
  const persistSettings = useCallback((newSettings: PrinterSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);

    // Broadcast to all usePrinter() hooks
    window.dispatchEvent(
      new CustomEvent<PrinterSettingsChangedDetail>(PRINTER_SETTINGS_CHANGED_EVENT, {
        detail: { storageKey: STORAGE_KEY, settings: newSettings },
      }),
    );
  }, []);

  // ── Build settings object from form ───────────────────────────────────────
  const buildSettings = useCallback((): PrinterSettings => {
    const connType: ConnectionType =
      connectionMethod === 'bluetooth' ? 'bluetooth-le' : 'tcp-ip';

    return {
      type: printerType,
      name: printerName,
      model: 'Zebra ZD411',
      manufacturer: 'Zebra',
      protocol: printerType === 'zebra' || printerType === 'universal' ? 'zpl' : 'auto',
      connectionType: connType,
      connectionConfig: {
        ipAddress: connectionMethod === 'wifi' ? ipAddress : undefined,
        port: connectionMethod === 'wifi' ? parseInt(port) || 9100 : undefined,
        preferredConnection: connType,
        autoReconnect: true,
        timeout: 5000,
      },
      ipAddress: connectionMethod === 'wifi' ? ipAddress : undefined,
      port: connectionMethod === 'wifi' ? parseInt(port) || 9100 : undefined,
      paperWidth,
      paperHeight,
      darkness,
      speed,
      dpi: 203,
      defaultQuantity: 1,
    };
  }, [connectionMethod, ipAddress, port, printerType, printerName, paperWidth, paperHeight, darkness, speed]);

  // ── Save handler ──────────────────────────────────────────────────────────
  const handleSave = () => {
    const newSettings = buildSettings();
    persistSettings(newSettings);
    toast({
      title: 'Printer Saved',
      description: `"${printerName}" configured successfully.`,
    });
  };

  // ── Test connection ───────────────────────────────────────────────────────
  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setStatusMessage('Testing connection…');

    if (connectionMethod === 'wifi') {
      if (!ipAddress.trim()) {
        setConnectionStatus('error');
        setStatusMessage('Please enter the printer IP address.');
        return;
      }

      // Try print server first
      const printServerUrl =
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PRINT_SERVER_URL) ||
        'http://localhost:3001';

      try {
        const res = await fetch(`${printServerUrl}/test-connection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ip: ipAddress, port: parseInt(port) || 9100 }),
          signal: AbortSignal.timeout(12000),
        });
        const data = await res.json();

        if (data.success) {
          setConnectionStatus('connected');
          setStatusMessage(`Connected to ${ipAddress}:${port}`);
          toast({ title: 'Connection Successful', description: `Printer at ${ipAddress} is reachable.` });
        } else {
          setConnectionStatus('error');
          setStatusMessage(data.error || 'Could not reach the printer.');
          toast({
            title: 'Connection Failed',
            description: data.error || 'Printer not reachable.',
            variant: 'destructive',
          });
        }
      } catch (err) {
        // Print server not running – try WebSocket
        try {
          const ws = new WebSocket(`ws://127.0.0.1:9100/`);
          await new Promise<void>((resolve, reject) => {
            const t = setTimeout(() => { ws.close(); reject(new Error('timeout')); }, 5000);
            ws.onopen = () => { clearTimeout(t); ws.close(); resolve(); };
            ws.onerror = () => { clearTimeout(t); reject(new Error('ws failed')); };
          });
          setConnectionStatus('connected');
          setStatusMessage('Connected via Zebra Browser Print (WebSocket)');
        } catch {
          setConnectionStatus('error');
          setStatusMessage(
            'Print server is not running. Start it with: cd print-server && npm start',
          );
          toast({
            title: 'Cannot Reach Printer',
            description: 'Start the print server or open Zebra Browser Print app.',
            variant: 'destructive',
          });
        }
      }
    } else {
      // Bluetooth test — use the already-paired device from scan
      const device = btDeviceRef.current;
      if (!device) {
        setConnectionStatus('error');
        setStatusMessage('No Bluetooth printer paired yet. Tap "Search for Bluetooth Printers" first.');
        return;
      }

      try {
        setStatusMessage(`Connecting to ${device.name || 'printer'} via GATT…`);
        const server = await device.gatt?.connect();
        if (!server) throw new Error('GATT connect returned empty');

        // Try to discover the serial service (standard BLE printer UUID)
        const BLE_SERIAL_SERVICE = '49535343-fe7d-4ae5-8fa9-9fafd205e455';
        try {
          await server.getPrimaryService(BLE_SERIAL_SERVICE);
        } catch {
          // Some printers use different services — connection itself is proof enough
        }

        setConnectionStatus('connected');
        setStatusMessage(`Connected to ${device.name || 'Bluetooth Printer'}`);
        toast({ title: 'Bluetooth Connected', description: `${device.name} is reachable.` });

        // Disconnect after test so the connection is clean for printing later
        server.disconnect();
      } catch (err) {
        setConnectionStatus('error');
        const msg = err instanceof Error ? err.message : String(err);
        setStatusMessage(`Bluetooth connection failed: ${msg}`);
        toast({ title: 'Connection Failed', description: msg, variant: 'destructive' });
      }
    }
  };

  // ── Bluetooth scan ────────────────────────────────────────────────────────
  const handleBluetoothScan = async () => {
    if (!navigator.bluetooth) {
      toast({
        title: 'Not Supported',
        description: 'Web Bluetooth requires Chrome on Android.',
        variant: 'destructive',
      });
      return;
    }

    setIsScanning(true);
    setDiscoveredDevices([]);

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISS (MPT-II, many BLE printers)
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Nordic UART
          '38eb4a80-c570-11e3-9507-0002a5d5c51b', // Zebra BLE Parser (ZD411, ZD421, etc.)
          '000018f0-0000-1000-8000-00805f9b34fb', // Zebra BTLE
          '00001101-0000-1000-8000-00805f9b34fb', // SPP
          '0000ff00-0000-1000-8000-00805f9b34fb', // Generic vendor
          '0000fff0-0000-1000-8000-00805f9b34fb', // Common printer service
          '0000ae30-0000-1000-8000-00805f9b34fb', // Zebra write service
        ],
      });

      if (device) {
        // Store the device reference for test connection & printing
        btDeviceRef.current = device;

        const discovered: DiscoveredPrinter = {
          name: device.name || 'Unknown Printer',
          connectionType: 'bluetooth-le',
          connectionConfig: {
            bluetoothDeviceId: device.id,
            bluetoothDeviceName: device.name || undefined,
          },
          isAvailable: true,
        };
        setDiscoveredDevices([discovered]);
        setPrinterName(device.name || 'Bluetooth Printer');
        setConnectionStatus('connected');
        setStatusMessage(`Paired with ${device.name}`);
      }
    } catch (err) {
      if (err instanceof Error && !err.message.includes('cancelled')) {
        toast({
          title: 'Scan Failed',
          description: err.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsScanning(false);
    }
  };

  // ── Network discovery (via print server) ──────────────────────────────────
  const handleNetworkDiscovery = async () => {
    setIsScanning(true);
    setDiscoveredDevices([]);

    const printServerUrl =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PRINT_SERVER_URL) ||
      'http://localhost:3001';

    try {
      const res = await fetch(`${printServerUrl}/discover`, {
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json();

      if (data.printers && data.printers.length > 0) {
        const found: DiscoveredPrinter[] = data.printers.map((p: any) => ({
          name: p.name || `Printer at ${p.ip}`,
          model: p.model,
          connectionType: 'tcp-ip' as const,
          connectionConfig: { ipAddress: p.ip, port: p.port || 9100 },
          isAvailable: true,
        }));
        setDiscoveredDevices(found);
        toast({ title: 'Printers Found', description: `Found ${found.length} printer(s) on your network.` });
      } else {
        toast({ title: 'No Printers Found', description: 'No Zebra printers discovered on the local network.' });
      }
    } catch {
      toast({
        title: 'Discovery Failed',
        description: 'Print server not available. Enter the IP address manually.',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  // ── Select discovered printer ─────────────────────────────────────────────
  const selectDiscoveredPrinter = (dp: DiscoveredPrinter) => {
    setPrinterName(dp.name);
    if (dp.connectionConfig.ipAddress) {
      setIpAddress(dp.connectionConfig.ipAddress);
      setPort(String(dp.connectionConfig.port || 9100));
      setConnectionMethod('wifi');
    } else {
      setConnectionMethod('bluetooth');
    }
    setConnectionStatus('disconnected');
    setStatusMessage(`Selected: ${dp.name}`);
    toast({ title: 'Printer Selected', description: dp.name });
  };

  // ── Detect if printer is ESC/POS based on name ───────────────────────────
  const isEscPos = (name: string): boolean => {
    const n = name.toLowerCase();
    return (
      n.includes('mpt') || n.includes('xprinter') || n.includes('epson') ||
      n.includes('tm-') || n.includes('pos') || n.includes('thermal') ||
      n.includes('rongta') || n.includes('hprt') || n.includes('mini')
    );
  };

  // ── Generate ESC/POS test receipt ──────────────────────────────────────────
  const buildEscPosTest = (): Uint8Array => {
    const cmds: number[] = [];
    const txt = (s: string) => cmds.push(...Array.from(new TextEncoder().encode(s)));
    cmds.push(0x1B, 0x40);           // ESC @ — init
    cmds.push(0x1B, 0x61, 0x01);     // center
    cmds.push(0x1D, 0x21, 0x11);     // double size
    cmds.push(0x1B, 0x45, 0x01);     // bold on
    txt('Tampa APP\n');
    cmds.push(0x1B, 0x45, 0x00);     // bold off
    cmds.push(0x1D, 0x21, 0x00);     // normal size
    txt('Test Label\n');
    txt('------------------------\n');
    cmds.push(0x1B, 0x61, 0x00);     // align left
    txt(`Printer: ${printerName}\n`);
    txt(`Connection: Bluetooth\n`);
    txt(`Date: ${new Date().toLocaleString()}\n`);
    txt(`Darkness: ${darkness} | Speed: ${speed}\n`);
    txt(`Label: ${paperWidth}x${paperHeight}mm\n`);
    txt('------------------------\n');
    cmds.push(0x1B, 0x61, 0x01);     // center
    txt('If you see this,\n');
    txt('your printer is working!\n');
    cmds.push(0x0A, 0x0A, 0x0A);     // line feeds
    cmds.push(0x1D, 0x56, 0x00);     // cut
    return new Uint8Array(cmds);
  };

  // ── Build ZPL test label ──────────────────────────────────────────────────
  const buildZplTest = (): string => `^XA
^MMT
^PW812
^LL400
^LS0
^CI28
^FO30,30^GB752,70,3^FS
^FO40,48^A0N,45,45^FDTampa APP - Test Label^FS
^FO30,110^GB752,2,2^FS
^FO40,130^A0N,28,28^FDPrinter: ${printerName}^FS
^FO40,168^A0N,28,28^FDIP: ${ipAddress || 'Bluetooth'}:${port}^FS
^FO40,206^A0N,28,28^FDConnection: ${connectionMethod === 'wifi' ? 'WiFi / TCP' : 'Bluetooth'}^FS
^FO40,254^A0N,28,28^FDDate: ${new Date().toLocaleString()}^FS
^FO30,294^GB752,2,2^FS
^FO40,310^A0N,24,24^FDIf you see this, your printer is working!^FS
^FO40,350^A0N,20,20^FDDarkness: ${darkness} | Speed: ${speed} | ${paperWidth}x${paperHeight}mm^FS
^XZ`;

  /**
   * Discover writable BLE characteristic dynamically.
   * Tries cached service first, then known UUIDs, then enumerates all services.
   */
  const findBleCharacteristic = async (
    server: BluetoothRemoteGATTServer,
  ): Promise<BluetoothRemoteGATTCharacteristic> => {
    // Known UUIDs to try in order
    const KNOWN_SERVICES = [
      btGattInfoRef.current?.serviceUUID,                   // previously discovered
      '38eb4a80-c570-11e3-9507-0002a5d5c51b',              // Zebra BLE Parser (ZD411, ZD421, ZD621)
      '49535343-fe7d-4ae5-8fa9-9fafd205e455',              // ISS (MPT-II, many BLE printers)
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2',              // Nordic UART TX
      '000018f0-0000-1000-8000-00805f9b34fb',              // Zebra BTLE
      '0000fff0-0000-1000-8000-00805f9b34fb',              // Common printer service
      '0000ff00-0000-1000-8000-00805f9b34fb',              // Generic vendor
      '0000ae30-0000-1000-8000-00805f9b34fb',              // Zebra write service
      '00001101-0000-1000-8000-00805f9b34fb',              // SPP
    ].filter(Boolean) as string[];

    const KNOWN_CHARS = [
      btGattInfoRef.current?.characteristicUUID,
      '38eb4a82-c570-11e3-9507-0002a5d5c51b',              // Zebra BLE Parser write
      '49535343-8841-43f4-a8d4-ecbe34729bb3',              // ISS write
      'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',              // Nordic UART RX
      '0000fff2-0000-1000-8000-00805f9b34fb',              // Common printer write
    ].filter(Boolean) as string[];

    // 1️⃣ Try known service+characteristic pairs
    for (const svcUUID of KNOWN_SERVICES) {
      try {
        const svc = await server.getPrimaryService(svcUUID);
        for (const charUUID of KNOWN_CHARS) {
          try {
            const ch = await svc.getCharacteristic(charUUID);
            if (ch.properties.write || ch.properties.writeWithoutResponse) {
              btGattInfoRef.current = { serviceUUID: svcUUID, characteristicUUID: charUUID };
              console.log(`✅ BLE found writable char: svc=${svcUUID.slice(0,8)} char=${charUUID.slice(0,8)}`);
              return ch;
            }
          } catch { /* next char */ }
        }
        // If service found but no known char, enumerate all characteristics
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chars: BluetoothRemoteGATTCharacteristic[] = await (svc as any)['getCharacteristics']();
        for (const ch of chars) {
          if (ch.properties.write || ch.properties.writeWithoutResponse) {
            btGattInfoRef.current = { serviceUUID: svcUUID, characteristicUUID: ch.uuid };
            console.log(`✅ BLE enum char: svc=${svcUUID.slice(0,8)} char=${ch.uuid.slice(0,8)}`);
            return ch;
          }
        }
      } catch { /* service not found, next */ }
    }

    // 2️⃣ Last resort: enumerate ALL primary services
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const services: BluetoothRemoteGATTService[] = await (server as any)['getPrimaryServices']();
      for (const svc of services) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chars: BluetoothRemoteGATTCharacteristic[] = await (svc as any)['getCharacteristics']();
        for (const ch of chars) {
          if (ch.properties.write || ch.properties.writeWithoutResponse) {
            btGattInfoRef.current = { serviceUUID: svc.uuid, characteristicUUID: ch.uuid };
            console.log(`✅ BLE full-enum char: svc=${svc.uuid.slice(0,8)} char=${ch.uuid.slice(0,8)}`);
            return ch;
          }
        }
      }
    } catch (e) {
      console.warn('Cannot enumerate all services:', e);
    }

    // Log diagnostic info
    console.error('❌ BLE: No writable characteristic found after trying all known services');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allSvcs: BluetoothRemoteGATTService[] = await (server as any)['getPrimaryServices']();
      console.log('📋 Available BLE services:', allSvcs.map(s => s.uuid));
    } catch { console.log('📋 Could not enumerate services (access denied by browser)'); }

    const isZebra = (server.device.name || '').toLowerCase().match(/zebra|zd|zt|zq|zp|dfj/);
    if (isZebra) {
      throw new Error(
        'Zebra BLE: no writable GATT service found. ' +
        'The P1112640-017C adapter may need BLE data mode enabled.\n\n' +
        'In the Zebra Printer Setup app → Connectivity → Bluetooth:\n' +
        '• Set "Controller Mode" to "Both" or "LE"\n' +
        '• Or use WiFi (recommended for Zebra printers)'
      );
    }
    throw new Error('No writable BLE characteristic found. Make sure the printer is on and in range.');
  };

  // ── Print test label ──────────────────────────────────────────────────────
  const handlePrintTest = async () => {
    setIsPrinting(true);

    const printServerUrl =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PRINT_SERVER_URL) ||
      'http://localhost:3001';

    // ── Bluetooth path ──────────────────────────────────────────────────────
    if (connectionMethod === 'bluetooth' && btDeviceRef.current) {
      try {
        const device = btDeviceRef.current;
        const server = await device.gatt?.connect();
        if (!server) throw new Error('GATT connect failed');

        // Auto-discover writable characteristic
        const characteristic = await findBleCharacteristic(server);

        // Choose protocol based on printer name
        const useEscPos = isEscPos(device.name || printerName);
        const payload: Uint8Array = useEscPos
          ? buildEscPosTest()
          : new TextEncoder().encode(buildZplTest());

        console.log(`🖨️ Sending ${useEscPos ? 'ESC/POS' : 'ZPL'} test (${payload.length} bytes) to ${device.name}`);

        // Send in 512-byte chunks
        const CHUNK = 512;
        for (let i = 0; i < payload.length; i += CHUNK) {
          const chunk = payload.slice(i, i + CHUNK);
          await characteristic.writeValue(chunk);
          if (i + CHUNK < payload.length) await new Promise(r => setTimeout(r, 50));
        }

        server.disconnect();
        toast({ title: 'Test Label Sent!', description: `Sent via Bluetooth to ${device.name}.` });
        setConnectionStatus('connected');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const isZebraDevice = (btDeviceRef.current?.name || printerName).toLowerCase().match(/zebra|zd|zt|zq|zp|dfj/);

        // If Zebra and WiFi IP is available, auto-fallback to WiFi
        if (isZebraDevice && ipAddress && msg.includes('No writable BLE') || msg.includes('Zebra BLE')) {
          console.log(`🔄 BLE failed for Zebra, falling back to WiFi ${ipAddress}:${port}`);
          toast({ title: 'BLE unavailable', description: `Trying WiFi (${ipAddress})...` });
          // Don't return — fall through to WiFi path below
        } else {
          toast({ title: 'Bluetooth Print Failed', description: msg, variant: 'destructive' });
          setIsPrinting(false);
          return;
        }
      }
      // If we reach here from catch fallback, continue to WiFi path
      if (connectionStatus !== 'connected') {
        // fall through to WiFi
      } else {
        setIsPrinting(false);
        return;
      }
    }

    // ── WiFi / Network path ─────────────────────────────────────────────────
    const testZpl = buildZplTest();
    try {
      const res = await fetch(`${printServerUrl}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zpl: testZpl, copies: 1, ip: ipAddress, port: parseInt(port) || 9100 }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Test Label Sent!', description: 'Check your printer.' });
        setConnectionStatus('connected');
      } else {
        throw new Error(data.error);
      }
    } catch {
      // Fallback: WebSocket
      try {
        const ws = new WebSocket('ws://127.0.0.1:9100/');
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(() => { ws.close(); reject(new Error('timeout')); }, 10000);
          ws.onopen = () => { ws.send(testZpl); clearTimeout(t); setTimeout(() => { ws.close(); resolve(); }, 1000); };
          ws.onerror = () => { clearTimeout(t); reject(new Error('ws error')); };
        });
        toast({ title: 'Test Label Sent!', description: 'Sent via Zebra Browser Print.' });
        setConnectionStatus('connected');
      } catch {
        toast({ title: 'Print Failed', description: 'Could not send test label. Check your printer connection.', variant: 'destructive' });
      }
    } finally {
      setIsPrinting(false);
    }
  };

  // ── Status icon ───────────────────────────────────────────────────────────
  const StatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'testing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Signal className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Printer Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Printer Setup
          </CardTitle>
          <CardDescription>
            Configure your label printer. Changes are saved locally on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Printer Name */}
          <div className="space-y-2">
            <Label htmlFor="printer-name">Printer Name</Label>
            <Input
              id="printer-name"
              placeholder="e.g. Kitchen Printer"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
            />
          </div>

          {/* Printer Type */}
          <div className="space-y-2">
            <Label htmlFor="printer-type">Printer Type</Label>
            <Select value={printerType} onValueChange={(v) => setPrinterType(v as PrinterType)}>
              <SelectTrigger id="printer-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zebra">Zebra Thermal (ZPL)</SelectItem>
                <SelectItem value="universal">Universal (Auto-detect)</SelectItem>
                <SelectItem value="bluetooth">Bluetooth Printer</SelectItem>
                <SelectItem value="pdf">PDF Export</SelectItem>
                <SelectItem value="generic">Browser Print</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Connection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connection</CardTitle>
          <CardDescription>How is your printer connected?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Method Toggle */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={connectionMethod === 'wifi' ? 'default' : 'outline'}
              className="h-16 flex flex-col gap-1"
              onClick={() => setConnectionMethod('wifi')}
            >
              <Wifi className="h-5 w-5" />
              <span className="text-sm">WiFi / Network</span>
            </Button>
            <Button
              variant={connectionMethod === 'bluetooth' ? 'default' : 'outline'}
              className="h-16 flex flex-col gap-1"
              onClick={() => setConnectionMethod('bluetooth')}
            >
              <Bluetooth className="h-5 w-5" />
              <span className="text-sm">Bluetooth</span>
            </Button>
          </div>

          {/* WiFi Configuration */}
          {connectionMethod === 'wifi' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="ip-address">Printer IP Address</Label>
                  <Input
                    id="ip-address"
                    placeholder="e.g. 10.0.0.51"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    placeholder="9100"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                  />
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  To find your printer's IP address: hold the <strong>FEED</strong> button for 5
                  seconds to print a configuration label.
                </AlertDescription>
              </Alert>

              {/* Network Discovery */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleNetworkDiscovery}
                disabled={isScanning}
              >
                {isScanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isScanning ? 'Scanning network…' : 'Search for Printers on Network'}
              </Button>
            </div>
          )}

          {/* Bluetooth Configuration */}
          {connectionMethod === 'bluetooth' && (
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleBluetoothScan}
                disabled={isScanning}
              >
                {isScanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isScanning ? 'Scanning…' : 'Search for Bluetooth Printers'}
              </Button>

              {!navigator.bluetooth && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Bluetooth requires <strong>Chrome on Android</strong>. On iOS, use WiFi
                    connection instead.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Discovered Devices */}
          {discoveredDevices.length > 0 && (
            <div className="space-y-2">
              <Label>Discovered Printers</Label>
              <div className="space-y-2">
                {discoveredDevices.map((dp, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                    onClick={() => selectDiscoveredPrinter(dp)}
                  >
                    {dp.connectionType === 'bluetooth-le' ? (
                      <Bluetooth className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    ) : (
                      <Wifi className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{dp.name}</p>
                      {dp.connectionConfig.ipAddress && (
                        <p className="text-xs text-muted-foreground">
                          {dp.connectionConfig.ipAddress}:{dp.connectionConfig.port || 9100}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="flex-shrink-0">Select</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Connection Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <StatusIcon />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {connectionStatus === 'connected' && 'Connected'}
                {connectionStatus === 'testing' && 'Testing…'}
                {connectionStatus === 'error' && 'Connection Error'}
                {connectionStatus === 'disconnected' && 'Not Connected'}
              </p>
              {statusMessage && (
                <p className="text-xs text-muted-foreground">{statusMessage}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleTestConnection}
              disabled={connectionStatus === 'testing'}
            >
              {connectionStatus === 'testing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Test Connection
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handlePrintTest}
              disabled={isPrinting}
            >
              {isPrinting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Print Test Label
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings (Collapsible) */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Advanced Settings</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    advancedOpen ? 'rotate-180' : ''
                  }`}
                />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {/* Paper Size */}
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="102x180">102 × 180 mm (Standard)</SelectItem>
                    <SelectItem value="102x152">102 × 152 mm (4×6 in)</SelectItem>
                    <SelectItem value="76x127">76 × 127 mm (3×5 in)</SelectItem>
                    <SelectItem value="57x32">57 × 32 mm (Small)</SelectItem>
                    <SelectItem value="50x25">50 × 25 mm (Tiny)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Print Quality */}
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
                  <p className="text-xs text-muted-foreground">Higher = darker print</p>
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
                  <p className="text-xs text-muted-foreground">Higher = faster</p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Save Button */}
      <Button onClick={handleSave} size="lg" className="w-full gap-2">
        <Save className="h-4 w-4" />
        Save Printer Settings
      </Button>

      {/* Current Config Summary */}
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
              <span className="font-medium">{settings.type}</span>
              <span className="text-muted-foreground">Connection:</span>
              <span className="font-medium">
                {settings.connectionType?.replace('-', ' ').toUpperCase() || 'N/A'}
              </span>
              {settings.connectionConfig?.ipAddress && (
                <>
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-medium">
                    {settings.connectionConfig.ipAddress}:{settings.connectionConfig.port || 9100}
                  </span>
                </>
              )}
              <span className="text-muted-foreground">Label:</span>
              <span className="font-medium">{settings.paperWidth}×{settings.paperHeight} mm</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
