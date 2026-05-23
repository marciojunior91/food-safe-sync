// Shared ZPL generator — used by both Bluetooth and TCP/IP print paths so the
// printed label looks identical regardless of how it reaches the printer.
//
// Tuned for 50mm × 50mm thermal labels. Scales fonts up for larger media.
//
// Layout (no QR code):
//   PRODUCT NAME (large, simulated bold)
//   CATEGORY - SUBCATEGORY
//   ──────────────────────
//   PREPARED DATE: DD/MM/YYYY   (BOLD)
//   EXPIRE DATE:   DD/MM/YYYY   (BOLD)
//   ──────────────────────
//   PRINTED BY:    Name
//   QUANTITY:      1 UNIT
//   CONDITION:     REFRIGERATED
//   ──────────────────────
//   ALLERGENS
//   MILK, SHELLFISH

import type { LabelPrintData } from './zebraPrinter';

export interface LabelZplOptions {
  /** Label width in millimetres (default: 50). */
  widthMm?: number;
  /** Label height in millimetres (default: 50). */
  heightMm?: number;
  /** Printer DPI (default: 203 — most Zebra desktop models). */
  dpi?: number;
}

/**
 * Format date as DD/MM/YYYY (input may be YYYY-MM-DD or any ISO string).
 */
export function formatDateDMY(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }
  return dateStr;
}

/**
 * Generate ZPL for a food-safety label using the standard Tampa APP layout.
 * Identical output regardless of whether the printer is connected via
 * Bluetooth or TCP/IP.
 */
export function generateLabelZPL(data: LabelPrintData, opts: LabelZplOptions = {}): string {
  const {
    productName,
    categoryName,
    subcategoryName,
    condition,
    prepDate,
    expiryDate,
    preparedByName,
    quantity,
    unit,
    allergens,
  } = data;

  const widthMm = opts.widthMm ?? 50;
  const heightMm = opts.heightMm ?? 50;
  const dpi = opts.dpi ?? 203;

  const MM_TO_DOT = dpi / 25.4;
  const PW = Math.round(widthMm * MM_TO_DOT);
  const LL = Math.round(heightMm * MM_TO_DOT);

  const isSmall = widthMm <= 60;
  const ML = isSmall ? 12 : 30;
  const CW = PW - ML * 2;

  // Font sizes (dots) — larger to fill 50mm label without blank space.
  const titleFont = isSmall ? 44 : 50;
  const subFont = isSmall ? 24 : 28;
  const dateFont = isSmall ? 26 : 30;
  const bodyFont = isSmall ? 24 : 28;
  const allergenLabelFont = isSmall ? 22 : 26;

  const allergenText = allergens && allergens.length > 0
    ? allergens.map(a => a.name.toUpperCase()).join(', ')
    : '';

  const rows: string[] = [];

  // Double-print at +1 dot offset to simulate BOLD in ZPL's bitmap font.
  const boldRow = (x: number, y: number, h: number, w: number, text: string): string[] => [
    `^FO${x},${y}^A0N,${h},${w}^FD${text}^FS`,
    `^FO${x + 1},${y}^A0N,${h},${w}^FD${text}^FS`,
  ];

  let y = isSmall ? 12 : 20;

  // ── PRODUCT NAME (bold large title) ───────────────────
  rows.push(...boldRow(ML, y, titleFont, titleFont, productName));
  y += titleFont + 8;

  // ── CATEGORY - SUBCATEGORY ─────────────────────────────
  const catParts: string[] = [];
  if (categoryName) catParts.push(categoryName);
  if (subcategoryName) catParts.push(subcategoryName);
  if (catParts.length > 0) {
    rows.push(`^FO${ML},${y}^A0N,${subFont},${subFont}^FD${catParts.join(' - ')}^FS`);
    y += subFont + 10;
  }

  // ── Separator ──────────────────────────────────────────
  rows.push(`^FO${ML},${y}^GB${CW},3,3^FS`);
  y += 12;

  // ── DATES (BOLD) ───────────────────────────────────────
  rows.push(...boldRow(ML, y, dateFont, dateFont, `PREPARED DATE: ${formatDateDMY(prepDate)}`));
  y += dateFont + 8;

  rows.push(...boldRow(ML, y, dateFont, dateFont, `EXPIRE DATE: ${formatDateDMY(expiryDate)}`));
  y += dateFont + 10;

  // ── Separator between dates and other info ─────────────
  rows.push(`^FO${ML},${y}^GB${CW},3,3^FS`);
  y += 12;

  // ── BODY (printed by / quantity / condition) ───────────
  const lineGap = bodyFont + 8;

  rows.push(`^FO${ML},${y}^A0N,${bodyFont},${bodyFont}^FDPRINTED BY: ${preparedByName || 'Unknown'}^FS`);
  y += lineGap;

  if (quantity) {
    const qtyText = `QUANTITY: ${quantity}${unit ? ' ' + unit.toUpperCase() : ''}`;
    rows.push(`^FO${ML},${y}^A0N,${bodyFont},${bodyFont}^FD${qtyText}^FS`);
    y += lineGap;
  }

  if (condition) {
    rows.push(`^FO${ML},${y}^A0N,${bodyFont},${bodyFont}^FDCONDITION: ${condition.toUpperCase()}^FS`);
    y += lineGap;
  }

  // ── Separator + ALLERGENS ──────────────────────────────
  if (allergenText) {
    rows.push(`^FO${ML},${y}^GB${CW},3,3^FS`);
    y += 12;

    rows.push(...boldRow(ML, y, allergenLabelFont, allergenLabelFont, 'ALLERGENS'));
    y += allergenLabelFont + 6;

    rows.push(`^FO${ML},${y}^A0N,${bodyFont},${bodyFont}^FD${allergenText}^FS`);
    y += bodyFont + 6;
  }

  return `^XA
^MMT
^PW${PW}
^LL${LL}
^LS0
^CI28
${rows.join('\n')}
^XZ`;
}
