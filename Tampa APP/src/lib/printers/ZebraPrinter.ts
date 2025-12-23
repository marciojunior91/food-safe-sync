// ZebraPrinter - Generate ZPL commands for Zebra thermal printers
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

  async print(labelData: any): Promise<boolean> {
    try {
      const zpl = this.generateZPL(labelData);
      
      if (this.connected && this.settings.ipAddress) {
        // In a real implementation, send ZPL to printer via IP
        // For now, we'll download the ZPL file
        this.downloadZPL(zpl, `label_${labelData.productName.replace(/\s+/g, '_')}.zpl`);
      } else {
        // Download ZPL file for manual printing
        this.downloadZPL(zpl, `label_${labelData.productName.replace(/\s+/g, '_')}.zpl`);
      }
      
      return true;
    } catch (error) {
      console.error('ZPL generation error:', error);
      return false;
    }
  }

  async printBatch(labels: any[]): Promise<boolean> {
    try {
      const zplCommands = labels.map(label => this.generateZPL(label)).join('\n');
      
      if (this.connected && this.settings.ipAddress) {
        // In a real implementation, send batch to printer
        this.downloadZPL(zplCommands, `labels_batch_${labels.length}items.zpl`);
      } else {
        this.downloadZPL(zplCommands, `labels_batch_${labels.length}items.zpl`);
      }
      
      return true;
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

  private generateZPL(label: LabelData): string {
    const dpmm = 8; // 203 DPI = 8 dots per mm
    const width = Math.floor(this.settings.paperWidth * dpmm);
    const height = Math.floor(this.settings.paperHeight * dpmm);
    
    let zpl = '^XA\n'; // Start format
    
    // Set label home position
    zpl += '^LH0,0\n';
    
    // Set print speed and darkness
    zpl += `^PR${this.settings.speed || 4}\n`;
    zpl += `^MD${this.settings.darkness || 20}\n`;
    
    // Set label dimensions
    zpl += `^PW${width}\n`;
    zpl += `^LL${height}\n`;
    
    let y = 30;
    
    // Product Name (Large, Bold)
    zpl += `^FO50,${y}^A0N,60,60^FD${this.escapeZPL(label.productName)}^FS\n`;
    y += 80;
    
    // Category
    if (label.categoryName) {
      zpl += `^FO50,${y}^A0N,25,25^FDCategory: ${this.escapeZPL(label.categoryName)}^FS\n`;
      y += 35;
    }
    
    // Subcategory
    if (label.subcategoryName) {
      zpl += `^FO50,${y}^A0N,25,25^FDSubcategory: ${this.escapeZPL(label.subcategoryName)}^FS\n`;
      y += 35;
    }
    
    y += 10;
    
    // Prepared Date
    zpl += `^FO50,${y}^A0N,30,30^FDPrepared: ${label.preparedDate}^FS\n`;
    y += 50;
    
    // Use By Date (Larger, Boxed)
    zpl += `^FO40,${y}^GB${width - 80},60,3^FS\n`; // Box
    zpl += `^FO50,${y + 10}^A0N,40,40^FDUse By: ${label.useByDate}^FS\n`;
    y += 80;
    
    // Allergens
    if (label.allergens && label.allergens.length > 0) {
      zpl += `^FO50,${y}^A0N,25,25^FD** Allergens: ${this.escapeZPL(label.allergens.join(', '))}^FS\n`;
      y += 35;
    }
    
    // Storage Instructions (smaller text, wrapped)
    if (label.storageInstructions) {
      const wrapped = this.wrapText(label.storageInstructions, 50);
      wrapped.forEach(line => {
        zpl += `^FO50,${y}^A0N,20,20^FD${this.escapeZPL(line)}^FS\n`;
        y += 25;
      });
    }
    
    // Barcode (Code 128)
    if (label.barcode) {
      y += 10;
      zpl += `^FO50,${y}^BCN,80,Y,N,N^FD${label.barcode}^FS\n`;
      y += 100;
      zpl += `^FO50,${y}^A0N,20,20^FD${label.barcode}^FS\n`;
    }
    
    zpl += '^XZ\n'; // End format
    
    return zpl;
  }

  private escapeZPL(text: string): string {
    // Escape special ZPL characters
    return text
      .replace(/\^/g, '\\^')
      .replace(/~/g, '\\~')
      .replace(/\\/g, '\\\\');
  }

  private wrapText(text: string, maxLength: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    
    return lines;
  }

  private downloadZPL(zpl: string, filename: string): void {
    const blob = new Blob([zpl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
