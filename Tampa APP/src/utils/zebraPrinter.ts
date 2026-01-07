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
^PW600
^LL600
^LS0

^FO20,20^GB560,60,3^FS
^FO30,30^A0N,45,45^FD${productName}^FS

^FO20,90^GB560,1,1^FS

^FO30,100^A0N,24,24^FD${condition.toUpperCase()}${quantity ? ` / ${quantity} ${unit || ''}` : ''}^FS

^FO20,130^GB560,1,1^FS

^FO30,140^A0N,20,20^FDManufacturing Date:^FS
^FO230,140^A0N,20,20^FD${prepDate}^FS

^FO30,165^A0N,20,20^FDExpiry Date:^FS
^FO230,165^A0N,20,20^FD${expiryDate}^FS

${data.batchNumber ? `
^FO30,190^A0N,20,20^FDBatch:^FS
^FO150,190^A0N,20,20^FD${data.batchNumber}^FS
` : ''}

${categoryName && categoryName !== 'Quick Print' ? `
^FO30,215^A0N,20,20^FDCategory:^FS
^FO150,215^A0N,20,20^FD${categoryName}^FS
` : ''}

${organizationDetails?.foodSafetyRegistration ? `
^FO30,240^A0N,20,20^FDFood Safety Reg:^FS
^FO200,240^A0N,20,20^FD${organizationDetails.foodSafetyRegistration}^FS
` : ''}

^FO20,270^GB560,1,1^FS

${allergens && allergens.length > 0 ? `
^FO30,280^A0N,18,18^FDAllergens:^FS
^FO30,300^A0N,16,16^FD${allergenText.length > 50 ? allergenText.substring(0, 50) + '...' : allergenText}^FS
^FO20,325^GB560,1,1^FS
` : ''}

^FO30,${allergens && allergens.length > 0 ? '335' : '280'}^A0N,20,20^FDPrepared By: ${preparedByName.toUpperCase()}^FS

^FO20,${allergens && allergens.length > 0 ? '365' : '310'}^GB560,1,1^FS

${organizationDetails ? `
^FO30,${allergens && allergens.length > 0 ? '375' : '320'}^A0N,18,18^FD${organizationDetails.name.toUpperCase()}^FS
${organizationDetails.phone ? `^FO30,${allergens && allergens.length > 0 ? '395' : '340'}^A0N,14,14^FDTel: ${organizationDetails.phone}^FS` : ''}
${addressText ? `
^FO30,${allergens && allergens.length > 0 ? '415' : '360'}^A0N,12,12^FD${addressText.split('\n')[0]}^FS
^FO30,${allergens && allergens.length > 0 ? '430' : '375'}^A0N,12,12^FD${addressText.split('\n')[1] || ''}^FS
` : ''}
${organizationDetails.foodSafetyRegistration ? `^FO30,${allergens && allergens.length > 0 ? '445' : '390'}^A0N,13,13^FDFood Safety Reg: ${organizationDetails.foodSafetyRegistration}^FS` : ''}
` : ''}

${labelId ? `^FO30,${
  organizationDetails?.foodSafetyRegistration ? 
    (allergens && allergens.length > 0 ? '465' : '410') : 
    (organizationDetails ? 
      (allergens && allergens.length > 0 ? '445' : '390') : 
      (allergens && allergens.length > 0 ? '390' : '335'))
}^A0N,11,11^FD#${labelId.substring(0, 8).toUpperCase()}^FS` : ''}

^FO480,${allergens && allergens.length > 0 ? '380' : '320'}^BQN,2,4^FDQA,${qrData}^FS

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
        socket.close();
        reject(new Error('Failed to connect to printer. Make sure Zebra Browser Print is running.'));
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        if (socket.readyState !== WebSocket.CLOSED) {
          socket.close();
          reject(new Error('Printer connection timeout'));
        }
      }, 5000);

    } catch (error) {
      console.error('Error setting up printer connection:', error);
      reject(error);
    }
  });
};

/**
 * Main function to print a label
 * Saves to database first, then sends to printer with labelId in QR code
 */
export const printLabel = async (data: LabelPrintData): Promise<{ success: boolean; labelId?: string; error?: string }> => {
  try {
    // 1. Save to database first to get the labelId
    const labelId = await saveLabelToDatabase(data);

    // 2. Generate ZPL with labelId included in QR code
    const dataWithLabelId = { ...data, labelId: labelId || undefined };
    const zpl = generateZPL(dataWithLabelId);

    // 3. Send to printer
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
