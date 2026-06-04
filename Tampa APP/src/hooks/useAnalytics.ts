// Analytics data hooks — every metric in src/pages/Analytics.tsx flows
// through one of these. Each hook is org-scoped, date-range-aware, and
// returns the same shape for both the current period and the equivalent
// previous period so we can compute "+1.2% vs last month" deltas without
// extra round-trips from the page.
//
// Formula reference (see docs / commit notes):
//   Overall Compliance = weighted blend of compliance pass rate,
//     temperature-log completion, routine-task completion, label compliance.
//   Failed Checks      = SUM(failed + needs_attention) from compliance_summary.
//   Cost Savings       = baseline avg waste cost - current period waste cost.
//   Efficiency Score   = blended production-time + quality + task on-time.

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from './useUserContext';
import {
  differenceInCalendarDays,
  endOfMonth,
  startOfMonth,
  subDays,
  format,
} from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────
export interface DateRange {
  from: Date;
  to: Date;
}

export function defaultDateRange(): DateRange {
  const now = new Date();
  return { from: startOfMonth(now), to: endOfMonth(now) };
}

/** Equivalent previous period (same number of days, ending the day before `from`). */
function previousPeriod(range: DateRange): DateRange {
  const days = Math.max(1, differenceInCalendarDays(range.to, range.from));
  const prevTo = subDays(range.from, 1);
  const prevFrom = subDays(prevTo, days);
  return { from: prevFrom, to: prevTo };
}

export interface KpiValue {
  /** Numeric value (percent for 0-100 metrics, dollar amount, count). */
  value: number;
  /** "+1.2%" / "-3" / "$120" — human-readable change vs previous period. */
  changeLabel: string;
  /** 'positive' | 'negative' | 'neutral' — drives the colour of the card. */
  changeType: 'positive' | 'negative' | 'neutral';
}

export interface AnalyticsKpis {
  overallCompliance: KpiValue;
  failedChecks: KpiValue;
  costSavings: KpiValue;
  efficiencyScore: KpiValue;
}

export interface ComplianceCategory {
  category: string;
  current: number;       // pass rate %, 0–100
  target: number;        // target %
  trend: string;         // e.g. "+0.3%"
  trendPositive: boolean;
}

export interface WasteRow {
  item: string;
  category: string | null;
  quantity: number;
  unit: string;
  reason: string;
  estimatedCost: number;
  loggedAt: string;
}

export interface AreaSummaryRow {
  area: string;
  passRate: number; // 0–100
  totalChecks: number;
}

// Each KPI metric pillar's target. Tweak in product config later if needed.
const TARGETS = {
  labelCompliance: 95,
  temperatureLogs: 100,
  haccp: 95,
  cleaning: 90,
  overall: 95,
};

// ── Helpers ────────────────────────────────────────────────────────────────
function pctDelta(curr: number, prev: number): { label: string; positive: boolean } {
  if (prev === 0) {
    if (curr === 0) return { label: '0%', positive: false };
    return { label: 'new', positive: true };
  }
  const d = ((curr - prev) / prev) * 100;
  const rounded = Math.round(d * 10) / 10;
  return {
    label: `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}%`,
    positive: rounded >= 0,
  };
}

function absDelta(curr: number, prev: number, formatter: (n: number) => string) {
  const d = curr - prev;
  return {
    label: `${d > 0 ? '+' : ''}${formatter(d)}`,
    positive: d <= 0, // for "failed checks", fewer is better
  };
}

function moneyDelta(curr: number, prev: number) {
  const d = curr - prev;
  return {
    label: `${d > 0 ? '+' : ''}$${Math.abs(d).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
    positive: d >= 0, // savings up = good
  };
}

interface PeriodStats {
  passedChecks: number;
  failedChecks: number;
  totalChecks: number;
  wasteCost: number;
  efficiencyAvg: number; // 0–100
  labelsPrinted: number;
  labelsWasted: number;
  qualityAvg: number; // 0–5
  tasksOnTime: number;
  tasksTotal: number;
}

const emptyPeriod = (): PeriodStats => ({
  passedChecks: 0,
  failedChecks: 0,
  totalChecks: 0,
  wasteCost: 0,
  efficiencyAvg: 0,
  labelsPrinted: 0,
  labelsWasted: 0,
  qualityAvg: 0,
  tasksOnTime: 0,
  tasksTotal: 0,
});

async function fetchPeriodStats(
  organizationId: string,
  range: DateRange,
): Promise<PeriodStats> {
  const fromISO = range.from.toISOString();
  const toISO = range.to.toISOString();
  const stats = emptyPeriod();

  // 1. Compliance checks — pass/fail/needs_attention counts.
  const { data: checks } = await supabase
    .from('compliance_checks')
    .select('status')
    .eq('organization_id', organizationId)
    .gte('checked_at', fromISO)
    .lte('checked_at', toISO);
  if (checks) {
    for (const row of checks as Array<{ status: string }>) {
      stats.totalChecks++;
      if (row.status === 'passed') stats.passedChecks++;
      else if (row.status === 'failed' || row.status === 'needs_attention') stats.failedChecks++;
    }
  }

  // 2. Waste cost.
  const { data: waste } = await supabase
    .from('waste_logs')
    .select('estimated_cost')
    .eq('organization_id', organizationId)
    .gte('logged_at', fromISO)
    .lte('logged_at', toISO);
  if (waste) {
    stats.wasteCost = (waste as Array<{ estimated_cost: number | null }>).reduce(
      (s, w) => s + (Number(w.estimated_cost) || 0),
      0,
    );
  }

  // 3. Production metrics for efficiency + quality.
  const { data: prod } = await supabase
    .from('production_metrics')
    .select('actual_time_minutes, planned_time_minutes, quality_rating')
    .eq('organization_id', organizationId)
    .gte('recorded_at', fromISO)
    .lte('recorded_at', toISO);
  if (prod && prod.length > 0) {
    let timeSum = 0;
    let timeCount = 0;
    let qualitySum = 0;
    let qualityCount = 0;
    for (const row of prod as Array<{
      actual_time_minutes: number | null;
      planned_time_minutes: number | null;
      quality_rating: number | null;
    }>) {
      if (row.planned_time_minutes && row.actual_time_minutes) {
        const ratio = Math.min(row.planned_time_minutes / row.actual_time_minutes, 1);
        timeSum += ratio * 100;
        timeCount++;
      }
      if (row.quality_rating != null) {
        qualitySum += row.quality_rating;
        qualityCount++;
      }
    }
    const timeAvg = timeCount > 0 ? timeSum / timeCount : 0;
    stats.qualityAvg = qualityCount > 0 ? qualitySum / qualityCount : 0;
    stats.efficiencyAvg = timeAvg;
  }

  // 4. Labels printed + wasted (label compliance + waste rate).
  const { count: labelsCount } = await supabase
    .from('printed_labels')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', fromISO)
    .lte('created_at', toISO);
  stats.labelsPrinted = labelsCount || 0;

  const { count: wastedCount } = await supabase
    .from('printed_labels')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'wasted')
    .gte('updated_at', fromISO)
    .lte('updated_at', toISO);
  stats.labelsWasted = wastedCount || 0;

  // 5. Routine task completion (on time vs total scheduled).
  const { data: tasks } = await supabase
    .from('routine_tasks')
    .select('status, scheduled_date, completed_at')
    .eq('organization_id', organizationId)
    .gte('scheduled_date', range.from.toISOString().slice(0, 10))
    .lte('scheduled_date', range.to.toISOString().slice(0, 10));
  if (tasks) {
    for (const row of tasks as Array<{
      status: string | null; scheduled_date: string; completed_at: string | null;
    }>) {
      stats.tasksTotal++;
      if (row.status === 'completed' && row.completed_at) {
        // On time = completed on or before end-of-scheduled-day.
        const eod = new Date(row.scheduled_date + 'T23:59:59');
        if (new Date(row.completed_at) <= eod) stats.tasksOnTime++;
      }
    }
  }

  return stats;
}

function computeOverallCompliance(s: PeriodStats): number {
  // Weighted average of four pillars; each pillar is 0–100.
  const checkPass = s.totalChecks > 0 ? (s.passedChecks / s.totalChecks) * 100 : 0;
  const taskOnTime = s.tasksTotal > 0 ? (s.tasksOnTime / s.tasksTotal) * 100 : 0;
  const labelRate = s.labelsPrinted > 0
    ? Math.max(0, 100 - (s.labelsWasted / s.labelsPrinted) * 100)
    : 0;
  // Temp logs are part of compliance_checks for now (check_type='temperature'),
  // so we substitute the overall check rate as a proxy until temperature logs
  // become their own first-class table.
  const tempLogs = checkPass;

  const pillars = [
    { v: checkPass, w: 0.30 },
    { v: tempLogs, w: 0.25 },
    { v: taskOnTime, w: 0.25 },
    { v: labelRate, w: 0.20 },
  ].filter(p => p.v > 0);
  if (pillars.length === 0) return 0;
  const weight = pillars.reduce((s, p) => s + p.w, 0);
  return pillars.reduce((s, p) => s + (p.v * p.w / weight), 0);
}

function computeEfficiencyScore(s: PeriodStats): number {
  const time = s.efficiencyAvg;             // 0–100
  const quality = (s.qualityAvg / 5) * 100; // 0–100
  const taskOnTime = s.tasksTotal > 0 ? (s.tasksOnTime / s.tasksTotal) * 100 : 0;

  const pillars = [
    { v: time, w: 0.4 },
    { v: quality, w: 0.3 },
    { v: taskOnTime, w: 0.3 },
  ].filter(p => p.v > 0);
  if (pillars.length === 0) return 0;
  const weight = pillars.reduce((s, p) => s + p.w, 0);
  return pillars.reduce((s, p) => s + (p.v * p.w / weight), 0);
}

// ── Hook: full KPI bundle ──────────────────────────────────────────────────
export function useAnalyticsKpis(range: DateRange): {
  data: AnalyticsKpis | null;
  loading: boolean;
} {
  const { organizationId } = useOrganizationId();
  const [data, setData] = useState<AnalyticsKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [curr, prev] = await Promise.all([
        fetchPeriodStats(organizationId, range),
        fetchPeriodStats(organizationId, previousPeriod(range)),
      ]);
      if (cancelled) return;

      const currOverall = computeOverallCompliance(curr);
      const prevOverall = computeOverallCompliance(prev);
      const currEff = computeEfficiencyScore(curr);
      const prevEff = computeEfficiencyScore(prev);

      const overallDelta = pctDelta(currOverall, prevOverall);
      const effDelta = pctDelta(currEff, prevEff);
      const failedDelta = absDelta(curr.failedChecks, prev.failedChecks, n => `${Math.abs(n)}`);
      const savings = prev.wasteCost - curr.wasteCost; // positive = saved money
      const savingsDelta = moneyDelta(curr.wasteCost, prev.wasteCost);

      setData({
        overallCompliance: {
          value: currOverall,
          changeLabel: `${overallDelta.label} from last period`,
          changeType: overallDelta.positive ? 'positive' : 'negative',
        },
        failedChecks: {
          value: curr.failedChecks,
          changeLabel: `${failedDelta.label} vs last period`,
          changeType: failedDelta.positive ? 'positive' : 'negative',
        },
        costSavings: {
          value: Math.max(0, savings),
          changeLabel: savings >= 0
            ? `Saved $${savings.toLocaleString('en-US', { maximumFractionDigits: 0 })} vs last period`
            : `Spent $${Math.abs(savings).toLocaleString('en-US', { maximumFractionDigits: 0 })} more`,
          changeType: savings >= 0 ? 'positive' : 'negative',
        },
        efficiencyScore: {
          value: currEff,
          changeLabel: `${effDelta.label} improvement`,
          changeType: effDelta.positive ? 'positive' : 'negative',
        },
      });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId, range.from.getTime(), range.to.getTime()]);

  return { data, loading };
}

// ── Hook: compliance breakdown by category ─────────────────────────────────
export function useComplianceBreakdown(range: DateRange): {
  data: ComplianceCategory[];
  loading: boolean;
} {
  const { organizationId } = useOrganizationId();
  const [data, setData] = useState<ComplianceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);

      // Pull checks for the current + previous periods so we can compute trend.
      const prev = previousPeriod(range);
      const [{ data: curr }, { data: pre }] = await Promise.all([
        supabase
          .from('compliance_checks')
          .select('check_type, status')
          .eq('organization_id', organizationId)
          .gte('checked_at', range.from.toISOString())
          .lte('checked_at', range.to.toISOString()),
        supabase
          .from('compliance_checks')
          .select('check_type, status')
          .eq('organization_id', organizationId)
          .gte('checked_at', prev.from.toISOString())
          .lte('checked_at', prev.to.toISOString()),
      ]);

      if (cancelled) return;

      const aggregate = (rows: Array<{ check_type: string; status: string }>) => {
        const m = new Map<string, { passed: number; total: number }>();
        for (const r of rows || []) {
          const key = r.check_type || 'other';
          const cur = m.get(key) || { passed: 0, total: 0 };
          cur.total++;
          if (r.status === 'passed') cur.passed++;
          m.set(key, cur);
        }
        return m;
      };
      const currMap = aggregate(curr as Array<{ check_type: string; status: string }> || []);
      const prevMap = aggregate(pre as Array<{ check_type: string; status: string }> || []);

      // Also incorporate label compliance as a row (computed off printed_labels).
      const [{ count: currLabels }, { count: currWasted }, { count: prevLabels }, { count: prevWasted }] =
        await Promise.all([
          supabase.from('printed_labels').select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .gte('created_at', range.from.toISOString())
            .lte('created_at', range.to.toISOString()),
          supabase.from('printed_labels').select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId).eq('status', 'wasted')
            .gte('updated_at', range.from.toISOString())
            .lte('updated_at', range.to.toISOString()),
          supabase.from('printed_labels').select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .gte('created_at', prev.from.toISOString())
            .lte('created_at', prev.to.toISOString()),
          supabase.from('printed_labels').select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId).eq('status', 'wasted')
            .gte('updated_at', prev.from.toISOString())
            .lte('updated_at', prev.to.toISOString()),
        ]);

      const labelCurr = (currLabels || 0) > 0
        ? 100 - ((currWasted || 0) / (currLabels || 1)) * 100 : 0;
      const labelPrev = (prevLabels || 0) > 0
        ? 100 - ((prevWasted || 0) / (prevLabels || 1)) * 100 : 0;

      const friendly: Record<string, { label: string; target: number }> = {
        temperature: { label: 'Temperature Logs', target: TARGETS.temperatureLogs },
        sanitation:  { label: 'Sanitation Checks', target: TARGETS.cleaning },
        equipment:   { label: 'Equipment Checks',  target: TARGETS.haccp },
        documentation: { label: 'Documentation',  target: TARGETS.haccp },
        other:       { label: 'Other Checks',      target: TARGETS.overall },
      };

      const rows: ComplianceCategory[] = [];
      for (const [key, agg] of currMap) {
        const meta = friendly[key] || { label: key, target: TARGETS.overall };
        const curr = agg.total > 0 ? (agg.passed / agg.total) * 100 : 0;
        const prevAgg = prevMap.get(key);
        const prevVal = prevAgg && prevAgg.total > 0
          ? (prevAgg.passed / prevAgg.total) * 100 : 0;
        const d = pctDelta(curr, prevVal);
        rows.push({
          category: meta.label,
          current: Math.round(curr * 10) / 10,
          target: meta.target,
          trend: d.label,
          trendPositive: d.positive,
        });
      }

      // Always include label compliance as a pillar if we have any labels.
      if ((currLabels || 0) > 0) {
        const d = pctDelta(labelCurr, labelPrev);
        rows.push({
          category: 'Label Compliance',
          current: Math.round(labelCurr * 10) / 10,
          target: TARGETS.labelCompliance,
          trend: d.label,
          trendPositive: d.positive,
        });
      }

      setData(rows);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [organizationId, range.from.getTime(), range.to.getTime()]);

  return { data, loading };
}

// ── Hook: weekly compliance trend (line chart) ─────────────────────────────
export interface ComplianceTrendPoint {
  weekLabel: string;
  passRate: number;
}
export function useComplianceTrend(weeks = 8): {
  data: ComplianceTrendPoint[];
  loading: boolean;
} {
  const { organizationId } = useOrganizationId();
  const [data, setData] = useState<ComplianceTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const from = subDays(new Date(), weeks * 7);
      const { data: rows } = await supabase
        .from('compliance_checks')
        .select('checked_at, status')
        .eq('organization_id', organizationId)
        .gte('checked_at', from.toISOString())
        .order('checked_at', { ascending: true });
      if (cancelled) return;

      const buckets = new Map<string, { passed: number; total: number }>();
      for (let i = weeks - 1; i >= 0; i--) {
        const d = subDays(new Date(), i * 7);
        buckets.set(format(d, 'MMM dd'), { passed: 0, total: 0 });
      }

      for (const r of (rows || []) as Array<{ checked_at: string; status: string }>) {
        const d = new Date(r.checked_at);
        const weeksAgo = Math.floor(
          differenceInCalendarDays(new Date(), d) / 7,
        );
        if (weeksAgo < 0 || weeksAgo >= weeks) continue;
        const label = format(subDays(new Date(), weeksAgo * 7), 'MMM dd');
        const cur = buckets.get(label) || { passed: 0, total: 0 };
        cur.total++;
        if (r.status === 'passed') cur.passed++;
        buckets.set(label, cur);
      }

      const out: ComplianceTrendPoint[] = [];
      for (const [label, agg] of buckets) {
        out.push({
          weekLabel: label,
          passRate: agg.total > 0 ? Math.round((agg.passed / agg.total) * 1000) / 10 : 0,
        });
      }
      setData(out);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [organizationId, weeks]);

  return { data, loading };
}

// ── Hook: daily waste cost trend (bar chart) ───────────────────────────────
export interface WasteTrendPoint {
  date: string;
  cost: number;
  count: number;
}
export function useWasteTrend(days = 14): {
  data: WasteTrendPoint[];
  loading: boolean;
} {
  const { organizationId } = useOrganizationId();
  const [data, setData] = useState<WasteTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const from = subDays(new Date(), days - 1);
      const { data: rows } = await supabase
        .from('waste_logs')
        .select('logged_at, estimated_cost')
        .eq('organization_id', organizationId)
        .gte('logged_at', from.toISOString())
        .order('logged_at', { ascending: true });
      if (cancelled) return;

      const buckets = new Map<string, { cost: number; count: number }>();
      for (let i = days - 1; i >= 0; i--) {
        buckets.set(format(subDays(new Date(), i), 'MMM dd'), { cost: 0, count: 0 });
      }
      for (const r of (rows || []) as Array<{ logged_at: string; estimated_cost: number | null }>) {
        const key = format(new Date(r.logged_at), 'MMM dd');
        const cur = buckets.get(key);
        if (!cur) continue;
        cur.cost += Number(r.estimated_cost) || 0;
        cur.count += 1;
        buckets.set(key, cur);
      }
      const out: WasteTrendPoint[] = [];
      for (const [date, agg] of buckets) out.push({ date, cost: agg.cost, count: agg.count });
      setData(out);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [organizationId, days]);

  return { data, loading };
}

// ── Hook: recent waste log entries (for the "This Period's Waste" list) ────
export function useRecentWaste(range: DateRange, limit = 20): {
  data: WasteRow[];
  loading: boolean;
  totalCost: number;
} {
  const { organizationId } = useOrganizationId();
  const [data, setData] = useState<WasteRow[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data: rows } = await supabase
        .from('waste_logs')
        .select('item_name, category, quantity, unit, reason, estimated_cost, logged_at')
        .eq('organization_id', organizationId)
        .gte('logged_at', range.from.toISOString())
        .lte('logged_at', range.to.toISOString())
        .order('logged_at', { ascending: false })
        .limit(limit);
      if (cancelled) return;

      const list: WasteRow[] = ((rows || []) as Array<{
        item_name: string; category: string | null; quantity: number; unit: string;
        reason: string; estimated_cost: number | null; logged_at: string;
      }>).map(r => ({
        item: r.item_name,
        category: r.category,
        quantity: Number(r.quantity),
        unit: r.unit,
        reason: r.reason,
        estimatedCost: Number(r.estimated_cost) || 0,
        loggedAt: r.logged_at,
      }));

      // Total cost for the whole period (not just the limited list).
      const { data: totals } = await supabase
        .from('waste_logs')
        .select('estimated_cost')
        .eq('organization_id', organizationId)
        .gte('logged_at', range.from.toISOString())
        .lte('logged_at', range.to.toISOString());
      const total = ((totals || []) as Array<{ estimated_cost: number | null }>).reduce(
        (s, r) => s + (Number(r.estimated_cost) || 0), 0,
      );

      setData(list);
      setTotalCost(total);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [organizationId, range.from.getTime(), range.to.getTime(), limit]);

  return { data, loading, totalCost };
}

// ── Hook: area / location summary (groups compliance_checks.area) ─────────
export function useAreaSummary(range: DateRange): {
  data: AreaSummaryRow[];
  loading: boolean;
} {
  const { organizationId } = useOrganizationId();
  const [data, setData] = useState<AreaSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data: rows } = await supabase
        .from('compliance_checks')
        .select('area, status')
        .eq('organization_id', organizationId)
        .gte('checked_at', range.from.toISOString())
        .lte('checked_at', range.to.toISOString());
      if (cancelled) return;

      const m = new Map<string, { passed: number; total: number }>();
      for (const r of (rows || []) as Array<{ area: string; status: string }>) {
        const key = r.area || 'other';
        const cur = m.get(key) || { passed: 0, total: 0 };
        cur.total++;
        if (r.status === 'passed') cur.passed++;
        m.set(key, cur);
      }
      const out: AreaSummaryRow[] = [];
      for (const [area, agg] of m) {
        out.push({
          area: area.charAt(0).toUpperCase() + area.slice(1),
          passRate: agg.total > 0 ? Math.round((agg.passed / agg.total) * 1000) / 10 : 0,
          totalChecks: agg.total,
        });
      }
      out.sort((a, b) => b.passRate - a.passRate);
      setData(out);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [organizationId, range.from.getTime(), range.to.getTime()]);

  return { data, loading };
}

// ── Hook: discard reason breakdown (pie chart) ─────────────────────────────
export interface DiscardReasonSlice {
  reason: string;
  count: number;
  cost: number;
}
export function useDiscardReasons(range: DateRange): {
  data: DiscardReasonSlice[];
  loading: boolean;
} {
  const { organizationId } = useOrganizationId();
  const [data, setData] = useState<DiscardReasonSlice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data: rows } = await supabase
        .from('waste_logs')
        .select('reason, estimated_cost')
        .eq('organization_id', organizationId)
        .gte('logged_at', range.from.toISOString())
        .lte('logged_at', range.to.toISOString());
      if (cancelled) return;

      const m = new Map<string, { count: number; cost: number }>();
      for (const r of (rows || []) as Array<{ reason: string; estimated_cost: number | null }>) {
        const key = r.reason || 'other';
        const cur = m.get(key) || { count: 0, cost: 0 };
        cur.count++;
        cur.cost += Number(r.estimated_cost) || 0;
        m.set(key, cur);
      }
      const out: DiscardReasonSlice[] = [];
      for (const [reason, agg] of m) {
        out.push({
          reason: reason.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
          count: agg.count,
          cost: agg.cost,
        });
      }
      out.sort((a, b) => b.count - a.count);
      setData(out);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [organizationId, range.from.getTime(), range.to.getTime()]);

  return { data, loading };
}
