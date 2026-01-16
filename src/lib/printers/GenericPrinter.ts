// GenericPrinter - Uses browser's native print dialog with canvas rendering
// Updated to use unified BOPP design with labelId tracking
import { PrinterDriver, PrinterCapabilities, PrinterSettings, PrinterStatus } from '@/types/printer';
import { renderGenericLabel } from '@/utils/labelRenderers/genericRenderer';
import { saveLabelToDatabase, type LabelPrintData } from '@/utils/zebraPrinter';
import { supabase } from '@/integrations/supabase/client';
import type { LabelData } from '@/components/labels/LabelForm';

interface IncomingLabelData {
  productName: string;
  categoryName?: string;
  subcategoryName?: string;
  preparedDate: string;
  useByDate: string;
  allergens?: string[];
  storageInstructions?: string;
  barcode?: string;
  preparedBy?: string;
  preparedByName?: string;
  productId?: string;
  categoryId?: string;
  quantity?: string;
  unit?: string;
  condition?: string;
  organizationId?: string;
}

export class GenericPrinter implements PrinterDriver {
  type: 'generic' = 'generic';
  name: string;
  capabilities: PrinterCapabilities;
  private settings: PrinterSettings;

  constructor(name: string = 'Browser Print', settings?: Partial<PrinterSettings>) {
    this.name = name;
    this.settings = {
      type: 'generic',
      name,
      paperWidth: 102,
      paperHeight: 152,
      defaultQuantity: 1,
      ...settings
    };
    
    this.capabilities = {
      supportsZPL: false,
      supportsPDF: false,
      supportsColor: true,
      maxWidth: 1000,
      maxHeight: 1500
    };
  }

  async connect(): Promise<boolean> {
    return true;
  }

  async disconnect(): Promise<void> {
    // No-op
  }

  isConnected(): boolean {
    return true;
  }

  async print(labelData: any): Promise<boolean> {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked - please allow popups for printing');
      }

      const html = await this.generateHTML(labelData);
      printWindow.document.write(html);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
        // Close after printing
        setTimeout(() => printWindow.close(), 100);
      };
      
      return true;
    } catch (error) {
      console.error('Browser print error:', error);
      return false;
    }
  }

  async printBatch(labels: any[]): Promise<boolean> {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked - please allow popups for printing');
      }

      const htmlParts = await Promise.all(
        labels.map(async (label, index) => {
          const html = await this.generateHTML(label, true);
          return html + (index < labels.length - 1 ? '<div class="page-break"></div>' : '');
        })
      );
      
      const fullHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              @page { size: ${this.settings.paperWidth}mm ${this.settings.paperHeight}mm; margin: 0; }
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
              .page-break { page-break-after: always; }
            </style>
          </head>
          <body>${htmlParts.join('')}</body>
        </html>
      `;
      
      printWindow.document.write(fullHTML);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 100);
      };
      
      return true;
    } catch (error) {
      console.error('Browser batch print error:', error);
      return false;
    }
  }

  getSettings(): PrinterSettings {
    return { ...this.settings };
  }

  async updateSettings(settings: Partial<PrinterSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
  }

  async getStatus(): Promise<PrinterStatus> {
    return {
      isReady: true,
      paperOut: false
    };
  }

  private async generateHTML(incomingData: IncomingLabelData, inBatch: boolean = false): Promise<string> {
    try {
      // Step 1: Convert incoming data to LabelPrintData and save to database
      const printData = await this.convertToLabelPrintData(incomingData);
      const labelId = await saveLabelToDatabase(printData);
      
      // Step 2: Convert to LabelData format with labelId
      const labelData: LabelData = {
        labelId: labelId || undefined,
        categoryId: printData.categoryId || '',
        categoryName: printData.categoryName,
        subcategoryId: undefined,
        subcategoryName: incomingData.subcategoryName,
        productId: printData.productId,
        productName: printData.productName,
        condition: printData.condition,
        preparedBy: printData.preparedBy,
        preparedByName: printData.preparedByName,
        prepDate: printData.prepDate,
        expiryDate: printData.expiryDate,
        quantity: printData.quantity || '',
        unit: printData.unit || '',
        batchNumber: printData.batchNumber,
        allergens: printData.allergens,
        organizationDetails: printData.organizationDetails // ✅ Pass organization details to renderer
      };
      
      // Step 3: Create canvas and render with BOPP design
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      // Label dimensions - A4 proportions for PDF output (matches pdfRenderer)
      const canvasWidth = 600;
      const canvasHeight = 848;
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Render label with updated BOPP design renderer (includes labelId in QR)
      await renderGenericLabel(ctx, labelData, canvasWidth, canvasHeight);
      
      // Step 4: Convert canvas to image data URL
      const imgData = canvas.toDataURL('image/png');
      
      // Step 5: Generate HTML with image
      const { paperWidth, paperHeight } = this.settings;
      
      const wrapper = inBatch ? '' : `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              @page { size: ${paperWidth}mm ${paperHeight}mm; margin: 0; }
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
              img { width: 100%; height: 100%; object-fit: contain; }
            </style>
          </head>
          <body>
      `;
      
      const closeWrapper = inBatch ? '' : `
          </body>
        </html>
      `;
      
      console.log(`Generic label rendered successfully. LabelId: ${labelId}`);
      
      return `
        ${wrapper}
        <div style="width: ${paperWidth}mm; height: ${paperHeight}mm; display: flex; align-items: center; justify-content: center;">
          <img src="${imgData}" alt="Label: ${labelData.productName}" />
        </div>
        ${closeWrapper}
      `;
    } catch (error) {
      console.error('Error generating HTML for generic printer:', error);
      throw error;
    }
  }

  /**
   * Convert incoming label data to LabelPrintData format
   * Fetches missing data from Supabase if needed
   */
  private async convertToLabelPrintData(labelData: IncomingLabelData): Promise<LabelPrintData> {
    // Get current user and organization
    const { data: { user } } = await supabase.auth.getUser();
    
    let organizationId = labelData.organizationId;
    let preparedBy = labelData.preparedBy;
    let preparedByName = labelData.preparedByName;
    
    // Fetch organization and user info if not provided
    if (user && (!organizationId || !preparedBy)) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, display_name')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        organizationId = organizationId || profile.organization_id;
        preparedBy = preparedBy || user.id;
        preparedByName = preparedByName || profile.display_name || 'Unknown';
      }
    }
    
    if (!organizationId) {
      throw new Error('Organization ID is required for printing');
    }
    
    if (!preparedBy || !preparedByName) {
      throw new Error('Prepared by information is required for printing');
    }
    
    // Fetch organization details for label footer
    let organizationDetails;
    try {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name, address, phone, email, food_safety_registration')
        .eq('id', organizationId)
        .single();
      
      if (orgData) {
        organizationDetails = {
          name: orgData.name,
          address: orgData.address || undefined, // Address is already a JSON string from DB
          phone: orgData.phone || undefined,
          email: orgData.email || undefined,
          foodSafetyRegistration: orgData.food_safety_registration || undefined,
        };
      }
    } catch (error) {
      console.warn('Could not fetch organization details:', error);
    }
    
    // Parse condition from storage instructions if not provided
    const condition = labelData.condition || 
                     labelData.storageInstructions || 
                     'Refrigerate';
    
    // Build LabelPrintData object
    const printData: LabelPrintData = {
      productId: labelData.productId || null, // Use null instead of empty string for UUID field
      productName: labelData.productName,
      categoryId: labelData.categoryId || null,
      categoryName: labelData.categoryName || 'General',
      preparedBy,
      preparedByName,
      prepDate: labelData.preparedDate,
      expiryDate: labelData.useByDate,
      condition,
      organizationId,
      organizationDetails, // Add organization details for professional footer
      quantity: labelData.quantity,
      unit: labelData.unit,
      batchNumber: labelData.barcode || '',
      allergens: labelData.allergens?.map(name => ({
        id: '',
        name: typeof name === 'string' ? name : (name as any).name || '',
        icon: null,
        severity: 'low'
      }))
    };
    
    return printData;
  }
}
