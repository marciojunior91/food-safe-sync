import { supabase } from "@/integrations/supabase/client";

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
 */
const sendToPrinter = async (zpl: string, quantity: number = 1): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Connect to local Zebra Browser Print service
      const socket = new WebSocket('ws://127.0.0.1:9100/');

      socket.onopen = () => {
        console.log('Connected to printer');
        // Add quantity command to ZPL
        const zplWithQuantity = zpl.replace('^XZ', `^PQ${quantity}^XZ`);
        socket.send(zplWithQuantity);
        console.log('Label sent to printer');
      };

      socket.onmessage = () => {
        console.log('Printer acknowledged');
        socket.close();
        resolve();
      };

      socket.onclose = () => {
        console.log('Printer connection closed');
        resolve();
      };

      socket.onerror = (error) => {
        console.error('Printer WebSocket Error:', error);
        console.error('Error details:', {
          type: error.type,
          readyState: socket.readyState
        });
        socket.close();
        reject(new Error('Failed to connect to printer. Make sure Zebra Printer Setup is running and Web Services is enabled.'));
      };

      // Timeout after 10 seconds (increased for Bluetooth latency)
      setTimeout(() => {
        if (socket.readyState !== WebSocket.CLOSED) {
          console.warn('WebSocket timeout - closing connection');
          socket.close();
          reject(new Error('Printer connection timeout. Check if Zebra Printer Setup is connected to printer.'));
        }
      }, 10000);

    } catch (error) {
      console.error('Error setting up printer connection:', error);
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
  try {
    // 1. Save to database first to get the labelId
    const labelId = await saveLabelToDatabase(data);

    // 2. Generate ZPL with labelId included in QR code
    const dataWithLabelId = { ...data, labelId: labelId || undefined };
    const zpl = generateZPL(dataWithLabelId);

    // 3. TEST MODE: Skip printer connection, just return success with ZPL for preview
    if (testMode) {
      console.log('🧪 TEST MODE: Label saved to database, skipping printer connection');
      console.log('💾 Label ID:', labelId);
      console.log('✅ Database insert successful!');
      console.log('📄 ZPL Code generated (', zpl.length, 'characters)');
      return {
        success: true,
        labelId: labelId || undefined,
        zpl: zpl, // Return ZPL for preview/download
      };
    }

    // 4. PRODUCTION MODE: Send to printer
    const printQuantity = data.quantity ? parseInt(data.quantity) : 1;
    await sendToPrinter(zpl, printQuantity);

    return {
      success: true,
      labelId: labelId || undefined,
    };
  } catch (error) {
    console.error('Error printing label:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
