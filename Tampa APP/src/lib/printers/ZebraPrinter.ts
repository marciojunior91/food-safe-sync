// ZebraPrinter - Generate ZPL commands for Zebra thermal printers
// Updated to use unified BOPP design with labelId tracking
import { PrinterDriver, PrinterCapabilities, PrinterSettings, PrinterStatus } from '@/types/printer';
import { printLabel as printWithZebra, saveLabelToDatabase, type LabelPrintData } from '@/utils/zebraPrinter';
import { supabase } from '@/integrations/supabase/client';

interface LabelData {
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

export class ZebraPrinter implements PrinterDriver {
  type: 'zebra' = 'zebra';
  name: string;
  capabilities: PrinterCapabilities;
  private settings: PrinterSettings;
  private connected: boolean = false;

  constructor(name: string = 'Zebra Thermal', settings?: Partial<PrinterSettings>) {
    this.name = name;
    this.settings = {
      type: 'zebra',
      name,
      paperWidth: 102,
      paperHeight: 152,
      darkness: 20,
      speed: 4,
      ipAddress: '192.168.1.100',
      port: 9100,
      defaultQuantity: 1,
      ...settings
    };
    
    this.capabilities = {
      supportsZPL: true,
      supportsPDF: false,
      supportsColor: false,
      maxWidth: 812,
      maxHeight: 1218
    };
  }

  async connect(): Promise<boolean> {
    // In a real implementation, this would attempt to connect to the printer
    // For now, we'll just mark as connected if IP is provided
    if (this.settings.ipAddress) {
      this.connected = true;
      return true;
    }
    return false;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async print(labelData: any, testMode: boolean = import.meta.env.VITE_PRINTER_TEST_MODE === 'true'): Promise<boolean> {
    try {
      // Convert label data to LabelPrintData format
      const printData = await this.convertToLabelPrintData(labelData);
      
      // Use updated zebraPrinter.ts which includes:
      // 1. Save to database (get labelId)
      // 2. Generate ZPL with BOPP design
      // 3. Include labelId in QR code
      // testMode=true: Skip printer connection, only save to DB
      const result = await printWithZebra(printData, testMode);
      
      if (!result.success) {
        throw new Error(result.error || 'Print failed');
      }
      
      if (testMode) {
        console.log(`🧪 TEST MODE: Label saved to DB. LabelId: ${result.labelId}`);
        console.log('ZPL Preview:', result.zpl);
      } else {
        console.log(`Label printed successfully. LabelId: ${result.labelId}`);
      }
      
      return true;
    } catch (error) {
      console.error('ZPL generation error:', error);
      return false;
    }
  }

  async printBatch(labels: any[]): Promise<boolean> {
    try {
      // Print each label individually to ensure each gets its own labelId
      const results = await Promise.all(
        labels.map(label => this.print(label))
      );
      
      // Return true if all succeeded
      return results.every(result => result === true);
    } catch (error) {
      console.error('ZPL batch generation error:', error);
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
    // In a real implementation, query printer status via ZPL
    return {
      isReady: this.connected,
      paperOut: false,
      ribbonOut: false
    };
  }

  /**
   * Convert incoming label data to LabelPrintData format
   * Fetches missing data from Supabase if needed
   */
  private async convertToLabelPrintData(labelData: LabelData): Promise<LabelPrintData> {
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
    
    // ❌ REMOVED: Organization details fetch - No org data on labels per requirements
    // Labels should only contain product, preparer, and safety information
    
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
      // ❌ REMOVED: organizationDetails - No org data on labels
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

