// GenericPrinter - Uses browser's native print dialog
import { PrinterDriver, PrinterCapabilities, PrinterSettings, PrinterStatus } from '@/types/printer';

interface LabelData {
  productName: string;
  categoryName?: string;
  subcategoryName?: string;
  preparedDate: string;
  useByDate: string;
  allergens?: string[];
  storageInstructions?: string;
  barcode?: string;
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

      printWindow.document.write(this.generateHTML(labelData));
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

      const html = labels.map((label, index) => 
        this.generateHTML(label, true) + (index < labels.length - 1 ? '<div class="page-break"></div>' : '')
      ).join('');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              @page { size: ${this.settings.paperWidth}mm ${this.settings.paperHeight}mm; margin: 0; }
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
              .page-break { page-break-after: always; }
            </style>
          </head>
          <body>${html}</body>
        </html>
      `);
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

  private generateHTML(labelData: LabelData, inBatch: boolean = false): string {
    const { paperWidth, paperHeight } = this.settings;
    
    const wrapper = inBatch ? '' : `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page { size: ${paperWidth}mm ${paperHeight}mm; margin: 5mm; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
    `;
    
    const closeWrapper = inBatch ? '' : `
        </body>
      </html>
    `;
    
    return `
      ${wrapper}
      <div style="width: ${paperWidth - 10}mm; height: ${paperHeight - 10}mm; padding: 5mm; box-sizing: border-box;">
        <h1 style="font-size: 24px; margin: 0 0 10px 0; font-weight: bold;">${labelData.productName}</h1>
        
        ${labelData.categoryName ? `<p style="font-size: 12px; margin: 5px 0;"><strong>Category:</strong> ${labelData.categoryName}</p>` : ''}
        ${labelData.subcategoryName ? `<p style="font-size: 12px; margin: 5px 0;"><strong>Subcategory:</strong> ${labelData.subcategoryName}</p>` : ''}
        
        <p style="font-size: 14px; margin: 10px 0;"><strong>Prepared:</strong> ${labelData.preparedDate}</p>
        <p style="font-size: 16px; margin: 10px 0; font-weight: bold; background: #fff3cd; padding: 5px; border-radius: 3px;"><strong>Use By:</strong> ${labelData.useByDate}</p>
        
        ${labelData.allergens && labelData.allergens.length > 0 ? 
          `<p style="font-size: 11px; margin: 10px 0; color: #dc3545; background: #f8d7da; padding: 5px; border-radius: 3px;"><strong>⚠️ Allergens:</strong> ${labelData.allergens.join(', ')}</p>` : 
          ''
        }
        
        ${labelData.storageInstructions ? 
          `<p style="font-size: 10px; margin: 10px 0; color: #495057;">${labelData.storageInstructions}</p>` : 
          ''
        }
        
        ${labelData.barcode ? 
          `<p style="font-size: 10px; margin: 10px 0; font-family: monospace;"><strong>Barcode:</strong> ${labelData.barcode}</p>` : 
          ''
        }
      </div>
      ${closeWrapper}
    `;
  }
}
