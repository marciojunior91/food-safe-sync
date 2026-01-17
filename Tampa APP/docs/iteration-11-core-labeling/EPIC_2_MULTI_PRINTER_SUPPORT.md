# Epic 2: Multi-Printer Support Foundation 🖨️

**Timeline**: Days 3-7 (5 days)  
**Status**: 🟡 Starting  
**Priority**: High (enables different hardware support)

---

## 🎯 Objectives

Enable the Tampa APP to support multiple printer types with a clean abstraction layer:
1. **Zebra Thermal Printers** - Direct ZPL commands
2. **PDF Export** - Save labels as PDFs for any printer
3. **Generic Printers** - Browser print dialog for standard printers

---

## 📋 Task Breakdown

### Task 2.1: Create PrinterDriver Interface (1 hour)
**File**: `src/types/printer.ts`

Define the contract that all printer implementations must follow.

```typescript
export type PrinterType = 'zebra' | 'pdf' | 'generic';

export interface PrinterCapabilities {
  supportsZPL: boolean;
  supportsPDF: boolean;
  supportsColor: boolean;
  maxWidth: number; // in dots or mm
  maxHeight: number;
}

export interface PrintJob {
  id: string;
  labelData: LabelData;
  timestamp: Date;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  error?: string;
}

export interface PrinterDriver {
  // Printer identity
  type: PrinterType;
  name: string;
  capabilities: PrinterCapabilities;
  
  // Core methods
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Printing
  print(labelData: LabelData): Promise<boolean>;
  printBatch(labels: LabelData[]): Promise<boolean>;
  
  // Configuration
  getSettings(): PrinterSettings;
  updateSettings(settings: Partial<PrinterSettings>): Promise<void>;
  
  // Status
  getStatus(): Promise<PrinterStatus>;
}

export interface PrinterSettings {
  type: PrinterType;
  name: string;
  ipAddress?: string; // For network Zebra printers
  port?: number;
  paperWidth: number; // in mm
  paperHeight: number;
  darkness?: number; // 0-30 for Zebra
  speed?: number; // Print speed
  defaultQuantity: number;
}

export interface PrinterStatus {
  isReady: boolean;
  paperOut: boolean;
  ribbonOut?: boolean;
  error?: string;
  temperature?: number;
}
```

---

### Task 2.2: Implement ZebraPrinter Class (3 hours)
**File**: `src/lib/printers/ZebraPrinter.ts`

Zebra thermal printers using ZPL (Zebra Programming Language).

```typescript
import { PrinterDriver, PrinterCapabilities, PrinterSettings, PrinterStatus } from '@/types/printer';
import { LabelData } from '@/types/labels';

export class ZebraPrinter implements PrinterDriver {
  type: 'zebra' = 'zebra';
  name: string;
  capabilities: PrinterCapabilities;
  private settings: PrinterSettings;
  private connected: boolean = false;

  constructor(name: string, settings?: Partial<PrinterSettings>) {
    this.name = name;
    this.settings = {
      type: 'zebra',
      name,
      paperWidth: 102, // 4 inches = 102mm
      paperHeight: 152, // 6 inches = 152mm
      darkness: 20,
      speed: 4,
      defaultQuantity: 1,
      ...settings
    };
    
    this.capabilities = {
      supportsZPL: true,
      supportsPDF: false,
      supportsColor: false,
      maxWidth: 812, // 4 inches at 203 DPI
      maxHeight: 1218 // 6 inches at 203 DPI
    };
  }

  async connect(): Promise<boolean> {
    // For browser-based printing, we can't directly connect to USB/Network
    // Instead, we'll use browser print or a print server
    this.connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async print(labelData: LabelData): Promise<boolean> {
    try {
      const zpl = this.generateZPL(labelData);
      await this.sendZPL(zpl);
      return true;
    } catch (error) {
      console.error('Zebra print error:', error);
      return false;
    }
  }

  async printBatch(labels: LabelData[]): Promise<boolean> {
    try {
      for (const label of labels) {
        await this.print(label);
      }
      return true;
    } catch (error) {
      console.error('Zebra batch print error:', error);
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
    // Basic status - can be enhanced with actual printer communication
    return {
      isReady: this.connected,
      paperOut: false,
      ribbonOut: false
    };
  }

  // ZPL Generation
  private generateZPL(labelData: LabelData): string {
    const { paperWidth, paperHeight, darkness } = this.settings;
    
    let zpl = '^XA\n'; // Start format
    
    // Set darkness
    zpl += `^MD${darkness}\n`;
    
    // Product name (large, bold)
    zpl += '^CF0,60\n';
    zpl += `^FO50,50^FD${labelData.productName}^FS\n`;
    
    // Category & Subcategory with emojis (if supported)
    zpl += '^CF0,30\n';
    if (labelData.categoryName) {
      zpl += `^FO50,130^FD${labelData.categoryName}^FS\n`;
    }
    if (labelData.subcategoryName) {
      zpl += `^FO50,170^FD${labelData.subcategoryName}^FS\n`;
    }
    
    // Prepared date
    zpl += '^CF0,40\n';
    zpl += `^FO50,220^FDPrepared: ${labelData.preparedDate}^FS\n`;
    
    // Use by date (highlighted)
    zpl += '^CF0,50\n';
    zpl += `^FO50,280^FDUse By: ${labelData.useByDate}^FS\n`;
    
    // Allergens (if any)
    if (labelData.allergens && labelData.allergens.length > 0) {
      zpl += '^CF0,25\n';
      zpl += `^FO50,350^FDAllergens: ${labelData.allergens.join(', ')}^FS\n`;
    }
    
    // Storage instructions
    if (labelData.storageInstructions) {
      zpl += '^CF0,25\n';
      zpl += `^FO50,390^FD${labelData.storageInstructions}^FS\n`;
    }
    
    // Barcode (if product has barcode)
    if (labelData.barcode) {
      zpl += `^FO50,450^BY3^BCN,100,Y,N,N^FD${labelData.barcode}^FS\n`;
    }
    
    zpl += '^XZ\n'; // End format
    
    return zpl;
  }

  private async sendZPL(zpl: string): Promise<void> {
    // Option 1: Direct to Zebra printer via browser extension
    // Option 2: Send to print server endpoint
    // Option 3: Download ZPL file for manual printing
    
    if (this.settings.ipAddress) {
      // Send to network printer
      await this.sendToNetworkPrinter(zpl);
    } else {
      // Download as ZPL file
      this.downloadZPL(zpl);
    }
  }

  private async sendToNetworkPrinter(zpl: string): Promise<void> {
    // Implement network printing via print server
    // This would require a backend endpoint
    const response = await fetch('/api/print/zebra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        printerIP: this.settings.ipAddress,
        port: this.settings.port || 9100,
        zpl
      })
    });
    
    if (!response.ok) {
      throw new Error('Network print failed');
    }
  }

  private downloadZPL(zpl: string): void {
    const blob = new Blob([zpl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `label_${Date.now()}.zpl`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

---

### Task 2.3: Implement PDFPrinter Class (2 hours)
**File**: `src/lib/printers/PDFPrinter.ts`

Generate PDF labels that can be printed on any printer.

```typescript
import { PrinterDriver, PrinterCapabilities, PrinterSettings, PrinterStatus } from '@/types/printer';
import { LabelData } from '@/types/labels';
import jsPDF from 'jspdf';

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
      paperWidth: 102, // 4 inches
      paperHeight: 152, // 6 inches
      defaultQuantity: 1,
      ...settings
    };
    
    this.capabilities = {
      supportsZPL: false,
      supportsPDF: true,
      supportsColor: true,
      maxWidth: 1000,
      maxHeight: 1500
    };
  }

  async connect(): Promise<boolean> {
    return true; // PDF always "connected"
  }

  async disconnect(): Promise<void> {
    // No-op for PDF
  }

  isConnected(): boolean {
    return true;
  }

  async print(labelData: LabelData): Promise<boolean> {
    try {
      const pdf = this.generatePDF([labelData]);
      pdf.save(`label_${labelData.productName}_${Date.now()}.pdf`);
      return true;
    } catch (error) {
      console.error('PDF generation error:', error);
      return false;
    }
  }

  async printBatch(labels: LabelData[]): Promise<boolean> {
    try {
      const pdf = this.generatePDF(labels);
      pdf.save(`labels_batch_${Date.now()}.pdf`);
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

  private generatePDF(labels: LabelData[]): jsPDF {
    const { paperWidth, paperHeight } = this.settings;
    
    // Create PDF with label dimensions
    const pdf = new jsPDF({
      orientation: paperHeight > paperWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: [paperWidth, paperHeight]
    });

    labels.forEach((labelData, index) => {
      if (index > 0) {
        pdf.addPage();
      }

      let y = 10;
      
      // Product name (large)
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(labelData.productName, 10, y);
      y += 12;
      
      // Category & Subcategory with emojis
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      if (labelData.categoryName) {
        pdf.text(`Category: ${labelData.categoryName}`, 10, y);
        y += 7;
      }
      if (labelData.subcategoryName) {
        pdf.text(`Subcategory: ${labelData.subcategoryName}`, 10, y);
        y += 7;
      }
      
      y += 5;
      
      // Prepared date
      pdf.setFontSize(14);
      pdf.text(`Prepared: ${labelData.preparedDate}`, 10, y);
      y += 10;
      
      // Use by date (highlighted)
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Use By: ${labelData.useByDate}`, 10, y);
      pdf.setFont('helvetica', 'normal');
      y += 12;
      
      // Allergens
      if (labelData.allergens && labelData.allergens.length > 0) {
        pdf.setFontSize(10);
        pdf.setTextColor(255, 0, 0); // Red
        pdf.text(`Allergens: ${labelData.allergens.join(', ')}`, 10, y);
        pdf.setTextColor(0, 0, 0); // Reset to black
        y += 7;
      }
      
      // Storage instructions
      if (labelData.storageInstructions) {
        pdf.setFontSize(10);
        pdf.text(labelData.storageInstructions, 10, y);
        y += 7;
      }
      
      // Barcode (if available)
      if (labelData.barcode) {
        // Add barcode (would need barcode library)
        pdf.setFontSize(10);
        pdf.text(`Barcode: ${labelData.barcode}`, 10, y);
      }
    });

    return pdf;
  }
}
```

---

### Task 2.4: Implement GenericPrinter Class (1 hour)
**File**: `src/lib/printers/GenericPrinter.ts`

Use browser's native print dialog for standard printers.

```typescript
import { PrinterDriver, PrinterCapabilities, PrinterSettings, PrinterStatus } from '@/types/printer';
import { LabelData } from '@/types/labels';

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

  async print(labelData: LabelData): Promise<boolean> {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked');
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

  async printBatch(labels: LabelData[]): Promise<boolean> {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked');
      }

      const html = labels.map(label => this.generateHTML(label, true)).join('<div class="page-break"></div>');
      
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

  async getStatus(): PrinterStatus {
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
      <div style="width: ${paperWidth - 10}mm; height: ${paperHeight - 10}mm; padding: 5mm;">
        <h1 style="font-size: 24px; margin: 0 0 10px 0;">${labelData.productName}</h1>
        
        ${labelData.categoryName ? `<p style="font-size: 12px; margin: 5px 0;"><strong>Category:</strong> ${labelData.categoryName}</p>` : ''}
        ${labelData.subcategoryName ? `<p style="font-size: 12px; margin: 5px 0;"><strong>Subcategory:</strong> ${labelData.subcategoryName}</p>` : ''}
        
        <p style="font-size: 14px; margin: 10px 0;"><strong>Prepared:</strong> ${labelData.preparedDate}</p>
        <p style="font-size: 16px; margin: 10px 0; font-weight: bold;"><strong>Use By:</strong> ${labelData.useByDate}</p>
        
        ${labelData.allergens && labelData.allergens.length > 0 ? 
          `<p style="font-size: 11px; margin: 10px 0; color: red;"><strong>Allergens:</strong> ${labelData.allergens.join(', ')}</p>` : 
          ''
        }
        
        ${labelData.storageInstructions ? 
          `<p style="font-size: 10px; margin: 10px 0;">${labelData.storageInstructions}</p>` : 
          ''
        }
        
        ${labelData.barcode ? 
          `<p style="font-size: 10px; margin: 10px 0;"><strong>Barcode:</strong> ${labelData.barcode}</p>` : 
          ''
        }
      </div>
      ${closeWrapper}
    `;
  }
}
```

---

### Task 2.5: Create Printer Factory (30 minutes)
**File**: `src/lib/printers/PrinterFactory.ts`

Factory to create printer instances.

```typescript
import { PrinterDriver, PrinterType, PrinterSettings } from '@/types/printer';
import { ZebraPrinter } from './ZebraPrinter';
import { PDFPrinter } from './PDFPrinter';
import { GenericPrinter } from './GenericPrinter';

export class PrinterFactory {
  static createPrinter(type: PrinterType, settings?: Partial<PrinterSettings>): PrinterDriver {
    switch (type) {
      case 'zebra':
        return new ZebraPrinter('Zebra Thermal Printer', settings);
      case 'pdf':
        return new PDFPrinter('PDF Export', settings);
      case 'generic':
        return new GenericPrinter('Browser Print', settings);
      default:
        throw new Error(`Unknown printer type: ${type}`);
    }
  }

  static getAvailablePrinters(): Array<{ type: PrinterType; name: string; description: string }> {
    return [
      {
        type: 'zebra',
        name: 'Zebra Thermal Printer',
        description: 'Direct thermal printing with ZPL commands'
      },
      {
        type: 'pdf',
        name: 'PDF Export',
        description: 'Save labels as PDF files'
      },
      {
        type: 'generic',
        name: 'Browser Print',
        description: 'Print using browser print dialog'
      }
    ];
  }
}
```

---

### Task 2.6: Create Printer Settings UI (3 hours)
**File**: `src/components/settings/PrinterSettings.tsx`

UI for selecting and configuring printers.

```typescript
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Printer, Save, Settings as SettingsIcon } from 'lucide-react';
import { PrinterFactory } from '@/lib/printers/PrinterFactory';
import { PrinterType, PrinterSettings as PrinterSettingsType } from '@/types/printer';
import { useToast } from '@/hooks/use-toast';

export function PrinterSettings() {
  const [printerType, setPrinterType] = useState<PrinterType>('generic');
  const [settings, setSettings] = useState<PrinterSettingsType>({
    type: 'generic',
    name: 'Browser Print',
    paperWidth: 102,
    paperHeight: 152,
    defaultQuantity: 1
  });
  const { toast } = useToast();

  // Load saved settings
  useEffect(() => {
    const saved = localStorage.getItem('printerSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setPrinterType(parsed.type);
      setSettings(parsed);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('printerSettings', JSON.stringify(settings));
    toast({
      title: 'Settings Saved',
      description: 'Printer settings have been saved successfully.'
    });
  };

  const handleTypeChange = (type: PrinterType) => {
    setPrinterType(type);
    setSettings(prev => ({ ...prev, type }));
  };

  const availablePrinters = PrinterFactory.getAvailablePrinters();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="w-5 h-5" />
          Printer Settings
        </CardTitle>
        <CardDescription>
          Configure your label printer preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Printer Type Selection */}
        <div className="space-y-2">
          <Label>Printer Type</Label>
          <Select value={printerType} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availablePrinters.map(printer => (
                <SelectItem key={printer.type} value={printer.type}>
                  <div>
                    <div className="font-medium">{printer.name}</div>
                    <div className="text-xs text-muted-foreground">{printer.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Paper Size */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="paperWidth">Paper Width (mm)</Label>
            <Input
              id="paperWidth"
              type="number"
              value={settings.paperWidth}
              onChange={e => setSettings(prev => ({ ...prev, paperWidth: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paperHeight">Paper Height (mm)</Label>
            <Input
              id="paperHeight"
              type="number"
              value={settings.paperHeight}
              onChange={e => setSettings(prev => ({ ...prev, paperHeight: Number(e.target.value) }))}
            />
          </div>
        </div>

        {/* Zebra-specific settings */}
        {printerType === 'zebra' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="ipAddress">Printer IP Address (optional)</Label>
              <Input
                id="ipAddress"
                placeholder="192.168.1.100"
                value={settings.ipAddress || ''}
                onChange={e => setSettings(prev => ({ ...prev, ipAddress: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="darkness">Darkness (0-30)</Label>
                <Input
                  id="darkness"
                  type="number"
                  min="0"
                  max="30"
                  value={settings.darkness || 20}
                  onChange={e => setSettings(prev => ({ ...prev, darkness: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="speed">Print Speed</Label>
                <Input
                  id="speed"
                  type="number"
                  min="1"
                  max="14"
                  value={settings.speed || 4}
                  onChange={e => setSettings(prev => ({ ...prev, speed: Number(e.target.value) }))}
                />
              </div>
            </div>
          </>
        )}

        {/* Default Quantity */}
        <div className="space-y-2">
          <Label htmlFor="defaultQuantity">Default Quantity</Label>
          <Input
            id="defaultQuantity"
            type="number"
            min="1"
            value={settings.defaultQuantity}
            onChange={e => setSettings(prev => ({ ...prev, defaultQuantity: Number(e.target.value) }))}
          />
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

### Task 2.7: Create usePrinter Hook (1 hour)
**File**: `src/hooks/usePrinter.ts`

React hook for printer management.

```typescript
import { useState, useEffect, useCallback } from 'react';
import { PrinterDriver, PrinterType, PrinterSettings } from '@/types/printer';
import { PrinterFactory } from '@/lib/printers/PrinterFactory';
import { LabelData } from '@/types/labels';
import { useToast } from '@/hooks/use-toast';

export function usePrinter() {
  const [printer, setPrinter] = useState<PrinterDriver | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const { toast } = useToast();

  // Initialize printer from settings
  useEffect(() => {
    const saved = localStorage.getItem('printerSettings');
    if (saved) {
      const settings: PrinterSettings = JSON.parse(saved);
      const printerInstance = PrinterFactory.createPrinter(settings.type, settings);
      setPrinter(printerInstance);
      printerInstance.connect().then(connected => {
        setIsConnected(connected);
      });
    } else {
      // Default to browser print
      const defaultPrinter = PrinterFactory.createPrinter('generic');
      setPrinter(defaultPrinter);
      defaultPrinter.connect().then(connected => {
        setIsConnected(connected);
      });
    }
  }, []);

  const print = useCallback(async (labelData: LabelData): Promise<boolean> => {
    if (!printer) {
      toast({
        title: 'No Printer',
        description: 'Please configure a printer in settings.',
        variant: 'destructive'
      });
      return false;
    }

    setIsPrinting(true);
    try {
      const success = await printer.print(labelData);
      if (success) {
        toast({
          title: 'Print Success',
          description: `Label for ${labelData.productName} sent to printer.`
        });
      } else {
        toast({
          title: 'Print Failed',
          description: 'Failed to print label. Please try again.',
          variant: 'destructive'
        });
      }
      return success;
    } catch (error) {
      toast({
        title: 'Print Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [printer, toast]);

  const printBatch = useCallback(async (labels: LabelData[]): Promise<boolean> => {
    if (!printer) {
      toast({
        title: 'No Printer',
        description: 'Please configure a printer in settings.',
        variant: 'destructive'
      });
      return false;
    }

    setIsPrinting(true);
    try {
      const success = await printer.printBatch(labels);
      if (success) {
        toast({
          title: 'Batch Print Success',
          description: `${labels.length} labels sent to printer.`
        });
      } else {
        toast({
          title: 'Batch Print Failed',
          description: 'Failed to print labels. Please try again.',
          variant: 'destructive'
        });
      }
      return success;
    } catch (error) {
      toast({
        title: 'Print Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [printer, toast]);

  const changePrinter = useCallback((type: PrinterType, settings?: Partial<PrinterSettings>) => {
    const newPrinter = PrinterFactory.createPrinter(type, settings);
    setPrinter(newPrinter);
    newPrinter.connect().then(connected => {
      setIsConnected(connected);
    });
  }, []);

  return {
    printer,
    isConnected,
    isPrinting,
    print,
    printBatch,
    changePrinter
  };
}
```

---

## 📦 Dependencies to Install

```bash
npm install jspdf
npm install @types/jspdf --save-dev
```

---

## 📊 Testing Checklist

- [ ] ZebraPrinter generates valid ZPL
- [ ] PDFPrinter creates downloadable PDFs
- [ ] GenericPrinter opens browser print dialog
- [ ] Settings persist in localStorage
- [ ] usePrinter hook works correctly
- [ ] Printer switching works
- [ ] Batch printing works
- [ ] Error handling displays toasts

---

## 🎯 Success Criteria

- ✅ 3 printer types implemented (Zebra, PDF, Generic)
- ✅ Clean abstraction with PrinterDriver interface
- ✅ Settings UI with persistence
- ✅ React hook for easy integration
- ✅ Batch printing support
- ✅ Error handling and user feedback
- ✅ 0 TypeScript errors

---

**Estimated Time**: 12-14 hours (1.5-2 days of focused work)  
**Files to Create**: 8 new files  
**Lines of Code**: ~1500 lines
