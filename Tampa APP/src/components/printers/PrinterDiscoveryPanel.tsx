import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { DiscoveredPrinter } from '@/types/zebraPrinter';
import { ZebraPrinterManager } from '@/lib/zebraPrinterManager';
import { Search, Wifi, Bluetooth, CheckCircle2, Loader2 } from 'lucide-react';

interface PrinterDiscoveryPanelProps {
  onClose: () => void;
  onComplete: (printers: DiscoveredPrinter[]) => void;
}

export function PrinterDiscoveryPanel({ onClose, onComplete }: PrinterDiscoveryPanelProps) {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [discovered, setDiscovered] = useState<DiscoveredPrinter[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const manager = ZebraPrinterManager.getInstance();

  const handleStartScan = async () => {
    setScanning(true);
    setProgress(0);
    setDiscovered([]);
    setSelected(new Set());

    try {
      // Simulate progress during scan
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 95));
      }, 200);

      const printers = await manager.discoverPrinters();

      clearInterval(progressInterval);
      setProgress(100);
      setDiscovered(printers);

      // Auto-select all discovered printers
      const allIds = new Set(printers.map(p => p.id));
      setSelected(allIds);
    } catch (error) {
      console.error('Discovery failed:', error);
    } finally {
      setScanning(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleComplete = () => {
    const selectedPrinters = discovered.filter(p => selected.has(p.id));
    onComplete(selectedPrinters);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Descobrir Impressoras
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Como funciona:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Busca impressoras Zebra conectadas à rede local (Wi-Fi)</li>
              <li>Testa conexão nas portas 6101, 9100 e 9200</li>
              <li>Detecta impressoras via broadcast UDP (porta 9200)</li>
              <li>Bluetooth não é detectado automaticamente (adicione manualmente)</li>
            </ul>
          </div>

          {/* Start Scan Button */}
          {!scanning && discovered.length === 0 && (
            <div className="flex justify-center py-8">
              <Button size="lg" onClick={handleStartScan}>
                <Search className="w-5 h-5 mr-2" />
                Iniciar Busca
              </Button>
            </div>
          )}

          {/* Scanning Progress */}
          {scanning && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-lg font-medium">Buscando impressoras na rede...</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                Isso pode levar até 30 segundos
              </p>
            </div>
          )}

          {/* Discovery Results */}
          {!scanning && discovered.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {discovered.length} impressora{discovered.length !== 1 ? 's' : ''} encontrada{discovered.length !== 1 ? 's' : ''}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected(new Set(discovered.map(p => p.id)))}
                  >
                    Selecionar Todas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected(new Set())}
                  >
                    Limpar Seleção
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                {discovered.map((printer) => {
                  const isSelected = selected.has(printer.id);

                  return (
                    <Card
                      key={printer.id}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-gray-400'
                      }`}
                      onClick={() => toggleSelection(printer.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-1">
                              {printer.connectionType === 'wifi' ? (
                                <Wifi className="w-5 h-5 text-blue-500" />
                              ) : (
                                <Bluetooth className="w-5 h-5 text-blue-500" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{printer.name}</h4>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                )}
                              </div>
                              
                              <p className="text-sm text-muted-foreground mt-1">
                                {printer.model}
                              </p>
                              
                              <div className="mt-2 space-y-1 text-sm">
                                {printer.ipAddress && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">IP:</span>
                                    <span className="font-mono">
                                      {printer.ipAddress}:{printer.port}
                                    </span>
                                  </div>
                                )}
                                
                                {printer.bluetoothAddress && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Bluetooth:</span>
                                    <span className="font-mono">{printer.bluetoothAddress}</span>
                                  </div>
                                )}

                                {printer.bluetoothName && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Nome BT:</span>
                                    <span className="font-mono">{printer.bluetoothName}</span>
                                  </div>
                                )}
                              </div>

                              {printer.method && (
                                <div className="mt-2">
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    Descoberto via {printer.method}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={handleStartScan}>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar Novamente
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={selected.size === 0}
                  >
                    Adicionar {selected.size} Impressora{selected.size !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* No Results */}
          {!scanning && discovered.length === 0 && progress === 100 && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma impressora encontrada</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Certifique-se de que as impressoras estão ligadas e conectadas à mesma rede
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={handleStartScan}>
                  <Search className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
