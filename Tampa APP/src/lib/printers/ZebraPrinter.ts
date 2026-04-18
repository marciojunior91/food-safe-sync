// ZebraPrinter - Generate ZPL commands for Zebra thermal printers
// Updated to support P1112640-017C wireless adapter (Bluetooth-to-TCP bridge)
// Connection flow: Web App → Print Server (HTTP) → Raw TCP → Printer
import { PrinterDriver, PrinterCapabilities, PrinterSettings, PrinterStatus } from '@/types/printer';
import { printLabel as printWithZebra, saveLabelToDatabase, type LabelPrintData } from '@/utils/zebraPrinter';
import { supabase } from '@/integrations/supabase/client';

// Default print server URL (local Node.js server that bridges HTTP→TCP)
const DEFAULT_PRINT_SERVER_URL = 'http://localhost:3001';

interface LabelData {
  productName: string;
  categoryName?: string;
  subcategoryName?: string;
  preparedDate?: string; // Legacy field name
  prepDate?: string;     // New field name
  useByDate?: string;    // Legacy field name
  expiryDate?: string;   // New field name
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
  private printServerUrl: string;
  private lastConnectionTest: { success: boolean; latencyMs?: number; error?: string; timestamp: string } | null = null;

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
    
    // Print server URL can be configured via settings or env
    this.printServerUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PRINT_SERVER_URL) 
      || DEFAULT_PRINT_SERVER_URL;
    
    this.capabilities = {
      supportsZPL: true,
      supportsPDF: false,
      supportsColor: false,
      maxWidth: 812,
      maxHeight: 1218
    };
  }

  /**
   * Connect to printer by testing the connection through the print server.
   * The print server must be running locally (npm start in print-server/).
   * 
   * Connection path:
   *   ZebraPrinter → HTTP → Print Server (localhost:3001) → Raw TCP → P1112640-017C adapter → Zebra ZD411
   */
  async connect(): Promise<boolean> {
    console.log('\n🔌 ============================================');
    console.log('🔌 ZEBRA PRINTER - CONNECTION TEST');
    console.log(`🔌 Print Server: ${this.printServerUrl}`);
    console.log(`🔌 Printer IP: ${this.settings.ipAddress}:${this.settings.port}`);
    console.log('🔌 ============================================\n');

    try {
      // Step 1: Check if print server is running
      console.log('📡 [Step 1] Checking print server health...');
      const healthResponse = await fetch(`${this.printServerUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      
      if (!healthResponse.ok) {
        throw new Error(`Print server returned status ${healthResponse.status}`);
      }
      
      const healthData = await healthResponse.json();
      console.log('✅ Print server is online:', healthData);

      // Step 2: Test TCP connection to actual printer via print server
      console.log(`\n📡 [Step 2] Testing TCP connection to printer at ${this.settings.ipAddress}:${this.settings.port}...`);
      const testUrl = `${this.printServerUrl}/test-connection?ip=${encodeURIComponent(this.settings.ipAddress || '')}&port=${this.settings.port || 9100}`;
      const testResponse = await fetch(testUrl, {
        signal: AbortSignal.timeout(10000),
      });
      
      const testData = await testResponse.json();
      this.lastConnectionTest = testData;
      
      if (testData.success) {
        this.connected = true;
        console.log(`✅ Printer connected! Latency: ${testData.latencyMs}ms`);
        console.log('🔌 ============================================\n');
        return true;
      } else {
        this.connected = false;
        console.error(`❌ Printer not reachable: ${testData.error}`);
        console.error('🔌 ============================================\n');
        return false;
      }

    } catch (error) {
      this.connected = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Provide helpful error messages
      if (errorMessage.includes('fetch') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Failed to fetch')) {
        console.error('❌ Print server is NOT running!');
        console.error('💡 Start it with: cd print-server && npm start');
        console.error('💡 The print server bridges HTTP→TCP for the P1112640-017C adapter');
      } else if (errorMessage.includes('timeout') || errorMessage.includes('TimeoutError')) {
        console.error('❌ Connection timed out');
        console.error('💡 Check that the printer is powered on and the P1112640-017C adapter LED is solid');
      } else {
        console.error('❌ Connection error:', errorMessage);
      }
      
      this.lastConnectionTest = {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
      
      console.error('🔌 ============================================\n');
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get the last connection test result (useful for UI diagnostics)
   */
  getLastConnectionTest() {
    return this.lastConnectionTest;
  }

  async print(labelData: any, testMode: boolean = false): Promise<boolean> {
    console.log('\n🖨️  ============================================');
    console.log('🖨️  ZEBRA PRINTER - PRINT REQUEST');
    console.log('🖨️  ============================================');
    console.log('📦 Input data:', JSON.stringify(labelData, null, 2));
    console.log('🧪 Test mode:', testMode);
    console.log(`🌐 Print server: ${this.printServerUrl}`);
    console.log(`🖨️  Printer IP: ${this.settings.ipAddress}:${this.settings.port}`);
    console.log('🖨️  ============================================\n');

    try {
      // Convert label data to LabelPrintData format
      console.log('🔄 Converting label data to LabelPrintData format...');
      const printData = await this.convertToLabelPrintData(labelData);
      console.log('✅ Conversion successful:', {
        productId: printData.productId,
        productName: printData.productName,
        organizationId: printData.organizationId,
        preparedBy: printData.preparedBy,
        preparedByName: printData.preparedByName,
      });
      
      if (testMode) {
        // TEST MODE: Save to DB + generate ZPL, skip actual printing
        console.log('🧪 TEST MODE: Using zebraPrinter utility (DB save + ZPL gen only)...');
        const result = await printWithZebra(printData, true);
        
        if (!result.success) {
          console.error('❌ Test mode failed:', result.error);
          throw new Error(result.error || 'Test mode failed');
        }
        
        console.log(`\n🧪 ============================================`);
        console.log(`🧪 TEST MODE: Label saved to DB`);
        console.log(`🧪 LabelId: ${result.labelId}`);
        console.log(`🧪 ZPL Length: ${result.zpl?.length || 0} chars`);
        console.log(`🧪 ============================================\n`);
        return true;
      }
      
      // PRODUCTION MODE: Try print server first (for P1112640-017C adapter)
      console.log('📡 Attempting to print via Print Server (TCP bridge)...');
      const printServerSuccess = await this.printViaPrintServer(printData);
      
      if (printServerSuccess) {
        console.log(`\n✅ ============================================`);
        console.log(`✅ Label printed via Print Server (TCP)!`);
        console.log(`✅ ============================================\n`);
        return true;
      }
      
      // FALLBACK: Try WebSocket (Zebra Browser Print app)
      console.log('⚠️  Print server failed, falling back to WebSocket (Zebra Browser Print)...');
      const result = await printWithZebra(printData, false);
      
      if (!result.success) {
        console.error('❌ Both print methods failed:', result.error);
        throw new Error(result.error || 'Print failed on all methods');
      }
      
      console.log(`\n✅ ============================================`);
      console.log(`✅ Label printed via WebSocket fallback`);
      console.log(`✅ LabelId: ${result.labelId}`);
      console.log(`✅ ============================================\n`);
      return true;
      
    } catch (error) {
      console.error('\n❌ ============================================');
      console.error('❌ ZPL PRINT ERROR');
      console.error('❌ ============================================');
      console.error('❌ Error:', error);
      console.error('❌ Message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('❌ ============================================\n');
      return false;
    }
  }

  /**
   * Print via the local print server (HTTP → TCP bridge)
   * This is the primary method for the P1112640-017C adapter
   */
  private async printViaPrintServer(data: LabelPrintData): Promise<boolean> {
    try {
      // Step 1: Save to database to get labelId
      console.log('💾 Saving label to database...');
      const labelId = data.labelId ?? await saveLabelToDatabase(data);
      if (!labelId) {
        throw new Error('Failed to save label to database');
      }
      console.log(`✅ Label saved, ID: ${labelId}`);

      // Step 2: Generate ZPL (import the generator from zebraPrinter utility)
      const dataWithLabelId = { ...data, labelId };
      
      // We need to generate ZPL - use printWithZebra in test mode to get ZPL string
      const genResult = await printWithZebra(dataWithLabelId, true);
      if (!genResult.success || !genResult.zpl) {
        throw new Error('Failed to generate ZPL code');
      }
      
      const zpl = genResult.zpl;
      console.log(`📝 ZPL generated (${zpl.length} chars)`);

      // Step 3: Send to print server
      const printQuantity = data.quantity ? parseInt(data.quantity) : 1;
      console.log(`📤 Sending to print server: ${this.printServerUrl}/print`);
      
      const response = await fetch(`${this.printServerUrl}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zpl,
          copies: isNaN(printQuantity) ? 1 : printQuantity,
          ip: this.settings.ipAddress,
          port: this.settings.port || 9100,
        }),
        signal: AbortSignal.timeout(15000),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Print server accepted job #${result.jobNumber}`);
        return true;
      } else {
        console.error('❌ Print server rejected job:', result.error);
        if (result.troubleshooting) {
          console.error('💡 Troubleshooting:', result.troubleshooting);
        }
        return false;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      
      if (msg.includes('fetch') || msg.includes('ECONNREFUSED') || msg.includes('Failed to fetch')) {
        console.warn('⚠️  Print server not running (cd print-server && npm start)');
      } else {
        console.error('❌ Print server error:', msg);
      }
      
      return false;
    }
  }

  /**
   * Print a test label to verify the connection works end-to-end
   */
  async printTestLabel(): Promise<{ success: boolean; error?: string }> {
    console.log('\n🧪 ============================================');
    console.log('🧪 PRINTING TEST LABEL');
    console.log(`🧪 Print Server: ${this.printServerUrl}`);
    console.log(`🧪 Printer: ${this.settings.ipAddress}:${this.settings.port}`);
    console.log('🧪 ============================================\n');

    try {
      const response = await fetch(`${this.printServerUrl}/print-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: this.settings.ipAddress,
          port: this.settings.port || 9100,
        }),
        signal: AbortSignal.timeout(15000),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Test label printed successfully!');
        return { success: true };
      } else {
        console.error('❌ Test label failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('❌ Test label error:', msg);
      return { success: false, error: msg };
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
    console.log('🔍 ============================================');
    console.log('🔍 CONVERTING LABEL DATA');
    console.log('🔍 ============================================');
    
    // Get current user and organization
    console.log('👤 Fetching current user...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('✅ User:', user?.id || 'No user logged in');
    
    let organizationId = labelData.organizationId;
    let preparedBy = labelData.preparedBy;
    let preparedByName = labelData.preparedByName;
    
    // Fetch organization and user info if not provided
    if (user && (!organizationId || !preparedBy)) {
      console.log('🔍 Fetching profile data from Supabase...');
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, display_name')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        console.log('✅ Profile found:', {
          organization_id: profile.organization_id,
          display_name: profile.display_name,
        });
        organizationId = organizationId || profile.organization_id;
        preparedBy = preparedBy || user.id;
        preparedByName = preparedByName || profile.display_name || 'Unknown';
      } else {
        console.warn('⚠️  No profile found for user');
      }
    }
    
    // Validation
    if (!organizationId) {
      console.error('❌ VALIDATION FAILED: Missing organization_id');
      throw new Error('Organization ID is required for printing');
    }
    
    if (!preparedBy || !preparedByName) {
      console.error('❌ VALIDATION FAILED: Missing prepared_by information');
      throw new Error('Prepared by information is required for printing');
    }
    
    console.log('✅ Validation passed:', {
      organizationId,
      preparedBy,
      preparedByName,
    });
    
    // Parse condition from storage instructions if not provided
    const condition = labelData.condition || 
                     labelData.storageInstructions || 
                     'Refrigerate';
    
    console.log('🏷️  Building LabelPrintData object...');
    
    // Build LabelPrintData object
    const printData: LabelPrintData = {
      labelId: labelData.labelId,
      productId: labelData.productId || null, // Use null instead of empty string for UUID field
      productName: labelData.productName,
      categoryId: labelData.categoryId || null,
      categoryName: labelData.categoryName || 'General',
      preparedBy,
      preparedByName,
      prepDate: labelData.prepDate || labelData.preparedDate,
      expiryDate: labelData.expiryDate || labelData.useByDate,
      condition,
      organizationId,
      quantity: labelData.quantity,
      unit: labelData.unit,
      batchNumber: labelData.batchNumber || labelData.barcode || '',
      allergens: labelData.allergens?.map((a: any) =>
        typeof a === 'string'
          ? { id: '', name: a, icon: null, severity: 'low' }
          : { id: a.id || '', name: a.name || '', icon: a.icon ?? null, severity: a.severity || 'low' }
      )
    };
    
    console.log('✅ LabelPrintData created successfully');
    console.log('🔍 ============================================\n');
    
    return printData;
  }
}

