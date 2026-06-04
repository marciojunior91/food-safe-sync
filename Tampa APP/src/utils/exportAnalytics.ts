// Analytics report exporters. Produces an XLSX workbook or a PDF document
// from the same input payload so the two outputs stay structurally aligned
// (same sections, same column order). The page collects whatever data is
// already on screen and hands it in — no extra queries.

import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  AnalyticsKpis,
  ComplianceCategory,
  WasteRow,
  AreaSummaryRow,
  DiscardReasonSlice,
} from '@/hooks/useAnalytics';

export interface AnalyticsExportPayload {
  organizationName: string;
  dateRange: { from: Date; to: Date };
  kpis: AnalyticsKpis;
  compliance: ComplianceCategory[];
  waste: WasteRow[];
  wasteTotal: number;
  areas: AreaSummaryRow[];
  discardReasons: DiscardReasonSlice[];
}

function rangeLabel(r: { from: Date; to: Date }): string {
  return `${format(r.from, 'MMM d, yyyy')} – ${format(r.to, 'MMM d, yyyy')}`;
}

function buildFileBase(p: AnalyticsExportPayload): string {
  const safeOrg = p.organizationName.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'tampa';
  return `${safeOrg}-analytics-${format(p.dateRange.from, 'yyyyMMdd')}-${format(p.dateRange.to, 'yyyyMMdd')}`;
}

// ── XLSX ───────────────────────────────────────────────────────────────────
export function exportAnalyticsXlsx(p: AnalyticsExportPayload): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Overview / KPIs
  const overviewRows: Array<Array<string | number>> = [
    ['Tampa Analytics Report'],
    ['Organization', p.organizationName],
    ['Period', rangeLabel(p.dateRange)],
    ['Generated', format(new Date(), 'PPpp')],
    [],
    ['KPI', 'Value', 'Change'],
    ['Overall Compliance', `${p.kpis.overallCompliance.value.toFixed(1)}%`, p.kpis.overallCompliance.changeLabel],
    ['Failed Checks', p.kpis.failedChecks.value, p.kpis.failedChecks.changeLabel],
    ['Cost Savings', `$${p.kpis.costSavings.value.toLocaleString()}`, p.kpis.costSavings.changeLabel],
    ['Efficiency Score', `${p.kpis.efficiencyScore.value.toFixed(1)}%`, p.kpis.efficiencyScore.changeLabel],
  ];
  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewRows);
  overviewSheet['!cols'] = [{ wch: 24 }, { wch: 22 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, overviewSheet, 'Overview');

  // Sheet 2: Compliance by category
  const compRows: Array<Array<string | number>> = [
    ['Category', 'Current %', 'Target %', 'Trend'],
    ...p.compliance.map(c => [c.category, c.current, c.target, c.trend]),
  ];
  const compSheet = XLSX.utils.aoa_to_sheet(compRows);
  compSheet['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, compSheet, 'Compliance');

  // Sheet 3: Waste log entries
  const wasteRows: Array<Array<string | number>> = [
    ['Item', 'Category', 'Quantity', 'Unit', 'Reason', 'Cost ($)', 'Logged At'],
    ...p.waste.map(w => [
      w.item,
      w.category ?? '',
      w.quantity,
      w.unit,
      w.reason,
      w.estimatedCost,
      format(new Date(w.loggedAt), 'yyyy-MM-dd HH:mm'),
    ]),
    [],
    ['Total cost', '', '', '', '', p.wasteTotal, ''],
  ];
  const wasteSheet = XLSX.utils.aoa_to_sheet(wasteRows);
  wasteSheet['!cols'] = [
    { wch: 24 }, { wch: 16 }, { wch: 10 }, { wch: 8 },
    { wch: 18 }, { wch: 10 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wasteSheet, 'Waste');

  // Sheet 4: Discard reasons breakdown
  if (p.discardReasons.length > 0) {
    const drRows: Array<Array<string | number>> = [
      ['Reason', 'Count', 'Cost ($)'],
      ...p.discardReasons.map(d => [d.reason, d.count, d.cost]),
    ];
    const drSheet = XLSX.utils.aoa_to_sheet(drRows);
    drSheet['!cols'] = [{ wch: 24 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, drSheet, 'Discard Reasons');
  }

  // Sheet 5: Area summary
  if (p.areas.length > 0) {
    const areaRows: Array<Array<string | number>> = [
      ['Area', 'Pass Rate %', 'Total Checks'],
      ...p.areas.map(a => [a.area, a.passRate, a.totalChecks]),
    ];
    const areaSheet = XLSX.utils.aoa_to_sheet(areaRows);
    areaSheet['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, areaSheet, 'Areas');
  }

  XLSX.writeFile(wb, `${buildFileBase(p)}.xlsx`);
}

// ── PDF ────────────────────────────────────────────────────────────────────
export function exportAnalyticsPdf(p: AnalyticsExportPayload): void {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Tampa Analytics Report', margin, y);
  y += 24;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(p.organizationName, margin, y);
  y += 14;
  doc.text(rangeLabel(p.dateRange), margin, y);
  y += 14;
  doc.setTextColor(120);
  doc.text(`Generated ${format(new Date(), 'PPpp')}`, margin, y);
  doc.setTextColor(0);
  y += 24;

  // KPIs as a single highlighted table
  autoTable(doc, {
    startY: y,
    head: [['KPI', 'Value', 'Change']],
    body: [
      ['Overall Compliance', `${p.kpis.overallCompliance.value.toFixed(1)}%`, p.kpis.overallCompliance.changeLabel],
      ['Failed Checks', String(p.kpis.failedChecks.value), p.kpis.failedChecks.changeLabel],
      ['Cost Savings', `$${p.kpis.costSavings.value.toLocaleString()}`, p.kpis.costSavings.changeLabel],
      ['Efficiency Score', `${p.kpis.efficiencyScore.value.toFixed(1)}%`, p.kpis.efficiencyScore.changeLabel],
    ],
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: margin, right: margin },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 24;

  if (p.compliance.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Compliance by Category', margin, y);
    y += 8;
    autoTable(doc, {
      startY: y + 6,
      head: [['Category', 'Current %', 'Target %', 'Trend']],
      body: p.compliance.map(c => [c.category, `${c.current}%`, `${c.target}%`, c.trend]),
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: margin, right: margin },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 24;
  }

  if (p.waste.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`Waste (Total $${p.wasteTotal.toLocaleString()})`, margin, y);
    y += 8;
    autoTable(doc, {
      startY: y + 6,
      head: [['Item', 'Reason', 'Qty', 'Cost']],
      body: p.waste.map(w => [
        w.item,
        w.reason,
        `${w.quantity} ${w.unit}`,
        w.estimatedCost > 0 ? `$${w.estimatedCost.toFixed(2)}` : '—',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38] },
      margin: { left: margin, right: margin },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 24;
  }

  if (p.discardReasons.length > 0) {
    if (y > pageWidth) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Discard Reason Breakdown', margin, y);
    autoTable(doc, {
      startY: y + 14,
      head: [['Reason', 'Count', 'Cost']],
      body: p.discardReasons.map(d => [d.reason, String(d.count), d.cost > 0 ? `$${d.cost.toFixed(2)}` : '—']),
      theme: 'striped',
      headStyles: { fillColor: [234, 88, 12] },
      margin: { left: margin, right: margin },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 24;
  }

  if (p.areas.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Area Summary', margin, y);
    autoTable(doc, {
      startY: y + 14,
      head: [['Area', 'Pass Rate', 'Checks']],
      body: p.areas.map(a => [a.area, `${a.passRate}%`, String(a.totalChecks)]),
      theme: 'striped',
      headStyles: { fillColor: [22, 163, 74] },
      margin: { left: margin, right: margin },
    });
  }

  doc.save(`${buildFileBase(p)}.pdf`);
}
