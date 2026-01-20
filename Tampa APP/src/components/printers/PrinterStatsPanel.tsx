import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ZebraPrinterConfig, PrinterStats } from '@/types/zebraPrinter';
import { Activity, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface PrinterStatsPanelProps {
  printers: ZebraPrinterConfig[];
  stats: Map<string, PrinterStats>;
}

export function PrinterStatsPanel({ printers, stats }: PrinterStatsPanelProps) {
  // Calculate overall statistics
  const overallStats = {
    totalJobs: 0,
    successfulJobs: 0,
    failedJobs: 0,
    avgLatency: 0,
    totalPrinters: printers.length,
    activePrinters: printers.filter(p => p.status === 'ready' || p.status === 'busy').length
  };

  let latencySum = 0;
  let latencyCount = 0;

  stats.forEach((stat) => {
    overallStats.totalJobs += stat.totalJobs;
    overallStats.successfulJobs += stat.successfulJobs;
    overallStats.failedJobs += stat.failedJobs;
    if (stat.avgLatencyMs && stat.totalJobs > 0) {
      latencySum += stat.avgLatencyMs * stat.totalJobs;
      latencyCount += stat.totalJobs;
    }
  });

  if (latencyCount > 0) {
    overallStats.avgLatency = Math.round(latencySum / latencyCount);
  }

  const successRate = overallStats.totalJobs > 0
    ? ((overallStats.successfulJobs / overallStats.totalJobs) * 100).toFixed(1)
    : '0';

  // Prepare chart data
  const printerChartData = printers.map(printer => {
    const printerStats = stats.get(printer.id);
    return {
      name: printer.name.length > 15 ? printer.name.substring(0, 15) + '...' : printer.name,
      success: printerStats?.successfulJobs || 0,
      failed: printerStats?.failedJobs || 0,
      uptime: printerStats?.uptimePercentage || 0
    };
  }).filter(data => data.success + data.failed > 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Trabalhos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              Em {printers.length} impressora{printers.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.successfulJobs} de {overallStats.totalJobs} trabalhos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trabalhos Falhados</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overallStats.failedJobs}</div>
            <p className="text-xs text-muted-foreground">
              {((overallStats.failedJobs / (overallStats.totalJobs || 1)) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latência Média</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.avgLatency}ms</div>
            <p className="text-xs text-muted-foreground">
              Tempo médio de resposta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Printer Performance Chart */}
      {printerChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Impressora</CardTitle>
            <CardDescription>
              Comparação de trabalhos bem-sucedidos vs. falhados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={printerChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="success" fill="#22c55e" name="Sucesso" />
                <Bar dataKey="failed" fill="#ef4444" name="Falha" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Uptime Chart */}
      {printerChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Sucesso por Impressora</CardTitle>
            <CardDescription>
              Porcentagem de trabalhos concluídos com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={printerChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                <Bar dataKey="uptime" fill="#3b82f6" name="Taxa de Sucesso %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Individual Printer Details */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {printers.map((printer) => {
          const printerStats = stats.get(printer.id);
          if (!printerStats || printerStats.totalJobs === 0) return null;

          return (
            <Card key={printer.id}>
              <CardHeader>
                <CardTitle className="text-base">{printer.name}</CardTitle>
                <CardDescription>{printer.model}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total de trabalhos:</span>
                  <span className="font-semibold">{printerStats.totalJobs}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bem-sucedidos:</span>
                  <span className="font-semibold text-green-600">
                    {printerStats.successfulJobs}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Falhados:</span>
                  <span className="font-semibold text-red-600">
                    {printerStats.failedJobs}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de sucesso:</span>
                  <span className="font-semibold text-blue-600">
                    {printerStats.uptimePercentage.toFixed(1)}%
                  </span>
                </div>

                {printerStats.avgLatencyMs && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Latência média:</span>
                    <span className="font-semibold">{Math.round(printerStats.avgLatencyMs)}ms</span>
                  </div>
                )}

                {printerStats.lastJobAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Último trabalho:</span>
                    <span className="font-semibold">
                      {new Date(printerStats.lastJobAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="pt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${printerStats.uptimePercentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {printers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Nenhuma estatística disponível</p>
            <p className="text-sm text-muted-foreground">
              Adicione impressoras e comece a imprimir para ver estatísticas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
