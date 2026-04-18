import { supabase } from "@/integrations/supabase/client";
import { printerDiagnostics } from "./printerDiagnostics";

// Force bundle rebuild - version 2.1.0 with PERSISTENT LOGGING
// Build timestamp: 2026-01-20T06:45:00Z - DIAGNOSTIC LOGGING ACTIVE
// CRITICAL: Logs now persist in LocalStorage - accessible even if bundle doesn't update!
console.log('[zebraPrinter.ts] Module loaded - Build #4 - Diagnostic logging active');
printerDiagnostics.info('zebraPrinter.ts module loaded - Multi-port support + Persistent logging', {
  version: '2.1.0',
  buildDate: '2026-01-20T06:45:00Z'
});

export interface OrganizationDetails {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  foodSafetyRegistration?: string; // SIF in Brazil, Food Business Registration in Australia
}

export interface LabelPrintData {
  labelId?: string; // UUID from printed_labels table - for lifecycle tracking
  productId: string | null; // UUID or null for quick print without product
  productName: string;
  categoryId: string | null;
  categoryName: string;
  subcategoryId?: string | null; // UUID for subcategory
  preparedBy: string;
  preparedByName: string;
  prepDate: string;
  expiryDate: string;
  condition: string;
  organizationId: string; // Required for RLS
  organizationDetails?: OrganizationDetails; // Company/restaurant information for label
  quantity?: string;
  unit?: string;
  qrCodeData?: string;
  batchNumber: string;
  allergens?: Array<{
    id: string;
    name: string;
    icon: string | null;
    severity: string;
  }>;
}

/**
 * Generate ZPL code from label data
 * Designed for BOPP (Biaxially Oriented Polypropylene) labels
 * Mirrors the LabelPreview card layout for BOPP on Zebra thermal printers.
 * Layout (top→bottom):
 *   [Header box: product name left, quantity right]
 *   [Separator]
 *   [Condition uppercase]
 *   [Separator]
 *   [Left col: Prep Date / Expiry / Batch / Category | Right col: QR code]
 *   [Separator]
 *   [Allergens (if any)]
 *   [Separator]
 *   [Prepared By]
 *   [Separator]
 *   [Org footer: phone / address]
 *   [Label ID bottom-left]
 */
const generateZPL = (data: LabelPrintData): string => {
  const {
    labelId,
    productName,
    categoryName,
    condition,
    prepDate,
    expiryDate,
    preparedByName,
    quantity,
    unit,
    allergens,
    organizationDetails,
  } = data;

  // QR code URL — matches LabelPreview's qrData when labelId is present
  const qrValue = labelId
    ? `https://app.tampaapp.com.br/labels/${labelId}/preview`
    : JSON.stringify({ product: productName, prep: prepDate, exp: expiryDate, batch: data.batchNumber });

  // Allergen text
  const allergenText = allergens && allergens.length > 0
    ? allergens.map(a => a.name).join(', ')
    : '';

  // Address lines
  let addrLine1 = '';
  let addrLine2 = '';
  if (organizationDetails?.address) {
    try {
      const addr = typeof organizationDetails.address === 'string'
        ? JSON.parse(organizationDetails.address)
        : organizationDetails.address;
      addrLine1 = `${addr.street || ''}, ${addr.number || ''}`.trim();
      addrLine2 = `${addr.city || ''} - ${addr.state || ''}, ${addr.postalCode || ''}`.trim();
    } catch {
      addrLine1 = String(organizationDetails.address);
    }
  }

  // ── Dynamic-position builder ──────────────────────────────────────────────
  // PW=812 dots (102mm @ 203dpi), each row step = 40 dots
  const PW = 812;   // label width
  const ML = 30;    // left margin
  const MR = 30;    // right margin
  const CW = PW - ML - MR; // content width = 752
  const QR_SIZE = 5; // ^BQH magnification (5 → ~140 dots)
  const QR_W = 150;  // approximate pixel width of QR block
  const LEFT_W = CW - QR_W - 20; // left column width

  const rows: string[] = [];
  let y = 20; // current vertical position

  const sep = (y: number) => `^FO${ML},${y}^GB${CW},2,2^FS`;
  const advance = (n = 40) => { y += n; };

  // ── Header box: product name left, quantity right ─────────────────────────
  rows.push(`^FO${ML},${y}^GB${CW},70,3^FS`);
  rows.push(`^FO${ML + 10},${y + 15}^A0N,45,45^FW^FD${productName}^FS`);
  if (quantity && unit) {
    rows.push(`^FO${ML + LEFT_W},${y + 18}^A0N,38,38^FD${quantity} ${unit}^FS`);
  }
  advance(75);

  // ── Separator ─────────────────────────────────────────────────────────────
  rows.push(sep(y)); advance(18);

  // ── Condition ─────────────────────────────────────────────────────────────
  rows.push(`^FO${ML + 10},${y}^A0N,34,34^FD${(condition || '').toUpperCase()}^FS`);
  advance(44);

  // ── Separator + main content block start ─────────────────────────────────
  rows.push(sep(y)); advance(18);

  const contentStartY = y;

  // ── Left column: dates ────────────────────────────────────────────────────
  rows.push(`^FO${ML + 10},${y}^A0N,22,22^FDPREP DATE^FS`);
  rows.push(`^FO${ML + 10},${y + 24}^A0N,28,28^FWB^FD${prepDate || 'N/A'}^FS`);
  advance(62);

  rows.push(`^FO${ML + 10},${y}^A0N,22,22^FDUSE BY^FS`);
  rows.push(`^FO${ML + 10},${y + 24}^A0N,28,28^FWB^FD${expiryDate || 'N/A'}^FS`);
  advance(62);

  if (data.batchNumber) {
    rows.push(`^FO${ML + 10},${y}^A0N,22,22^FDBATCH #^FS`);
    rows.push(`^FO${ML + 10},${y + 24}^A0N,26,26^FD${data.batchNumber}^FS`);
    advance(54);
  }

  if (categoryName && categoryName !== 'Quick Print') {
    rows.push(`^FO${ML + 10},${y}^A0N,22,22^FDCATEGORY^FS`);
    rows.push(`^FO${ML + 10},${y + 24}^A0N,26,26^FD${categoryName}^FS`);
    advance(54);
  }

  // ── Right column: QR code (anchored to contentStartY) ────────────────────
  const qrX = ML + LEFT_W + 10;
  rows.push(`^FO${qrX},${contentStartY}^BQH,2,${QR_SIZE}^FDQA,${qrValue}^FS`);

  // ── Separator after content block ─────────────────────────────────────────
  rows.push(sep(y)); advance(18);

  // ── Allergens (if any) ────────────────────────────────────────────────────
  if (allergenText) {
    rows.push(`^FO${ML + 10},${y}^A0N,22,22^FDALLERGENS^FS`); advance(28);
    // Wrap allergen text at ~60 chars
    const words = allergenText.split(', ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line}, ${word}` : word;
      if (test.length > 58 && line) {
        rows.push(`^FO${ML + 10},${y}^A0N,24,24^FD${line}^FS`); advance(30);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) { rows.push(`^FO${ML + 10},${y}^A0N,24,24^FD${line}^FS`); advance(34); }
    rows.push(sep(y)); advance(18);
  }

  // ── Prepared By ───────────────────────────────────────────────────────────
  rows.push(`^FO${ML + 10},${y}^A0N,28,28^FDPREPARED BY: ${(preparedByName || '').toUpperCase()}^FS`);
  advance(40);
  rows.push(sep(y)); advance(18);

  // ── Org footer ────────────────────────────────────────────────────────────
  if (organizationDetails?.phone) {
    rows.push(`^FO${ML + 10},${y}^A0N,22,22^FDTel: ${organizationDetails.phone}^FS`); advance(28);
  }
  if (addrLine1) {
    rows.push(`^FO${ML + 10},${y}^A0N,20,20^FD${addrLine1}^FS`); advance(26);
  }
  if (addrLine2) {
    rows.push(`^FO${ML + 10},${y}^A0N,20,20^FD${addrLine2}^FS`); advance(26);
  }

  // ── Label ID bottom-left ──────────────────────────────────────────────────
  if (labelId) {
    advance(10);
    rows.push(`^FO${ML + 10},${y}^A0N,18,18^FD#${labelId.substring(0, 8).toUpperCase()}^FS`);
    advance(24);
  }

  // Final label height (with 20px bottom margin)
  const labelHeight = y + 20;

  const zpl = `^XA
^MMT
^PW${PW}
^LL${labelHeight}
^LS0
^CI28
${rows.join('\n')}
^XZ`;

  return zpl;
};

/**
 * Save printed label to database history
 */
export const saveLabelToDatabase = async (data: LabelPrintData): Promise<string | null> => {
  try {
    // CRITICAL VALIDATION: prepared_by is REQUIRED for food safety compliance
    if (!data.preparedBy || data.preparedBy.trim() === '') {
      const error = new Error('VALIDATION ERROR: prepared_by is a required field. Every label must identify who prepared it for food safety compliance and audit trail.');
      console.error(error.message, data);
      throw error;
    }

    // CRITICAL VALIDATION: organization_id is REQUIRED for RLS
    if (!data.organizationId || data.organizationId.trim() === '') {
      const error = new Error('VALIDATION ERROR: organizationId is required for Row Level Security.');
      console.error(error.message, data);
      throw error;
    }

    // Format allergens as array of names for storage
    const allergenNames = data.allergens?.map(a => a.name) || [];
    
    // Validate required FK fields
    if (!data.productId || data.productId.trim() === '') {
      console.warn('product_id is required for printed_labels but was empty');
      // For now, we'll allow it to maintain backwards compatibility
      // TODO: Make this a hard requirement after data cleanup
    }
    
    // Handle product_id - convert empty string to null for UUID field
    const productId = data.productId && data.productId.trim() !== '' ? data.productId : null;
    const categoryId = data.categoryId && data.categoryId.trim() !== '' ? data.categoryId : null;
    const subcategoryId = data.subcategoryId && data.subcategoryId.trim() !== '' ? data.subcategoryId : null;
    
    const { data: insertedData, error } = await supabase
      .from("printed_labels")
      .insert({
        product_id: productId,
        product_name: data.productName,
        category_id: categoryId,
        category_name: data.categoryName,
        subcategory_id: subcategoryId, // Now included!
        prepared_by: data.preparedBy,
        prepared_by_name: data.preparedByName,
        prep_date: data.prepDate,
        expiry_date: data.expiryDate,
        condition: data.condition,
        quantity: data.quantity || null,
        unit: data.unit || null,
        organization_id: data.organizationId, // Required for RLS
        allergens: allergenNames.length > 0 ? allergenNames : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving label to database:", error);
      throw error;
    }

    console.log("Label saved to database:", insertedData);
    return insertedData?.id || null;
  } catch (error) {
    console.error("Failed to save label:", error);
    throw error;
  }
};

/**
 * Send ZPL to Zebra printer
 * 
 * Strategy (in order):
 * 1. Print Server HTTP API (for P1112640-017C Bluetooth-to-TCP adapter)
 *    - Sends to local Node.js server which opens raw TCP socket to printer
 * 2. WebSocket to Zebra Browser Print (legacy / iOS fallback)
 *    - Tries ports 6101, 9100, 9200
 * 
 * Printer IP/port are read from localStorage (set by Settings → Printer tab)
 * so each restaurant can configure their own printer without env files.
 */
const PRINT_SERVER_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PRINT_SERVER_URL) || 'http://localhost:3001';

/**
 * Read printer IP and port from localStorage (saved by PrinterManagementTab / usePrinter hook).
 * Falls back to env vars, then to safe defaults.
 */
function getPrinterAddress(): { ip: string; port: number } {
  try {
    const stored = localStorage.getItem('printer_settings');
    if (stored) {
      const settings = JSON.parse(stored);
      const ip =
        settings.connectionConfig?.ipAddress ||
        settings.ipAddress ||
        '';
      const port =
        settings.connectionConfig?.port ||
        settings.port ||
        9100;
      if (ip) return { ip, port };
    }
  } catch { /* ignore parse errors */ }

  // Fallback to env vars (for backwards compatibility / CI)
  const envIp = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PRINTER_IP) || '';
  const envPort = parseInt((typeof import.meta !== 'undefined' && import.meta.env?.VITE_PRINTER_PORT) || '9100');
  return { ip: envIp || '192.168.1.100', port: envPort };
}

const sendToPrinter = async (zpl: string, quantity: number = 1): Promise<void> => {
  const { ip: PRINTER_IP, port: PRINTER_PORT } = getPrinterAddress();

  printerDiagnostics.info('🖨️ Starting print job', {
    zplLength: zpl.length,
    quantity,
    printServerUrl: PRINT_SERVER_URL,
    printerIp: PRINTER_IP,
    printerPort: PRINTER_PORT,
    strategy: 'PrintServer(TCP) → WebSocket(BrowserPrint)',
    source: 'localStorage → env → default',
  });

  // ── Method 1: Print Server (HTTP → raw TCP) ────────────────────────────────
  // This is the primary path for the P1112640-017C wireless adapter
  try {
    printerDiagnostics.info('📡 Attempting Print Server (TCP bridge)...', {
      url: `${PRINT_SERVER_URL}/print`,
      printerIp: PRINTER_IP,
      printerPort: PRINTER_PORT,
    });

    const response = await fetch(`${PRINT_SERVER_URL}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zpl,
        copies: quantity,
        ip: PRINTER_IP,
        port: PRINTER_PORT,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const result = await response.json();

    if (result.success) {
      printerDiagnostics.success('✅ Print job sent via Print Server (TCP)!', {
        jobNumber: result.jobNumber,
        copies: quantity,
        printerIp: result.ip,
      });
      return; // Success!
    } else {
      throw new Error(result.error || 'Print server returned failure');
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    printerDiagnostics.warning('⚠️ Print Server method failed, falling back to WebSocket...', {
      error: msg,
      hint: msg.includes('fetch') || msg.includes('Failed to fetch')
        ? 'Print server not running. Start with: cd print-server && npm start'
        : undefined,
    });
  }

  // ── Method 2: WebSocket to Zebra Browser Print (legacy) ─────────────────────
  const ports = [
    { port: 6101, name: 'Zebra Browser Print' },
    { port: 9100, name: 'Web Services' },
    { port: 9200, name: 'Zebra Setup Utilities' }
  ];

  printerDiagnostics.info('🔌 Trying WebSocket fallback (Zebra Browser Print)...', {
    portsToTry: ports.map(p => `${p.port} (${p.name})`),
  });

  let lastError: Error | null = null;

  for (const { port, name } of ports) {
    const attemptNumber = ports.findIndex(p => p.port === port) + 1;
    
    try {
      printerDiagnostics.info(`🔍 Attempting WebSocket connection`, {
        attempt: `${attemptNumber}/${ports.length}`,
        port,
        name
      }, port);
      
      await attemptConnection(zpl, quantity, port, name);
      
      printerDiagnostics.success(`✅ Print job completed via WebSocket!`, {
        port,
        name,
        quantity
      }, port);
      
      return;
      
    } catch (error) {
      lastError = error as Error;
      printerDiagnostics.error(`WebSocket connection failed`, {
        port,
        name,
        error: error instanceof Error ? error.message : String(error),
        willRetry: attemptNumber < ports.length
      }, port);
      
      continue;
    }
  }

  // All methods failed
  const { ip: failedIp } = getPrinterAddress();
  const errorMessage = 'All print methods failed (Print Server + WebSocket)';
  printerDiagnostics.error(errorMessage, {
    printServerUrl: PRINT_SERVER_URL,
    triedPorts: ports.map(p => `${p.port} (${p.name})`),
    lastError: lastError?.message,
    troubleshooting: [
      '--- P1112640-017C Adapter (preferred) ---',
      'Start print server: cd print-server && npm start',
      `Verify printer IP: ${failedIp} (hold FEED 5s to print config label)`,
      'Ensure adapter LED is solid (not blinking)',
      'Ensure printer & computer on same network',
      '--- Zebra Browser Print (fallback) ---',
      'Zebra Printer Setup app is OPEN (not closed)',
      'Printer is CONNECTED via Bluetooth (🟢 green status)',
      'Try closing and reopening Zebra Printer Setup',
    ]
  });
  
  throw new Error(`${errorMessage}. Last error: ${lastError?.message}`);
};

/**
 * Attempt WebSocket connection on specific port
 */
const attemptConnection = async (
  zpl: string, 
  quantity: number, 
  port: number,
  portName: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const wsUrl = `ws://127.0.0.1:${port}/`;
    
    printerDiagnostics.info(`Connecting to ${wsUrl}`, {
      timeout: '10 seconds'
    }, port);
    
    let socket: WebSocket;
    let timeoutId: NodeJS.Timeout;

    try {
      socket = new WebSocket(wsUrl);
      
      // Set timeout
      timeoutId = setTimeout(() => {
        if (socket.readyState !== WebSocket.CLOSED) {
          printerDiagnostics.warning('Connection timeout after 10 seconds', {}, port);
          socket.close();
          reject(new Error(`Connection timeout on port ${port}`));
        }
      }, 10000);

      socket.onopen = () => {
        printerDiagnostics.success('WebSocket opened successfully', {
          readyState: socket.readyState,
          readyStateMeaning: 'OPEN'
        }, port);
        
        // Add quantity command to ZPL
        const zplWithQuantity = zpl.replace('^XZ', `^PQ${quantity}^XZ`);
        
        printerDiagnostics.info(`Sending ZPL`, {
          length: zplWithQuantity.length,
          quantity
        }, port);
        
        socket.send(zplWithQuantity);
        
        printerDiagnostics.success('ZPL sent successfully', {}, port);
      };

      socket.onmessage = (event) => {
        printerDiagnostics.success('Printer acknowledged', {
          response: event.data
        }, port);
        
        clearTimeout(timeoutId);
        socket.close();
        resolve();
      };

      socket.onclose = (event) => {
        printerDiagnostics.info('WebSocket closed', {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean
        }, port);
        
        clearTimeout(timeoutId);
        
        if (event.wasClean) {
          resolve(); // Normal closure
        } else {
          reject(new Error(`Connection closed unexpectedly (code: ${event.code})`));
        }
      };

      socket.onerror = (error) => {
        printerDiagnostics.error('WebSocket error', {
          type: error.type,
          readyState: socket.readyState,
          readyStateMeaning: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][socket.readyState]
        }, port);
        
        clearTimeout(timeoutId);
        socket.close();
        reject(new Error(`WebSocket error on port ${port}: ${error.type}`));
      };

    } catch (error) {
      printerDiagnostics.error('Failed to create WebSocket', {
        error: error instanceof Error ? error.message : String(error)
      }, port);
      
      if (timeoutId) clearTimeout(timeoutId);
      reject(error);
    }
  });
};

/**
 * Main function to print a label
 * Saves to database first, then sends to printer with labelId in QR code
 * 
 * @param data - Label data to print
 * @param testMode - If true, only saves to database without trying to connect to printer (for testing)
 *                   Can also be controlled via VITE_PRINTER_TEST_MODE environment variable
 */
export const printLabel = async (
  data: LabelPrintData, 
  testMode: boolean = import.meta.env.VITE_PRINTER_TEST_MODE === 'true'
): Promise<{ success: boolean; labelId?: string; error?: string; zpl?: string }> => {
  // VERSION CHECK - If you see this, new code is loaded!
  console.log('\n🚀 ============================================');
  console.log('🚀 CODE VERSION: 2.0.0 - MULTI-PORT SUPPORT');
  console.log('🚀 Build Date: 2026-01-19 01:30 BRT');
  console.log('🚀 ============================================\n');
  
  console.log('\n🏷️  ============================================');
  console.log('🏷️  ZEBRA LABEL PRINTING - START');
  console.log('🏷️  ============================================');
  console.log('📦 Product:', data.productName);
  console.log('🏢 Organization:', data.organizationId);
  console.log('👤 Prepared by:', data.preparedByName);
  console.log('📅 Prep date:', data.prepDate);
  console.log('📅 Expiry date:', data.expiryDate);
  console.log('🧪 Test mode:', testMode);
  console.log('🏷️  ============================================\n');

  try {
    // 1. Save to database first to get the labelId (skip if already provided)
    console.log('💾 [STEP 1/3] Saving label to database...');
    const labelId = data.labelId ?? await saveLabelToDatabase(data);
    console.log(`✅ [STEP 1/3] Label saved! ID: ${labelId}\n`);

    // 2. Generate ZPL with labelId included in QR code
    console.log('📝 [STEP 2/3] Generating ZPL code...');
    const dataWithLabelId = { ...data, labelId: labelId || undefined };
    const zpl = generateZPL(dataWithLabelId);
    console.log(`✅ [STEP 2/3] ZPL generated (${zpl.length} characters)\n`);

    // 3. TEST MODE: Skip printer connection, just return success with ZPL for preview
    if (testMode) {
      console.log('🧪 ============================================');
      console.log('🧪 TEST MODE ENABLED - SKIPPING PRINTER');
      console.log('🧪 ============================================');
      console.log('💾 Label ID:', labelId);
      console.log('✅ Database insert successful!');
      console.log('📄 ZPL Code generated (', zpl.length, 'characters)');
      console.log('🧪 ============================================\n');
      
      return {
        success: true,
        labelId: labelId || undefined,
        zpl: zpl, // Return ZPL for preview/download
      };
    }

    // 4. PRODUCTION MODE: Send to printer
    console.log('🖨️  [STEP 3/3] Sending to printer...');
    const printQuantity = data.quantity ? parseInt(data.quantity) : 1;
    await sendToPrinter(zpl, printQuantity);
    
    console.log('\n✅ ============================================');
    console.log('✅ LABEL PRINTED SUCCESSFULLY!');
    console.log('✅ ============================================');
    console.log('🏷️  Label ID:', labelId);
    console.log('🖨️  Quantity:', printQuantity);
    console.log('✅ ============================================\n');

    return {
      success: true,
      labelId: labelId || undefined,
    };
  } catch (error) {
    console.error('\n❌ ============================================');
    console.error('❌ LABEL PRINTING FAILED');
    console.error('❌ ============================================');
    console.error('❌ Error:', error);
    console.error('❌ Message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ ============================================\n');
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
