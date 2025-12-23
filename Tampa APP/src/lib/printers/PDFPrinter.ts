// PDFPrinter - Export labels to PDF using jsPDF
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
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

  private async createPDF(labels: LabelData[]): Promise<jsPDF> {
    const { paperWidth, paperHeight } = this.settings;
    
    // Convert mm to points (1mm = 2.83465 points)
    const widthPt = paperWidth * 2.83465;
    const heightPt = paperHeight * 2.83465;
    
    const pdf = new jsPDF({
      orientation: paperWidth > paperHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [paperWidth, paperHeight]
    });

    for (let index = 0; index < labels.length; index++) {
      if (index > 0) {
        pdf.addPage();
      }
      
      await this.renderLabel(pdf, labels[index]);
    }

    return pdf;
  }

  private async renderLabel(pdf: jsPDF, label: LabelData): Promise<void> {
    const margin = 8;
    let y = margin;
    const contentWidth = this.settings.paperWidth - (margin * 2);
    
    // Generate QR Code data
    const qrData = `PRODUCT:${label.productName}|PREP:${label.preparedDate}|EXP:${label.useByDate}`;
    let qrCodeDataUrl: string | null = null;
    
    try {
      qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: 'M'
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
    
    // === HEADER SECTION ===
    // Header background with gradient effect (dark blue)
    pdf.setFillColor(30, 58, 138); // Blue-900
    pdf.rect(0, 0, this.settings.paperWidth, 25, 'F');
    
    // Add QR Code in header (top right)
    if (qrCodeDataUrl) {
      const qrSize = 22;
      const qrX = this.settings.paperWidth - qrSize - margin;
      const qrY = margin - 6;
      // White background for QR
      pdf.setFillColor(255, 255, 255);
      pdf.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 'F');
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    }
    
    // Product Name in header (white text)
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const maxProductWidth = contentWidth - 30; // Leave room for QR
    const productLines = pdf.splitTextToSize(label.productName, maxProductWidth);
    const productY = 12 + (productLines.length === 1 ? 0 : -2);
    pdf.text(productLines, margin, productY);
    
    y = 28; // Start content below header
    pdf.setTextColor(0, 0, 0); // Reset to black for body
    
    // === CLASSIFICATION SECTION ===
    if (label.categoryName || label.subcategoryName) {
      // Light gray background
      pdf.setFillColor(243, 244, 246); // Gray-100
      pdf.rect(margin, y, contentWidth, 14, 'F');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99); // Gray-600
      
      let classY = y + 6;
      if (label.categoryName) {
        pdf.text(`CATEGORY: `, margin + 2, classY);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(label.categoryName, margin + 22, classY);
        classY += 5;
      }
      
      if (label.subcategoryName) {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(75, 85, 99);
        pdf.text(`SUBCATEGORY: `, margin + 2, classY);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(label.subcategoryName, margin + 28, classY);
      }
      
      y += 17;
    }
    
    // === DATE INFORMATION SECTION ===
    // Border box
    pdf.setDrawColor(209, 213, 219); // Gray-300
    pdf.setLineWidth(0.3);
    pdf.rect(margin, y, contentWidth, 20, 'S');
    
    const dateY = y + 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99);
    
    // Prepared date
    pdf.text('PREPARED:', margin + 2, dateY);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(this.formatDate(label.preparedDate), margin + 2, dateY + 5);
    
    // Use by date (highlighted)
    const useByX = margin + (contentWidth / 2) + 2;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(185, 28, 28); // Red-700
    pdf.text('USE BY:', useByX, dateY);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(220, 38, 38); // Red-600
    pdf.text(this.formatDate(label.useByDate), useByX, dateY + 5);
    
    y += 23;
    
    // === ALLERGEN WARNING (if present) ===
    if (label.allergens && label.allergens.length > 0) {
      // Red warning background
      pdf.setFillColor(254, 226, 226); // Red-100
      pdf.setDrawColor(239, 68, 68); // Red-500
      pdf.setLineWidth(0.5);
      pdf.rect(margin, y, contentWidth, 12, 'FD');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(185, 28, 28);
      pdf.text('⚠ ALLERGENS:', margin + 2, y + 5);
      
      pdf.setFont('helvetica', 'normal');
      const allergensText = label.allergens.join(', ');
      const allergenLines = pdf.splitTextToSize(allergensText, contentWidth - 30);
      pdf.text(allergenLines, margin + 28, y + 5);
      
      y += 15;
    }
    
    // === STORAGE INSTRUCTIONS ===
    if (label.storageInstructions) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128); // Gray-500
      const storageLines = pdf.splitTextToSize(label.storageInstructions, contentWidth);
      pdf.text(storageLines, margin, y);
      y += storageLines.length * 4;
    }
    
    // === FOOTER - BARCODE ===
    if (label.barcode) {
      y += 3;
      pdf.setFontSize(8);
      pdf.setFont('courier', 'normal');
      pdf.text(`Barcode: ${label.barcode}`, margin, y);
    }
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  }
}
