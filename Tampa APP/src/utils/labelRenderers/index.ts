// Label Renderers - Export all label format renderers
// 
// Architecture:
// - pdfRenderer: Unified professional layout used by PDFPrinter and all previews
// - genericRenderer: Used by GenericPrinter for browser-based printing
// - zebraRenderer: DEPRECATED - Zebra printing uses ZPL generation (zebraPrinter.ts)
//
export { renderGenericLabel } from './genericRenderer';
export { renderPdfLabel } from './pdfRenderer';
// renderZebraLabel removed - Zebra uses ZPL code generation instead of canvas
