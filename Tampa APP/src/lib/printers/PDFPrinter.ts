// PDFPrinter - Export labels to PDF using canvas renderer
// Updated to use unified BOPP design with labelId tracking
import { jsPDF } from 'jspdf';
import { PrinterDriver, PrinterCapabilities, PrinterSettings, PrinterStatus } from '@/types/printer';
import { renderPdfLabel } from '@/utils/labelRenderers/pdfRenderer';
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

export class PDFPrinter implements PrinterDriver {
  type: 'pdf' = 'pdf';
  name: string;
  capabilities: PrinterCapabilities;
  private settings: PrinterSettings;

  constructor(name: string = 'PDF Export', settings?: Partial<PrinterSettings>) {
    this.name = name;
    this.settings = {
      type: 'pdf',
      name,
      paperWidth: 102,
      paperHeight: 152,
      defaultQuantity: 1,
      ...settings
    };
    
    this.capabilities = {
      supportsZPL: false,
      supportsPDF: true,
      supportsColor: true,
      maxWidth: 210,
      maxHeight: 297
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
      const pdf = await this.createPDF([labelData]);
      const filename = `label_${labelData.productName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      pdf.save(filename);
      return true;
    } catch (error) {
      console.error('PDF generation error:', error);
      return false;
    }
  }

  async printBatch(labels: any[]): Promise<boolean> {
    try {
      const pdf = await this.createPDF(labels);
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`labels_batch_${timestamp}_${labels.length}items.pdf`);
      return true;
    } catch (error) {
      console.error('PDF batch generation error:', error);
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

  private async createPDF(labels: IncomingLabelData[]): Promise<jsPDF> {
    // A4 dimensions for PDF output
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    for (let index = 0; index < labels.length; index++) {
      if (index > 0) {
        pdf.addPage();
      }
      
      await this.renderLabel(pdf, labels[index]);
    }

    return pdf;
  }

  private async renderLabel(pdf: jsPDF, incomingData: IncomingLabelData): Promise<void> {
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
      
      // A4 dimensions in pixels at 96 DPI (scaled for canvas)
      const canvasWidth = 600;
      const canvasHeight = 848;
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Render label with updated BOPP design renderer (includes labelId in QR)
      await renderPdfLabel(ctx, labelData, canvasWidth, canvasHeight);
      
      // Step 4: Add canvas image to PDF
      const imgData = canvas.toDataURL('image/png');
      
      // Add image to fill A4 page
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      
      console.log(`PDF label rendered successfully. LabelId: ${labelId}`);
    } catch (error) {
      console.error('Error rendering PDF label:', error);
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
      
      console.log('🔍 PDFPrinter - Raw org data from DB:', orgData);
      
      if (orgData) {
        organizationDetails = {
          name: orgData.name,
          address: orgData.address || undefined, // Address is already a JSON string from DB
          phone: orgData.phone || undefined,
          email: orgData.email || undefined,
          foodSafetyRegistration: orgData.food_safety_registration || undefined,
        };
        console.log('🔍 PDFPrinter - Formatted organizationDetails:', organizationDetails);
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
