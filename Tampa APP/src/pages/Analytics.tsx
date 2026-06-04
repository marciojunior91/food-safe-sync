// Analytics & Reports page — data-driven (no mocks).
//
// All metrics flow through hooks in src/hooks/useAnalytics.ts which scope
// queries to the current org and a user-selected date range. See that file
// for the formula behind each KPI.

import { useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatsCard } from '@/components/StatsCard';
import {
  DateRangePicker,
  type AnalyticsDateRange,
} from '@/components/analytics/DateRangePicker';
import { useUserContext } from '@/hooks/useUserContext';
import {
  defaultDateRange,
  useAnalyticsKpis,
  useAreaSummary,
  useComplianceBreakdown,
  useComplianceTrend,
  useDiscardReasons,
  useRecentWaste,
  useWasteTrend,
} from '@/hooks/useAnalytics';
import { exportAnalyticsPdf, exportAnalyticsXlsx } from '@/utils/exportAnalytics';

const PIE_COLORS = ['#2563eb', '#dc2626', '#ea580c', '#16a34a', '#9333ea', '#0891b2', '#ca8a04'];

export default function Analytics() {
  const [range, setRange] = useState<AnalyticsDateRange>(defaultDateRange());
  const { organization } = useUserContext();

  const { data: kpis, loading: kpisLoading } = useAnalyticsKpis(range);
  const { data: compliance } = useComplianceBreakdown(range);
  const { data: trend } = useComplianceTrend(8);
  const { data: wasteTrend } = useWasteTrend(14);
  const { data: waste, totalCost: wasteTotal } = useRecentWaste(range, 20);
  const { data: areas } = useAreaSummary(range);
  const { data: discardReasons } = useDiscardReasons(range);

  const ready = kpis !== null;

  const handleExport = (fmt: 'xlsx' | 'pdf') => {
    if (!kpis) return;
    const payload = {
      organizationName: organization?.name || 'Tampa',
      dateRange: range,
      kpis,
      compliance,
      waste,
      wasteTotal,
      areas,
      discardReasons,
    };
    if (fmt === 'xlsx') exportAnalyticsXlsx(payload);
    else exportAnalyticsPdf(payload);
  };

  const totalChecks = useMemo(
    () => compliance.reduce((s, c) => s + (c.current > 0 ? 1 : 0), 0),
    [compliance],
  );

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics &amp; Reports</h1>
          <p className="text-muted-foreground mt-2">
            Compliance tracking, operational insights, and performance metrics
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <DateRangePicker value={range} onChange={setRange} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={!ready} className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('xlsx')} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Export as XLSX
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2">
                <FileText className="h-4 w-4" /> Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpisLoading || !kpis ? (
          <>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-lg border shadow-card p-6 animate-pulse">
                <div className="h-4 w-24 bg-muted rounded mb-4" />
                <div className="h-8 w-20 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted rounded mt-3" />
              </div>
            ))}
          </>
        ) : (
          <>
            <StatsCard
              title="Overall Compliance"
              value={`${kpis.overallCompliance.value.toFixed(1)}%`}
              change={kpis.overallCompliance.changeLabel}
              changeType={kpis.overallCompliance.changeType}
              icon={CheckCircle}
            />
            <StatsCard
              title="Failed Checks"
              value={kpis.failedChecks.value}
              change={kpis.failedChecks.changeLabel}
              changeType={kpis.failedChecks.changeType}
              icon={AlertTriangle}
            />
            <StatsCard
              title="Cost Savings"
              value={`$${kpis.costSavings.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              change={kpis.costSavings.changeLabel}
              changeType={kpis.costSavings.changeType}
              icon={TrendingUp}
            />
            <StatsCard
              title="Efficiency Score"
              value={`${kpis.efficiencyScore.value.toFixed(1)}%`}
              change={kpis.efficiencyScore.changeLabel}
              changeType={kpis.efficiencyScore.changeType}
              icon={BarChart3}
            />
          </>
        )}
      </div>

      {/* Compliance breakdown */}
      <div className="bg-card rounded-lg border shadow-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h3 className="font-semibold text-lg">Compliance Overview</h3>
            <p className="text-muted-foreground text-sm">
              Performance vs targets for the selected period
            </p>
          </div>
          {totalChecks === 0 && (
            <p className="text-sm text-muted-foreground">No compliance data yet</p>
          )}
        </div>

        {compliance.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="No compliance checks recorded"
            hint="Compliance categories will appear here once checks are logged."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {compliance.map(metric => (
              <div key={metric.category} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">{metric.category}</h4>
                  <span
                    className={`text-xs font-medium ${
                      metric.trendPositive ? 'text-success' : 'text-warning'
                    }`}
                  >
                    {metric.trend}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-bold">{metric.current}%</span>
                    <span className="text-xs text-muted-foreground">Target: {metric.target}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        metric.current >= metric.target ? 'bg-success' : 'bg-warning'
                      }`}
                      style={{ width: `${Math.min(metric.current, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: trends */}
        <div className="space-y-6">
          <h3 className="font-semibold text-lg">Performance Trends</h3>

          <div className="bg-card rounded-lg border shadow-card p-6">
            <h4 className="font-medium mb-4">Weekly Compliance Pass Rate</h4>
            <div className="h-56">
              {trend.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="No checks yet"
                  hint="Log compliance checks to see the weekly trend."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="weekLabel" fontSize={12} />
                    <YAxis fontSize={12} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Line
                      type="monotone"
                      dataKey="passRate"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Pass rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-card rounded-lg border shadow-card p-6">
            <h4 className="font-medium mb-4">Daily Waste Cost (last 14 days)</h4>
            <div className="h-56">
              {wasteTrend.every(p => p.cost === 0 && p.count === 0) ? (
                <EmptyState
                  icon={TrendingUp}
                  title="No waste logged in this window"
                  hint="Discarded items and waste log entries will appear here."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wasteTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={v => `$${v}`} />
                    <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                    <Bar dataKey="cost" fill="#dc2626" name="Cost ($)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Right column: waste + discard reasons + areas */}
        <div className="space-y-6">
          <h3 className="font-semibold text-lg">Waste Analysis</h3>

          <div className="bg-card rounded-lg border shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Recent Waste Entries</h4>
              {wasteTotal > 0 && (
                <span className="text-sm text-destructive font-semibold">
                  Total ${wasteTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              )}
            </div>

            {waste.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="No waste recorded"
                hint="Discarded labels and waste log entries will appear here."
              />
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {waste.map((w, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{w.item}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {w.reason.replace(/_/g, ' ')}
                        {w.category ? ` · ${w.category}` : ''}
                      </p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="font-medium">
                        {w.quantity} {w.unit}
                      </p>
                      {w.estimatedCost > 0 && (
                        <p className="text-sm text-destructive">${w.estimatedCost.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg border shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieIcon className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">Discard Reasons</h4>
            </div>
            <div className="h-64">
              {discardReasons.length === 0 ? (
                <EmptyState
                  icon={PieIcon}
                  title="No discard data"
                  hint="Reasons recorded on the Expiring Soon → Discard flow appear here."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={discardReasons}
                      dataKey="count"
                      nameKey="reason"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(d: { reason: string; count: number }) => `${d.reason}: ${d.count}`}
                    >
                      {discardReasons.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-card rounded-lg border shadow-card p-6">
            <h4 className="font-medium mb-4">Area Summary</h4>
            {areas.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="No area data yet"
                hint="Compliance checks tagged with an area (kitchen, storage, prep, service) will be grouped here."
              />
            ) : (
              <div className="space-y-3">
                {areas.map(a => (
                  <div key={a.area} className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-medium">{a.area}</span>
                      <span className="text-xs text-muted-foreground">{a.totalChecks} checks</span>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        a.passRate >= 95
                          ? 'bg-success/10 text-success'
                          : a.passRate >= 85
                          ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {a.passRate}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-6">
      <Icon className="w-10 h-10 mb-2 opacity-50" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs mt-1 max-w-xs">{hint}</p>
    </div>
  );
}

