// Generic Label Renderer - Uses PDF renderer for consistency
// This is for testing only - production uses Zebra printer
import { LabelData } from '@/components/labels/LabelForm';
import { renderPdfLabel } from './pdfRenderer';

export async function renderGenericLabel(
  ctx: CanvasRenderingContext2D,
  data: LabelData,
  width: number,
  height: number
): Promise<void> {
  // Simply delegate to PDF renderer for consistent output
  await renderPdfLabel(ctx, data, width, height);
}
