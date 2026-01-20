import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ZebraPrinterConfig } from '@/types/zebraPrinter';
import { Bluetooth, Wifi, Usb } from 'lucide-react';

interface PrinterConfigDialogProps {
  printer?: ZebraPrinterConfig | null;
  onClose: () => void;
  onSave: (config: Partial<ZebraPrinterConfig>) => void;
}

export function PrinterConfigDialog({ printer, onClose, onSave }: PrinterConfigDialogProps) {
  const [config, setConfig] = useState<Partial<ZebraPrinterConfig>>({
    name: printer?.name || '',
    model: printer?.model || 'ZD411',
    serialNumber: printer?.serialNumber || '',
    connectionType: printer?.connectionType || 'bluetooth',
    bluetoothAddress: printer?.bluetoothAddress || '',
    bluetoothName: printer?.bluetoothName || '',
    ipAddress: printer?.ipAddress || '',
    port: printer?.port || 6101,
    location: printer?.location || '',
    station: printer?.station || '',
    paperWidth: printer?.paperWidth || 102,
    paperHeight: printer?.paperHeight || 152,
    dpi: printer?.dpi || 203,
    darkness: printer?.darkness || 20,
    speed: printer?.speed || 4,
    isDefault: printer?.isDefault || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
  };

  const updateConfig = (field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {printer ? 'Editar Impressora' : 'Adicionar Nova Impressora'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="connection">Conexão</TabsTrigger>
              <TabsTrigger value="print">Impressão</TabsTrigger>
            </TabsList>

            {/* Basic Settings */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => updateConfig('name', e.target.value)}
                  placeholder="Ex: Impressora Rotulagem Principal"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Select
                    value={config.model}
                    onValueChange={(value) => updateConfig('model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZD411">ZD411</SelectItem>
                      <SelectItem value="ZD421">ZD421</SelectItem>
                      <SelectItem value="ZD611">ZD611</SelectItem>
                      <SelectItem value="ZD621">ZD621</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Número de Série</Label>
                  <Input
                    id="serialNumber"
                    value={config.serialNumber}
                    onChange={(e) => updateConfig('serialNumber', e.target.value)}
                    placeholder="Ex: DFJ253402166"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={config.location}
                    onChange={(e) => updateConfig('location', e.target.value)}
                    placeholder="Ex: Área de Produção"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="station">Estação</Label>
                  <Input
                    id="station"
                    value={config.station}
                    onChange={(e) => updateConfig('station', e.target.value)}
                    placeholder="Ex: Estação 1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={config.isDefault}
                  onChange={(e) => updateConfig('isDefault', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isDefault" className="font-normal cursor-pointer">
                  Definir como impressora padrão
                </Label>
              </div>
            </TabsContent>

            {/* Connection Settings */}
            <TabsContent value="connection" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Tipo de Conexão *</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={config.connectionType === 'bluetooth' ? 'default' : 'outline'}
                    onClick={() => updateConfig('connectionType', 'bluetooth')}
                    className="flex flex-col items-center justify-center h-20"
                  >
                    <Bluetooth className="w-6 h-6 mb-1" />
                    <span className="text-xs">Bluetooth</span>
                  </Button>
                  <Button
                    type="button"
                    variant={config.connectionType === 'wifi' ? 'default' : 'outline'}
                    onClick={() => updateConfig('connectionType', 'wifi')}
                    className="flex flex-col items-center justify-center h-20"
                  >
                    <Wifi className="w-6 h-6 mb-1" />
                    <span className="text-xs">Wi-Fi</span>
                  </Button>
                  <Button
                    type="button"
                    variant={config.connectionType === 'usb' ? 'default' : 'outline'}
                    onClick={() => updateConfig('connectionType', 'usb')}
                    className="flex flex-col items-center justify-center h-20"
                  >
                    <Usb className="w-6 h-6 mb-1" />
                    <span className="text-xs">USB</span>
                  </Button>
                </div>
              </div>

              {config.connectionType === 'bluetooth' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bluetoothAddress">Endereço Bluetooth</Label>
                    <Input
                      id="bluetoothAddress"
                      value={config.bluetoothAddress}
                      onChange={(e) => updateConfig('bluetoothAddress', e.target.value)}
                      placeholder="Ex: 00:11:22:33:44:55"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bluetoothName">Nome Bluetooth</Label>
                    <Input
                      id="bluetoothName"
                      value={config.bluetoothName}
                      onChange={(e) => updateConfig('bluetoothName', e.target.value)}
                      placeholder="Ex: PRINTER123"
                    />
                  </div>
                </>
              )}

              {config.connectionType === 'wifi' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ipAddress">Endereço IP *</Label>
                    <Input
                      id="ipAddress"
                      value={config.ipAddress}
                      onChange={(e) => updateConfig('ipAddress', e.target.value)}
                      placeholder="Ex: 192.168.1.100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Porta</Label>
                    <Select
                      value={String(config.port)}
                      onValueChange={(value) => updateConfig('port', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6101">6101 (Browser Print)</SelectItem>
                        <SelectItem value="9100">9100 (Web Services)</SelectItem>
                        <SelectItem value="9200">9200 (Setup Utilities)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {config.connectionType === 'usb' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    ℹ️ Conexão USB detectada automaticamente quando a impressora estiver conectada.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Print Settings */}
            <TabsContent value="print" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paperWidth">Largura do Papel (mm)</Label>
                  <Input
                    id="paperWidth"
                    type="number"
                    value={config.paperWidth}
                    onChange={(e) => updateConfig('paperWidth', parseInt(e.target.value))}
                    min="50"
                    max="120"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paperHeight">Altura do Papel (mm)</Label>
                  <Input
                    id="paperHeight"
                    type="number"
                    value={config.paperHeight}
                    onChange={(e) => updateConfig('paperHeight', parseInt(e.target.value))}
                    min="50"
                    max="200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dpi">DPI (Resolução)</Label>
                <Select
                  value={String(config.dpi)}
                  onValueChange={(value) => updateConfig('dpi', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="203">203 DPI (Padrão)</SelectItem>
                    <SelectItem value="300">300 DPI (Alta Qualidade)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="darkness">
                  Escuridão: {config.darkness}
                </Label>
                <input
                  id="darkness"
                  type="range"
                  min="0"
                  max="30"
                  value={config.darkness}
                  onChange={(e) => updateConfig('darkness', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  0 = Mais claro | 30 = Mais escuro (recomendado: 20)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="speed">
                  Velocidade: {config.speed} polegadas/seg
                </Label>
                <input
                  id="speed"
                  type="range"
                  min="2"
                  max="12"
                  value={config.speed}
                  onChange={(e) => updateConfig('speed', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  2 = Mais lento (melhor qualidade) | 12 = Mais rápido
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  ⚠️ Alterações nas configurações de impressão afetarão todos os trabalhos futuros.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {printer ? 'Salvar Alterações' : 'Adicionar Impressora'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
