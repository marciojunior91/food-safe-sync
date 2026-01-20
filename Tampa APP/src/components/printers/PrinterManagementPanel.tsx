import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Wifi, 
  Bluetooth, 
  Usb, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Settings,
  Activity,
  Printer
} from 'lucide-react';
import { ZebraPrinterManager } from '@/lib/zebraPrinterManager';
import { ZebraPrinterConfig, DiscoveredPrinter, PrinterStats } from '@/types/zebraPrinter';
import { PrinterConfigDialog } from './PrinterConfigDialog';
import { PrinterStatsPanel } from './PrinterStatsPanel';
import { PrinterDiscoveryPanel } from './PrinterDiscoveryPanel';
import { useToast } from '@/hooks/use-toast';

interface PrinterManagementPanelProps {
  organizationId: string;
  onPrinterSelect?: (printerId: string) => void;
}

export function PrinterManagementPanel({ 
  organizationId, 
  onPrinterSelect 
}: PrinterManagementPanelProps) {
  const { toast } = useToast();
  const [printers, setPrinters] = useState<ZebraPrinterConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrinter, setSelectedPrinter] = useState<ZebraPrinterConfig | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [printerStats, setPrinterStats] = useState<Map<string, PrinterStats>>(new Map());

  const manager = ZebraPrinterManager.getInstance();

  // Load printers from database
  const loadPrinters = async () => {
    try {
      setLoading(true);
      const allPrinters = await manager.getAllPrinters();
      setPrinters(allPrinters);

      // Load stats for each printer
      const stats = new Map<string, PrinterStats>();
      for (const printer of allPrinters) {
        const printerStats = await manager.getStats(printer.id);
        stats.set(printer.id, printerStats);
      }
      setPrinterStats(stats);
    } catch (error) {
      console.error('Failed to load printers:', error);
      toast({
        title: 'Erro ao carregar impressoras',
        description: 'Não foi possível carregar a lista de impressoras.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrinters();
  }, [organizationId]);

  // Test printer connection
  const handleTestConnection = async (printer: ZebraPrinterConfig) => {
    try {
      toast({
        title: 'Testando conexão...',
        description: `Conectando à impressora ${printer.name}`
      });

      const result = await manager.testConnection(printer);
      
      if (result.success) {
        toast({
          title: '✅ Conexão bem-sucedida',
          description: `Conectado via ${result.method} na porta ${result.port} (${result.latencyMs}ms)`,
        });
      } else {
        toast({
          title: '❌ Falha na conexão',
          description: result.error || 'Não foi possível conectar à impressora',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: 'Erro no teste',
        description: 'Ocorreu um erro ao testar a conexão',
        variant: 'destructive'
      });
    }
  };

  // Set default printer
  const handleSetDefault = async (printerId: string) => {
    try {
      const printer = printers.find(p => p.id === printerId);
      if (!printer) return;

      await manager.updatePrinter(printerId, { isDefault: true });
      await loadPrinters();

      toast({
        title: 'Impressora padrão definida',
        description: `${printer.name} agora é a impressora padrão`
      });
    } catch (error) {
      console.error('Failed to set default printer:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível definir impressora padrão',
        variant: 'destructive'
      });
    }
  };

  // Delete printer
  const handleDeletePrinter = async (printerId: string) => {
    if (!confirm('Tem certeza que deseja remover esta impressora?')) return;

    try {
      await manager.removePrinter(printerId);
      await loadPrinters();

      toast({
        title: 'Impressora removida',
        description: 'A impressora foi removida com sucesso'
      });
    } catch (error) {
      console.error('Failed to delete printer:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a impressora',
        variant: 'destructive'
      });
    }
  };

  // Handle printer discovery complete
  const handleDiscoveryComplete = async (discovered: DiscoveredPrinter[]) => {
    setShowDiscovery(false);
    
    if (discovered.length === 0) {
      toast({
        title: 'Nenhuma impressora encontrada',
        description: 'Certifique-se de que as impressoras estão ligadas e conectadas à rede'
      });
      return;
    }

    // Auto-add discovered printers
    for (const printer of discovered) {
      try {
        const config: Omit<ZebraPrinterConfig, 'id' | 'createdAt' | 'updatedAt'> = {
          name: printer.name,
          model: printer.model || 'ZD411',
          serialNumber: printer.serialNumber || 'UNKNOWN',
          connectionType: printer.connectionType,
          ipAddress: printer.ipAddress,
          port: printer.port,
          bluetoothAddress: printer.bluetoothAddress,
          bluetoothName: printer.bluetoothName,
          status: 'offline',
          isDefault: false,
          organizationId: organizationId,
        };

        await manager.addPrinter(config);
      } catch (error) {
        console.error('Failed to add discovered printer:', error);
      }
    }

    await loadPrinters();

    toast({
      title: `${discovered.length} impressora(s) encontrada(s)`,
      description: 'As impressoras foram adicionadas ao sistema'
    });
  };

  // Render connection icon
  const getConnectionIcon = (type: 'bluetooth' | 'wifi' | 'usb') => {
    switch (type) {
      case 'bluetooth':
        return <Bluetooth className="w-4 h-4" />;
      case 'wifi':
        return <Wifi className="w-4 h-4" />;
      case 'usb':
        return <Usb className="w-4 h-4" />;
    }
  };

  // Render status badge
  const getStatusBadge = (status: ZebraPrinterConfig['status']) => {
    const variants = {
      ready: { icon: CheckCircle2, color: 'bg-green-500', text: 'Pronta' },
      busy: { icon: Activity, color: 'bg-blue-500', text: 'Em uso' },
      offline: { icon: XCircle, color: 'bg-gray-500', text: 'Offline' },
      error: { icon: AlertTriangle, color: 'bg-red-500', text: 'Erro' },
      paused: { icon: AlertTriangle, color: 'bg-yellow-500', text: 'Pausada' }
    };

    const variant = variants[status];
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {variant.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Printer className="w-6 h-6" />
            Gerenciamento de Impressoras
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure e monitore impressoras Zebra ZD411
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowDiscovery(true)}
            variant="outline"
          >
            <Search className="w-4 h-4 mr-2" />
            Descobrir Impressoras
          </Button>
          <Button onClick={() => setShowConfigDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Impressora
          </Button>
        </div>
      </div>

      <Tabs defaultValue="printers" className="w-full">
        <TabsList>
          <TabsTrigger value="printers">Impressoras ({printers.length})</TabsTrigger>
          <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
        </TabsList>

        {/* Printers List */}
        <TabsContent value="printers" className="space-y-4">
          {printers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Printer className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Nenhuma impressora cadastrada</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione uma impressora manualmente ou use a busca automática
                </p>
                <Button onClick={() => setShowDiscovery(true)}>
                  <Search className="w-4 h-4 mr-2" />
                  Descobrir Impressoras
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {printers.map((printer) => {
                const stats = printerStats.get(printer.id);
                
                return (
                  <Card key={printer.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getConnectionIcon(printer.connectionType)}
                          <div>
                            <CardTitle className="text-lg">{printer.name}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {printer.model}
                              {printer.serialNumber && ` • S/N: ${printer.serialNumber}`}
                            </CardDescription>
                          </div>
                        </div>
                        {printer.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            Padrão
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        {getStatusBadge(printer.status)}
                      </div>

                      {/* Location */}
                      {printer.location && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Local:</span>
                          <span className="font-medium">{printer.location}</span>
                        </div>
                      )}

                      {/* Station */}
                      {printer.station && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Estação:</span>
                          <span className="font-medium">{printer.station}</span>
                        </div>
                      )}

                      {/* Connection Info */}
                      <div className="text-xs text-muted-foreground">
                        {printer.connectionType === 'wifi' && printer.ipAddress && (
                          <div>IP: {printer.ipAddress}:{printer.port}</div>
                        )}
                        {printer.connectionType === 'bluetooth' && printer.bluetoothAddress && (
                          <div>BT: {printer.bluetoothAddress}</div>
                        )}
                      </div>

                      {/* Stats */}
                      {stats && stats.totalJobs > 0 && (
                        <div className="pt-2 border-t grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-muted-foreground">Trabalhos</div>
                            <div className="font-semibold">{stats.totalJobs}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Sucesso</div>
                            <div className="font-semibold text-green-600">
                              {stats.uptimePercentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleTestConnection(printer)}
                        >
                          Testar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPrinter(printer);
                            setShowConfigDialog(true);
                          }}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        {!printer.isDefault && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => handleSetDefault(printer.id)}
                          >
                            Definir Padrão
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeletePrinter(printer.id)}
                        >
                          Remover
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <PrinterStatsPanel printers={printers} stats={printerStats} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showConfigDialog && (
        <PrinterConfigDialog
          printer={selectedPrinter}
          onClose={() => {
            setShowConfigDialog(false);
            setSelectedPrinter(null);
          }}
          onSave={async (config) => {
            try {
              if (selectedPrinter) {
                await manager.updatePrinter(selectedPrinter.id, config);
              } else {
                // Para nova impressora, garantir campos obrigatórios
                const newConfig: Omit<ZebraPrinterConfig, 'id' | 'createdAt' | 'updatedAt'> = {
                  name: config.name || 'Nova Impressora',
                  model: config.model || 'ZD411',
                  serialNumber: config.serialNumber || 'UNKNOWN',
                  connectionType: config.connectionType || 'wifi',
                  status: config.status || 'offline',
                  isDefault: config.isDefault || false,
                  organizationId: organizationId,
                  // Campos opcionais
                  ipAddress: config.ipAddress,
                  port: config.port,
                  websocketPort: config.websocketPort,
                  bluetoothAddress: config.bluetoothAddress,
                  bluetoothName: config.bluetoothName,
                  location: config.location,
                  station: config.station,
                  paperWidth: config.paperWidth,
                  paperHeight: config.paperHeight,
                  dpi: config.dpi,
                  darkness: config.darkness,
                  speed: config.speed,
                  enabled: config.enabled,
                  lastSeen: config.lastSeen,
                };
                await manager.addPrinter(newConfig);
              }
              await loadPrinters();
              setShowConfigDialog(false);
              setSelectedPrinter(null);
              
              toast({
                title: selectedPrinter ? 'Impressora atualizada' : 'Impressora adicionada',
                description: 'As configurações foram salvas com sucesso'
              });
            } catch (error) {
              console.error('Failed to save printer:', error);
              toast({
                title: 'Erro',
                description: 'Não foi possível salvar as configurações',
                variant: 'destructive'
              });
            }
          }}
        />
      )}

      {showDiscovery && (
        <PrinterDiscoveryPanel
          onClose={() => setShowDiscovery(false)}
          onComplete={handleDiscoveryComplete}
        />
      )}
    </div>
  );
}
