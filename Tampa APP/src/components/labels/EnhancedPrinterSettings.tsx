// EnhancedPrinterSettings - Advanced UI for universal printer configuration
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  PrinterSettings as PrinterSettingsType, 
  ConnectionType, 
  PrinterProtocol,
  ConnectionConfig 
} from '@/types/printer';
import { usePrinter } from '@/hooks/usePrinter';
import { 
  Printer, 
  Save, 
  Settings, 
  Wifi, 
  Bluetooth, 
  Network, 
  Cable,
  Info,
  CheckCircle2
} from 'lucide-react';

export function EnhancedPrinterSettings() {
  const { settings, availablePrinters, saveSettings } = usePrinter();
  const [localSettings, setLocalSettings] = useState<PrinterSettingsType | null>(settings);
  const [activeTab, setActiveTab] = useState<string>('basic');

  const handlePrinterTypeChange = (type: any) => {
    if (!localSettings) return;
    
    const printer = availablePrinters.find(p => p.type === type);
    setLocalSettings({
      ...localSettings,
      type,
      name: printer?.name || type
    });
  };

  const handleConnectionTypeChange = (connectionType: ConnectionType) => {
    if (!localSettings) return;
    
    setLocalSettings({
      ...localSettings,
      connectionType,
      connectionConfig: {
        ...localSettings.connectionConfig,
        preferredConnection: connectionType,
      }
    });
  };

  const handleConnectionConfigChange = (key: keyof ConnectionConfig, value: any) => {
    if (!localSettings) return;
    
    setLocalSettings({
      ...localSettings,
      connectionConfig: {
        ...localSettings.connectionConfig,
        [key]: value
      }
    });
  };

  const handleSave = () => {
    if (localSettings) {
      saveSettings(localSettings);
    }
  };

  if (!localSettings) return null;

  const connectionType = localSettings.connectionType || 'tcp-ip';
  const connectionConfig = localSettings.connectionConfig || {};

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Universal Printer Configuration
        </CardTitle>
        <CardDescription>
          Configure your printer with support for multiple connection types (Bluetooth, TCP/IP, WiFi, Bridge adapters)
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* BASIC SETTINGS TAB */}
          <TabsContent value="basic" className="space-y-6 pt-4">
            {/* Printer Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="printer-type">Printer Type</Label>
              <Select value={localSettings.type} onValueChange={handlePrinterTypeChange}>
                <SelectTrigger id="printer-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePrinters.map(printer => (
                    <SelectItem key={printer.type} value={printer.type}>
                      <div className="flex flex-col py-1">
                        <div className="font-medium">{printer.name}</div>
                        <div className="text-xs text-muted-foreground">{printer.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {localSettings.type === 'universal' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Universal Printer</strong> supports multiple connection types with automatic fallback.
                  Perfect for Zebra D411 with Bluetooth-to-TCP adapter!
                </AlertDescription>
              </Alert>
            )}

            {/* Printer Name */}
            <div className="space-y-2">
              <Label htmlFor="printer-name">Printer Name</Label>
              <Input
                id="printer-name"
                type="text"
                value={localSettings.name}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  name: e.target.value
                })}
                placeholder="My Zebra D411"
              />
            </div>

            {/* Model & Manufacturer */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">Model (Optional)</Label>
                <Input
                  id="model"
                  type="text"
                  value={localSettings.model || ''}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    model: e.target.value
                  })}
                  placeholder="e.g., D411, ZD421"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer (Optional)</Label>
                <Input
                  id="manufacturer"
                  type="text"
                  value={localSettings.manufacturer || ''}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    manufacturer: e.target.value
                  })}
                  placeholder="e.g., Zebra, Epson"
                />
              </div>
            </div>

            {/* Protocol Selection */}
            {(localSettings.type === 'universal' || localSettings.type === 'bluetooth') && (
              <div className="space-y-2">
                <Label htmlFor="protocol">Print Protocol</Label>
                <Select 
                  value={localSettings.protocol || 'auto'} 
                  onValueChange={(value: PrinterProtocol) => setLocalSettings({
                    ...localSettings,
                    protocol: value
                  })}
                >
                  <SelectTrigger id="protocol">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect (Recommended)</SelectItem>
                    <SelectItem value="zpl">ZPL (Zebra)</SelectItem>
                    <SelectItem value="escpos">ESC/POS (Epson, Star, etc.)</SelectItem>
                    <SelectItem value="cpcl">CPCL (Citizen)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Auto-detect will determine the protocol based on printer model
                </p>
              </div>
            )}

            {/* Paper Size Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paper-width">Paper Width (mm)</Label>
                <Input
                  id="paper-width"
                  type="number"
                  min="50"
                  max="300"
                  value={localSettings.paperWidth}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    paperWidth: Number(e.target.value)
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paper-height">Paper Height (mm)</Label>
                <Input
                  id="paper-height"
                  type="number"
                  min="50"
                  max="300"
                  value={localSettings.paperHeight}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    paperHeight: Number(e.target.value)
                  })}
                />
              </div>
            </div>
          </TabsContent>

          {/* CONNECTION SETTINGS TAB */}
          <TabsContent value="connection" className="space-y-6 pt-4">
            {/* Connection Type Selector */}
            <div className="space-y-2">
              <Label>Connection Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(['tcp-ip', 'wifi', 'bridge', 'bluetooth-le', 'bluetooth-classic'] as ConnectionType[]).map((type) => {
                  const isSelected = connectionType === type;
                  const icons = {
                    'tcp-ip': <Network className="h-4 w-4" />,
                    'wifi': <Wifi className="h-4 w-4" />,
                    'bridge': <Cable className="h-4 w-4" />,
                    'bluetooth-le': <Bluetooth className="h-4 w-4" />,
                    'bluetooth-classic': <Bluetooth className="h-4 w-4" />
                  };
                  const labels = {
                    'tcp-ip': 'TCP/IP',
                    'wifi': 'WiFi',
                    'bridge': 'Bridge Adapter',
                    'bluetooth-le': 'Bluetooth LE',
                    'bluetooth-classic': 'Bluetooth Classic'
                  };
                  
                  return (
                    <Button
                      key={type}
                      variant={isSelected ? 'default' : 'outline'}
                      className="flex items-center gap-2 h-auto py-3"
                      onClick={() => handleConnectionTypeChange(type)}
                    >
                      {icons[type]}
                      <span className="text-sm">{labels[type]}</span>
                      {isSelected && <CheckCircle2 className="h-3 w-3 ml-auto" />}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* TCP/IP / WiFi Settings */}
            {(connectionType === 'tcp-ip' || connectionType === 'wifi') && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Network Connection Settings
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="ip-address">IP Address</Label>
                    <Input
                      id="ip-address"
                      type="text"
                      placeholder="192.168.1.100"
                      value={connectionConfig.ipAddress || ''}
                      onChange={(e) => handleConnectionConfigChange('ipAddress', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      type="number"
                      placeholder="9100"
                      value={connectionConfig.port || 9100}
                      onChange={(e) => handleConnectionConfigChange('port', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hostname">Hostname (Optional)</Label>
                  <Input
                    id="hostname"
                    type="text"
                    placeholder="printer.local"
                    value={connectionConfig.hostname || ''}
                    onChange={(e) => handleConnectionConfigChange('hostname', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use hostname instead of IP address if your printer supports mDNS/Bonjour
                  </p>
                </div>
              </div>
            )}

            {/* Bridge Adapter Settings */}
            {connectionType === 'bridge' && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Cable className="h-4 w-4" />
                  Bluetooth-to-TCP Bridge Adapter Settings
                </h3>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>For Zebra D411 with adapter:</strong> Enter the IP address assigned to your
                    Bluetooth-to-TCP bridge device. This allows your BLE-only printer to work over WiFi!
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="bridge-ip">Bridge IP Address</Label>
                    <Input
                      id="bridge-ip"
                      type="text"
                      placeholder="192.168.1.150"
                      value={connectionConfig.bridgeIpAddress || ''}
                      onChange={(e) => handleConnectionConfigChange('bridgeIpAddress', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bridge-port">Bridge Port</Label>
                    <Input
                      id="bridge-port"
                      type="number"
                      placeholder="9100"
                      value={connectionConfig.bridgePort || 9100}
                      onChange={(e) => handleConnectionConfigChange('bridgePort', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bridge-mac">Bridge MAC Address (Optional)</Label>
                  <Input
                    id="bridge-mac"
                    type="text"
                    placeholder="00:11:22:33:44:55"
                    value={connectionConfig.bridgeMacAddress || ''}
                    onChange={(e) => handleConnectionConfigChange('bridgeMacAddress', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Useful for identifying the correct bridge if you have multiple devices
                  </p>
                </div>
              </div>
            )}

            {/* Bluetooth Settings */}
            {(connectionType === 'bluetooth-le' || connectionType === 'bluetooth-classic') && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Bluetooth className="h-4 w-4" />
                  Bluetooth Connection Settings
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="bt-device-name">Device Name (Optional)</Label>
                  <Input
                    id="bt-device-name"
                    type="text"
                    placeholder="D411-1234"
                    value={connectionConfig.bluetoothDeviceName || ''}
                    onChange={(e) => handleConnectionConfigChange('bluetoothDeviceName', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to scan for all available devices
                  </p>
                </div>

                {connectionType === 'bluetooth-le' && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Bluetooth LE will prompt you to select a device when connecting.
                      Advanced UUID configuration is available in the Advanced tab.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Fallback Connections */}
            {localSettings.type === 'universal' && (
              <div className="space-y-2">
                <Label>Connection Fallback Strategy</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default">
                    Primary: {connectionType.toUpperCase().replace('-', ' ')}
                  </Badge>
                  <span className="text-sm text-muted-foreground">→</span>
                  <Badge variant="secondary">Fallback: Auto</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  If primary connection fails, the system will automatically try alternative connection methods
                </p>
              </div>
            )}
          </TabsContent>

          {/* ADVANCED SETTINGS TAB */}
          <TabsContent value="advanced" className="space-y-6 pt-4">
            {/* Print Quality Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="darkness">Print Darkness (0-30)</Label>
                <Input
                  id="darkness"
                  type="number"
                  min="0"
                  max="30"
                  value={localSettings.darkness || 20}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    darkness: Number(e.target.value)
                  })}
                />
                <p className="text-xs text-muted-foreground">Higher = darker</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="speed">Print Speed (2-12)</Label>
                <Input
                  id="speed"
                  type="number"
                  min="2"
                  max="12"
                  value={localSettings.speed || 4}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    speed: Number(e.target.value)
                  })}
                />
                <p className="text-xs text-muted-foreground">Higher = faster</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dpi">DPI</Label>
                <Select 
                  value={String(localSettings.dpi || 203)} 
                  onValueChange={(value) => setLocalSettings({
                    ...localSettings,
                    dpi: Number(value)
                  })}
                >
                  <SelectTrigger id="dpi">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="203">203 DPI (Standard)</SelectItem>
                    <SelectItem value="300">300 DPI (High Quality)</SelectItem>
                    <SelectItem value="600">600 DPI (Premium)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Behavior Settings */}
            <div className="space-y-2">
              <Label htmlFor="default-quantity">Default Print Quantity</Label>
              <Input
                id="default-quantity"
                type="number"
                min="1"
                max="100"
                value={localSettings.defaultQuantity}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  defaultQuantity: Number(e.target.value)
                })}
              />
            </div>

            {/* Connection Timeout */}
            <div className="space-y-2">
              <Label htmlFor="timeout">Connection Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                min="1000"
                max="30000"
                step="1000"
                value={connectionConfig.timeout || 5000}
                onChange={(e) => handleConnectionConfigChange('timeout', Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Time to wait before giving up on connection attempt
              </p>
            </div>

            {/* Auto Reconnect */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto-reconnect"
                checked={connectionConfig.autoReconnect ?? true}
                onChange={(e) => handleConnectionConfigChange('autoReconnect', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="auto-reconnect" className="cursor-pointer">
                Auto-reconnect on connection loss
              </Label>
            </div>

            {/* Advanced Bluetooth Settings */}
            {(connectionType === 'bluetooth-le' || connectionType === 'bluetooth-classic') && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium text-sm">Advanced Bluetooth Configuration</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="bt-service-uuid">Service UUID (Optional)</Label>
                  <Input
                    id="bt-service-uuid"
                    type="text"
                    placeholder="49535343-fe7d-4ae5-8fa9-9fafd205e455"
                    value={connectionConfig.bluetoothServiceUUID || ''}
                    onChange={(e) => handleConnectionConfigChange('bluetoothServiceUUID', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bt-char-uuid">Characteristic UUID (Optional)</Label>
                  <Input
                    id="bt-char-uuid"
                    type="text"
                    placeholder="49535343-8841-43f4-a8d4-ecbe34729bb3"
                    value={connectionConfig.bluetoothCharacteristicUUID || ''}
                    onChange={(e) => handleConnectionConfigChange('bluetoothCharacteristicUUID', e.target.value)}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Leave empty to use defaults. Only modify if you know the specific UUIDs for your printer.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t mt-6">
          <Button onClick={handleSave} className="gap-2" size="lg">
            <Save className="h-4 w-4" />
            Save Configuration
          </Button>
        </div>

        {/* Current Configuration Summary */}
        <div className="pt-6 border-t mt-6">
          <h3 className="font-medium text-sm mb-3">Current Configuration Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Printer:</span>{' '}
              <span className="font-medium">{localSettings.name}</span>
            </div>
            {localSettings.model && (
              <div>
                <span className="text-muted-foreground">Model:</span>{' '}
                <span className="font-medium">{localSettings.model}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Connection:</span>{' '}
              <span className="font-medium">{connectionType.toUpperCase().replace('-', ' ')}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Protocol:</span>{' '}
              <span className="font-medium">{(localSettings.protocol || 'auto').toUpperCase()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Label Size:</span>{' '}
              <span className="font-medium">{localSettings.paperWidth}mm × {localSettings.paperHeight}mm</span>
            </div>
            <div>
              <span className="text-muted-foreground">Quality:</span>{' '}
              <span className="font-medium">{localSettings.dpi || 203} DPI, Darkness {localSettings.darkness || 20}</span>
            </div>
            {connectionConfig.ipAddress && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Network:</span>{' '}
                <span className="font-medium">{connectionConfig.ipAddress}:{connectionConfig.port || 9100}</span>
              </div>
            )}
            {connectionConfig.bridgeIpAddress && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Bridge:</span>{' '}
                <span className="font-medium">{connectionConfig.bridgeIpAddress}:{connectionConfig.bridgePort || 9100}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
