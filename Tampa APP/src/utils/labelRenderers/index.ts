// Label canvas renderers — used by LabelPreviewCanvas for the on-screen
// label preview. These do NOT print; they render to a <canvas> so the user
// can see what the label will look like before sending it to the printer.
//
// Real printing is handled by the driver classes in src/lib/printers/
// (BluetoothUniversalPrinter, WebUsbPrinter) using the shared ZPL
// generator at src/utils/labelZpl.ts.

export { renderGenericLabel } from './genericRenderer';
export { renderPdfLabel } from './pdfRenderer';
