// PrinterSettings - UI component for printer configuration
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrinterType, PrinterSettings as PrinterSettingsType } from '@/types/printer';
import { usePrinter } from '@/hooks/usePrinter';
import { Printer, Save, Settings } from 'lucide-react';

export function PrinterSettings() {
  const { settings, availablePrinters, saveSettings } = usePrinter();
  const [localSettings, setLocalSettings] = useState<PrinterSettingsType | null>(settings);

  const handlePrinterTypeChange = (type: PrinterType) => {
    if (!localSettings) return;
    
    setLocalSettings({
      ...localSettings,
      type,
      name: availablePrinters.find(p => p.type === type)?.name || type
    });
  };

  const handleSave = () => {
    if (localSettings) {
      saveSettings(localSettings);
    }
  };

  if (!localSettings) return null;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Printer Settings
        </CardTitle>
        <CardDescription>
          Configure your label printer settings. Changes are saved automatically.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
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
                  <div className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{printer.name}</div>
                      <div className="text-xs text-muted-foreground">{printer.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

        {/* Default Quantity */}
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

        {/* Zebra-specific Settings */}
        {localSettings.type === 'zebra' && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-medium text-sm">Zebra Thermal Printer Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zebra-ip">IP Address</Label>
                <Input
                  id="zebra-ip"
                  type="text"
                  placeholder="192.168.1.100"
                  value={localSettings.ipAddress || ''}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    ipAddress: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zebra-port">Port</Label>
                <Input
                  id="zebra-port"
                  type="number"
                  min="1"
                  max="65535"
                  placeholder="9100"
                  value={localSettings.port || 9100}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    port: Number(e.target.value)
                  })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zebra-darkness">Print Darkness (0-30)</Label>
                <Input
                  id="zebra-darkness"
                  type="number"
                  min="0"
                  max="30"
                  value={localSettings.darkness || 20}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    darkness: Number(e.target.value)
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Higher values = darker print
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zebra-speed">Print Speed (2-12)</Label>
                <Input
                  id="zebra-speed"
                  type="number"
                  min="2"
                  max="12"
                  value={localSettings.speed || 4}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    speed: Number(e.target.value)
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Higher values = faster print
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>

        {/* Current Configuration Summary */}
        <div className="pt-4 border-t">
          <h3 className="font-medium text-sm mb-2">Current Configuration</h3>
          <div className="text-sm space-y-1 text-muted-foreground">
            <div>Printer: <span className="font-medium text-foreground">{localSettings.name}</span></div>
            <div>Label Size: <span className="font-medium text-foreground">{localSettings.paperWidth}mm × {localSettings.paperHeight}mm</span></div>
            <div>Default Quantity: <span className="font-medium text-foreground">{localSettings.defaultQuantity}</span></div>
            {localSettings.type === 'zebra' && localSettings.ipAddress && (
              <div>Network: <span className="font-medium text-foreground">{localSettings.ipAddress}:{localSettings.port}</span></div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
