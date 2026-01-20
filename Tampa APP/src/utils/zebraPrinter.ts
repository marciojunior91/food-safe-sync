import { supabase } from "@/integrations/supabase/client";

// Force bundle rebuild - version 2.0.0 with multi-port support
// Build timestamp: 2026-01-19T05:00:00Z - FORCE REBUILD #2
// CRITICAL: This file MUST generate a different hash!
console.log('[zebraPrinter.ts] Module loaded - Build #3 - Multi-port support active');

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
 * Following Suflex label layout pattern
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
    organizationDetails 
  } = data;
  
  // Generate QR Code data - includes labelId for product lifecycle tracking
  const qrData = JSON.stringify({
    labelId: labelId || null,
    product: productName,
    prep: prepDate,
    exp: expiryDate,
    batch: data.batchNumber,
    by: preparedByName,
  });
  
  // Format allergen text
  const allergenText = allergens && allergens.length > 0
    ? allergens.map(a => a.name).join(', ')
    : '';
  
  // Format address - handle JSON format
  let addressText = '';
  if (organizationDetails?.address) {
    try {
      const addr = typeof organizationDetails.address === 'string' 
        ? JSON.parse(organizationDetails.address)
        : organizationDetails.address;
      addressText = `${addr.street || ''}, ${addr.number || ''}\n${addr.city || ''} - ${addr.state || ''}, ${addr.postalCode || ''}`;
    } catch {
      addressText = String(organizationDetails.address);
    }
  }
  
  // Professional ZPL layout
  const zpl = `
^XA
^CF0,30
~TA000
~JSN
^LT0
^MNW
^MTT
^PON
^PMN
^LH0,0
^JMA
^PR4,4
~SD15
^JUS
^LRN
^CI27
^PA0,1,1,0
^XZ

^XA
^MMT
^PW812  // 4 inches = 812 dots at 203 DPI (102mm)
^LL1218 // 6 inches = 1218 dots at 203 DPI (152mm)
^LS0

// Product Name Header (bold, centered)
^FO30,30^GB752,80,3^FS
^FO50,45^A0N,50,50^FD${productName}^FS

^FO30,120^GB752,2,2^FS

// Condition & Quantity
^FO50,140^A0N,35,35^FD${condition.toUpperCase()}${quantity ? ` / ${quantity} ${unit || ''}` : ''}^FS

^FO30,190^GB752,2,2^FS

// Manufacturing & Expiry Dates
^FO50,210^A0N,30,30^FDMfg Date:^FS
^FO350,210^A0N,30,30^FD${prepDate}^FS

^FO50,260^A0N,30,30^FDExpiry:^FS
^FO350,260^A0N,30,30^FD${expiryDate}^FS

${data.batchNumber ? `
^FO50,310^A0N,28,28^FDBatch:^FS
^FO250,310^A0N,28,28^FD${data.batchNumber}^FS
` : ''}

${categoryName && categoryName !== 'Quick Print' ? `
^FO50,${data.batchNumber ? '360' : '310'}^A0N,28,28^FDCategory:^FS
^FO250,${data.batchNumber ? '360' : '310'}^A0N,28,28^FD${categoryName}^FS
` : ''}

^FO30,${categoryName && categoryName !== 'Quick Print' ? (data.batchNumber ? '410' : '360') : (data.batchNumber ? '360' : '310')}^GB752,2,2^FS

${allergens && allergens.length > 0 ? `
^FO50,${categoryName && categoryName !== 'Quick Print' ? (data.batchNumber ? '430' : '380') : (data.batchNumber ? '380' : '330')}^A0N,26,26^FDAllergens:^FS
^FO50,${categoryName && categoryName !== 'Quick Print' ? (data.batchNumber ? '470' : '420') : (data.batchNumber ? '420' : '370')}^A0N,24,24^FD${allergenText.length > 45 ? allergenText.substring(0, 45) + '...' : allergenText}^FS
^FO30,${categoryName && categoryName !== 'Quick Print' ? (data.batchNumber ? '510' : '460') : (data.batchNumber ? '460' : '410')}^GB752,2,2^FS
` : ''}

// Prepared By
^FO50,${allergens && allergens.length > 0 ? 
  (categoryName && categoryName !== 'Quick Print' ? (data.batchNumber ? '530' : '480') : (data.batchNumber ? '480' : '430')) : 
  (categoryName && categoryName !== 'Quick Print' ? (data.batchNumber ? '430' : '380') : (data.batchNumber ? '380' : '330'))
}^A0N,28,28^FDPrepared By: ${preparedByName.toUpperCase()}^FS

^FO30,${allergens && allergens.length > 0 ? 
  (categoryName && categoryName !== 'Quick Print' ? (data.batchNumber ? '570' : '520') : (data.batchNumber ? '520' : '470')) : 
  (categoryName && categoryName !== 'Quick Print' ? (data.batchNumber ? '470' : '420') : (data.batchNumber ? '420' : '370'))
}^GB752,2,2^FS

${labelId ? `^FO50,${allergens && allergens.length > 0 ? 
  (categoryName && categoryName !== 'Quick Print' ? (data.batchNumber ? '590' : '540') : (data.batchNumber ? '540' : '490')) : 
  (categoryName && categoryName !== 'Quick Print' ? (data.batchNumber ? '490' : '440') : (data.batchNumber ? '440' : '390'))
}^A0N,20,20^FDLabel ID: #${labelId.substring(0, 8).toUpperCase()}^FS` : ''}

// QR Code (bottom right, larger for readability)
^FO600,${allergens && allergens.length > 0 ? 
  (categoryName && categoryName !== 'Quick Print' ? (data.batchNumber ? '950' : '900') : (data.batchNumber ? '900' : '850')) : 
  (categoryName && categoryName !== 'Quick Print' ? (data.batchNumber ? '850' : '800') : (data.batchNumber ? '800' : '750'))
}^BQN,2,6^FDQA,${qrData}^FS

^XZ
`;

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
    
    // Handle product_id - convert empty string to null for UUID field
    const productId = data.productId && data.productId.trim() !== '' ? data.productId : null;
    const categoryId = data.categoryId && data.categoryId.trim() !== '' ? data.categoryId : null;
    
    const { data: insertedData, error } = await supabase
      .from("printed_labels")
      .insert({
        product_id: productId,
        product_name: data.productName,
        category_id: categoryId,
        category_name: data.categoryName,
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
 * Send ZPL to Zebra printer via WebSocket
 * Tries multiple ports in order:
 * - 6101: Zebra Browser Print (desktop/mobile)
 * - 9100: Web Services (Link-OS)
 * - 9200: Zebra Setup Utilities
 */
const sendToPrinter = async (zpl: string, quantity: number = 1): Promise<void> => {
  // Ports to try in order of likelihood for Zebra Printer Setup on iOS
  const ports = [
    { port: 6101, name: 'Zebra Browser Print' },
    { port: 9100, name: 'Web Services' },
    { port: 9200, name: 'Zebra Setup Utilities' }
  ];

  console.log('🖨️ ============================================');
  console.log('🖨️ ZEBRA PRINTER - DETAILED CONNECTION LOG');
  console.log('🖨️ ============================================');
  console.log('📱 Device: iPhone via Zebra Printer Setup App');
  console.log('🔌 Connection: Bluetooth');
  console.log('📄 ZPL Length:', zpl.length, 'characters');
  console.log('🔢 Quantity:', quantity);
  console.log('🌐 Attempting connection to localhost...');
  console.log('🖨️ ============================================\n');

  let lastError: Error | null = null;

  // Try each port sequentially
  for (const { port, name } of ports) {
    try {
      console.log(`\n🔍 [ATTEMPT ${ports.indexOf({ port, name }) + 1}/${ports.length}] Trying ${name} on port ${port}...`);
      await attemptConnection(zpl, quantity, port, name);
      
      // If we get here, connection succeeded!
      console.log(`\n✅ ============================================`);
      console.log(`✅ SUCCESS! Connected via ${name} (port ${port})`);
      console.log(`✅ ============================================\n`);
      return; // Exit successfully
      
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ [PORT ${port}] ${name} failed:`, error instanceof Error ? error.message : error);
      console.log(`⏭️  Trying next port...\n`);
      continue; // Try next port
    }
  }

  // If we get here, all ports failed
  console.error('\n❌ ============================================');
  console.error('❌ ALL CONNECTION ATTEMPTS FAILED');
  console.error('❌ ============================================');
  console.error('❌ Tried ports:', ports.map(p => `${p.port} (${p.name})`).join(', '));
  console.error('❌ Last error:', lastError?.message);
  console.error('\n🔧 TROUBLESHOOTING STEPS:');
  console.error('1. ✅ Zebra Printer Setup app is OPEN (not closed)');
  console.error('2. ✅ Printer is CONNECTED via Bluetooth (🟢 green status)');
  console.error('3. ✅ Web Services is ENABLED (if option appears)');
  console.error('4. ✅ App is in FOREGROUND or background refresh enabled');
  console.error('5. 🔄 Try closing and reopening Zebra Printer Setup');
  console.error('6. 🔄 Try disconnecting and reconnecting printer');
  console.error('❌ ============================================\n');
  
  throw new Error(`Failed to connect to printer on any port. Last error: ${lastError?.message}`);
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
    console.log(`🔗 Connecting to: ${wsUrl}`);
    console.log(`⏱️  Timeout: 10 seconds`);
    
    let socket: WebSocket;
    let timeoutId: NodeJS.Timeout;

    try {
      socket = new WebSocket(wsUrl);
      
      // Set timeout
      timeoutId = setTimeout(() => {
        if (socket.readyState !== WebSocket.CLOSED) {
          console.warn(`⏱️  [PORT ${port}] Timeout after 10 seconds`);
          socket.close();
          reject(new Error(`Connection timeout on port ${port}`));
        }
      }, 10000);

      socket.onopen = () => {
        console.log(`✅ [PORT ${port}] WebSocket OPENED successfully`);
        console.log(`📊 ReadyState: ${socket.readyState} (1=OPEN)`);
        
        // Add quantity command to ZPL
        const zplWithQuantity = zpl.replace('^XZ', `^PQ${quantity}^XZ`);
        
        console.log(`📤 Sending ZPL (${zplWithQuantity.length} chars)...`);
        socket.send(zplWithQuantity);
        console.log(`✅ [PORT ${port}] ZPL sent successfully`);
      };

      socket.onmessage = (event) => {
        console.log(`📨 [PORT ${port}] Printer acknowledged:`, event.data);
        clearTimeout(timeoutId);
        socket.close();
        resolve();
      };

      socket.onclose = (event) => {
        console.log(`🔒 [PORT ${port}] WebSocket closed`);
        console.log(`   Code: ${event.code}`);
        console.log(`   Reason: ${event.reason || 'No reason provided'}`);
        console.log(`   Clean: ${event.wasClean}`);
        clearTimeout(timeoutId);
        
        if (event.wasClean) {
          resolve(); // Normal closure
        } else {
          reject(new Error(`Connection closed unexpectedly (code: ${event.code})`));
        }
      };

      socket.onerror = (error) => {
        console.error(`❌ [PORT ${port}] WebSocket ERROR`);
        console.error(`   Event type: ${error.type}`);
        console.error(`   ReadyState: ${socket.readyState}`);
        console.error(`   ReadyState meaning:`, {
          0: 'CONNECTING',
          1: 'OPEN',
          2: 'CLOSING',
          3: 'CLOSED'
        }[socket.readyState]);
        
        clearTimeout(timeoutId);
        socket.close();
        reject(new Error(`WebSocket error on port ${port}: ${error.type}`));
      };

    } catch (error) {
      console.error(`❌ [PORT ${port}] Failed to create WebSocket:`, error);
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
    // 1. Save to database first to get the labelId
    console.log('💾 [STEP 1/3] Saving label to database...');
    const labelId = await saveLabelToDatabase(data);
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
