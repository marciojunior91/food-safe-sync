import { supabase } from "@/integrations/supabase/client";

export interface LabelPrintData {
  productId: string;
  productName: string;
  categoryId: string | null;
  categoryName: string;
  preparedBy: string;
  preparedByName: string;
  prepDate: string;
  expiryDate: string;
  condition: string;
  quantity?: string;
  unit?: string;
  qrCodeData?: string;
  batchNumber: string;
}

/**
 * Generate ZPL code from label data
 */
const generateZPL = (data: LabelPrintData): string => {
  const { productName, categoryName, condition, prepDate, expiryDate, preparedByName, quantity, unit } = data;
  
  // Generate QR Code data (can be a URL or product identifier)
  const qrData = `PRODUCT:${productName}|PREP:${prepDate}|EXP:${expiryDate}`;
  
  // ZPL Command to generate the label
  // ^XA - Start Format
  // ^FO - Field Origin (x, y coordinates)
  // ^A0N - Font (0=default, N=normal, size, size)
  // ^FD - Field Data
  // ^FS - Field Separator
  // ^BQ - QR Code
  // ^XZ - End Format
  
  const zpl = `
^XA
^FO50,30^A0N,40,40^FD${productName}^FS
^FO50,80^A0N,25,25^FDCategory: ${categoryName}^FS
^FO50,115^A0N,25,25^FDCondition: ${condition}^FS
^FO50,150^A0N,25,25^FDPrep: ${prepDate}^FS
^FO50,185^A0N,25,25^FDExpiry: ${expiryDate}^FS
^FO50,220^A0N,25,25^FDBy: ${preparedByName}^FS
${quantity ? `^FO50,255^A0N,25,25^FDQty: ${quantity} ${unit || ''}^FS` : ''}
^FO450,50^BQN,2,6^FDQA,${qrData}^FS
^XZ
`;

  return zpl;
};

/**
 * Save printed label to database history
 */
const saveLabelToDatabase = async (data: LabelPrintData): Promise<string | null> => {
  try {
    const { data: insertedData, error } = await supabase
      .from("printed_labels")
      .insert({
        product_id: data.productId,
        product_name: data.productName,
        category_id: data.categoryId,
        category_name: data.categoryName,
        prepared_by: data.preparedBy,
        prepared_by_name: data.preparedByName,
        prep_date: data.prepDate,
        expiry_date: data.expiryDate,
        condition: data.condition,
        quantity: data.quantity || null,
        unit: data.unit || null,
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
 * Saves to database first, then sends to printer
 */
export const printLabel = async (data: LabelPrintData): Promise<{ success: boolean; labelId?: string; error?: string }> => {
  try {
    // 1. Save to database first
    const labelId = await saveLabelToDatabase(data);

    // 2. Generate ZPL
    const zpl = generateZPL(data);

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
