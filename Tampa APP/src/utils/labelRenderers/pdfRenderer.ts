// PDF Label Renderer - A4 paper layout with professional design
// Professional restaurant label design with company footer
import { LabelData } from '@/components/labels/LabelForm';
import QRCode from 'qrcode';

export async function renderPdfLabel(
  ctx: CanvasRenderingContext2D,
  data: LabelData,
  width: number,
  height: number
): Promise<void> {
  // Debug: Check if organization details are being received
  console.log('🔍 PDF Renderer - Received data.organizationDetails:', data.organizationDetails);
  console.log('🔍 PDF Renderer - Full data object keys:', Object.keys(data));
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // White background (paper)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Page margins (A4 standard)
  const margin = 40;
  const labelWidth = width - (margin * 2);
  const labelHeight = 780; // Increased from 680 to 780px to ensure QR code and Label ID fit completely
  const labelY = margin + 50;

  // Paper border
  ctx.strokeStyle = '#e9ecef';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);

  // Label outer border
  ctx.strokeStyle = '#212529';
  ctx.lineWidth = 3;
  ctx.strokeRect(margin, labelY, labelWidth, labelHeight);

  // Label content area
  const padding = 20;
  let yPos = labelY + padding;
  const xPos = margin + padding;
  const contentWidth = labelWidth - (padding * 2);

  // ============================================================================
  // PRODUCT NAME + QUANTITY HEADER - Professional style
  // ============================================================================
  ctx.strokeStyle = '#212529';
  ctx.lineWidth = 2;
  ctx.strokeRect(xPos, yPos, contentWidth, 60);
  
  ctx.fillStyle = '#212529';
  ctx.font = 'bold 28px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
  ctx.textAlign = 'left';
  
  // Product name on left, quantity on right
  const productText = data.productName || 'Product Name';
  ctx.fillText(productText, xPos + 10, yPos + 40);
  
  if (data.quantity && data.unit) {
    ctx.font = 'bold 24px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${data.quantity} ${data.unit}`, xPos + contentWidth - 10, yPos + 40);
    ctx.textAlign = 'left';
  }
  yPos += 65;

  // Separator line
  ctx.strokeStyle = '#212529';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xPos, yPos);
  ctx.lineTo(xPos + contentWidth, yPos);
  ctx.stroke();
  yPos += 25;

  // ============================================================================
  // CONDITION - Prominent display
  // ============================================================================
  ctx.fillStyle = '#212529';
  ctx.font = 'bold 22px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
  ctx.fillText(data.condition?.toUpperCase() || 'N/A', xPos, yPos);
  yPos += 35;

  // Separator line
  ctx.strokeStyle = '#212529';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xPos, yPos);
  ctx.lineTo(xPos + contentWidth, yPos);
  ctx.stroke();
  yPos += 25;

  // ============================================================================
  // DATES SECTION - English labels with more spacing
  // ============================================================================
  ctx.fillStyle = '#212529';
  ctx.font = '18px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
  ctx.fillText('Manufacturing Date:', xPos, yPos);
  ctx.font = 'bold 18px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
  ctx.fillText(data.prepDate || 'N/A', xPos + 210, yPos);
  yPos += 30;

  ctx.font = '18px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
  ctx.fillText('Expiry Date:', xPos, yPos);
  ctx.font = 'bold 18px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
  ctx.fillText(data.expiryDate || 'N/A', xPos + 210, yPos);
  yPos += 30;

  // Batch number (if present)
  if (data.batchNumber && data.batchNumber.trim() !== '') {
    ctx.font = '18px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
    ctx.fillText('Batch:', xPos, yPos);
    ctx.font = 'bold 18px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
    ctx.fillText(data.batchNumber, xPos + 210, yPos);
    yPos += 30;
  }

  // Category (if not Quick Print)
  if (data.categoryName && data.categoryName !== 'Quick Print') {
    ctx.font = '18px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
    ctx.fillText('Category:', xPos, yPos);
    ctx.font = 'bold 18px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
    ctx.fillText(data.categoryName, xPos + 210, yPos);
    yPos += 30;
  }

  // Food Safety Registration (if present)
  if (data.organizationDetails?.foodSafetyRegistration) {
    ctx.font = '18px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
    ctx.fillText('Food Safety Reg:', xPos, yPos);
    ctx.font = 'bold 18px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
    ctx.fillText(data.organizationDetails.foodSafetyRegistration, xPos + 210, yPos);
    yPos += 30;
  }

  // Separator line
  ctx.strokeStyle = '#212529';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xPos, yPos);
  ctx.lineTo(xPos + contentWidth, yPos);
  ctx.stroke();
  yPos += 20;

  // ============================================================================
  // ALLERGENS SECTION (if applicable)
  // ============================================================================
  if (data.allergens && data.allergens.length > 0) {
    const allergenText = data.allergens.map(a => a.name).join(', ');

    ctx.fillStyle = '#212529';
    ctx.font = 'bold 16px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
    ctx.fillText('Allergens:', xPos, yPos);
    yPos += 25;

    ctx.font = '14px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
    // Wrap text if too long (reserve space for QR code)
    const maxWidth = contentWidth - 150;
    const words = allergenText.split(' ');
    let line = '';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, xPos, yPos);
        line = words[i] + ' ';
        yPos += 22;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, xPos, yPos);
    yPos += 30;

    // Separator line
    ctx.strokeStyle = '#212529';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xPos, yPos);
    ctx.lineTo(xPos + contentWidth, yPos);
    ctx.stroke();
    yPos += 20;
  }

  // ============================================================================
  // PREPARED BY - Professional style (uppercase)
  // ============================================================================
  ctx.fillStyle = '#212529';
  ctx.font = 'bold 18px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
  ctx.fillText(`Prepared By: ${(data.preparedByName || 'Unknown').toUpperCase()}`, xPos, yPos);
  yPos += 35;

  // Separator line
  ctx.strokeStyle = '#212529';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xPos, yPos);
  ctx.lineTo(xPos + contentWidth, yPos);
  ctx.stroke();
  yPos += 20;

  // ============================================================================
  // COMPANY FOOTER - Professional style with spacing
  // ============================================================================
  if (data.organizationDetails) {
    ctx.fillStyle = '#212529';
    ctx.font = 'bold 16px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
    ctx.fillText(data.organizationDetails.name.toUpperCase(), xPos, yPos);
    yPos += 24;

    if (data.organizationDetails.phone) {
      ctx.font = '13px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
      ctx.fillText(`Tel: ${data.organizationDetails.phone}`, xPos, yPos);
      yPos += 20;
    }

    if (data.organizationDetails.address) {
      // Parse address JSON
      let addressLines: string[] = [];
      try {
        const addr = typeof data.organizationDetails.address === 'string' 
          ? JSON.parse(data.organizationDetails.address)
          : data.organizationDetails.address;
        
        const line1 = `${addr.street || ''}, ${addr.number || ''}`.trim();
        const line2 = `${addr.city || ''} - ${addr.state || ''}, ${addr.postalCode || ''}`.trim();
        addressLines = [line1, line2].filter(l => l.length > 3);
      } catch {
        addressLines = [String(data.organizationDetails.address)];
      }

      ctx.font = '12px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
      addressLines.forEach(line => {
        ctx.fillText(line, xPos, yPos);
        yPos += 18;
      });
    }

    // Food Safety Registration - Professional style
    if (data.organizationDetails.foodSafetyRegistration) {
      ctx.font = '13px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
      ctx.fillText(`Food Safety Reg: ${data.organizationDetails.foodSafetyRegistration}`, xPos, yPos);
      yPos += 20;
    }
  }

  // ============================================================================
  // QR CODE - Bottom right corner (closer to content, reduced spacing)
  // ============================================================================
  const qrSize = 110;
  const qrX = margin + labelWidth - padding - qrSize;
  const qrY = labelY + labelHeight - padding - qrSize - 10; // Moved up 10px closer to content
  
  try {
    // Generate QR code data - includes labelId for product lifecycle tracking
    const qrData = JSON.stringify({
      labelId: data.labelId || null,
      product: data.productName,
      prep: data.prepDate,
      exp: data.expiryDate,
      batch: data.batchNumber,
      by: data.preparedByName,
    });
    
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: qrSize,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    // Create image and draw it
    const qrImage = new Image();
    qrImage.src = qrDataUrl;
    
    // Wait for image to load
    await new Promise<void>((resolve) => {
      qrImage.onload = () => {
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
        resolve();
      };
      qrImage.onerror = () => {
        drawQRPlaceholderPDF(ctx, qrX, qrY, qrSize);
        resolve();
      };
    });
  } catch (error) {
    drawQRPlaceholderPDF(ctx, qrX, qrY, qrSize);
  }

  // ============================================================================
  // LABEL ID - Bottom left corner
  // ============================================================================
  if (data.labelId) {
    const labelIdY = labelY + labelHeight - padding - 5; // Bottom left position
    ctx.fillStyle = '#495057';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'left';
    const shortId = data.labelId.substring(0, 8).toUpperCase();
    ctx.fillText(`#${shortId}`, xPos, labelIdY);
  }

  // ============================================================================
  // PAGE FOOTER - Removed branding per requirements
  // ============================================================================
  ctx.fillStyle = '#adb5bd';
  ctx.font = '10px "Century Gothic", "Trebuchet MS", "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Page 1 of 1', width / 2, height - 10);
  ctx.textAlign = 'left';
}

function drawQRPlaceholderPDF(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.strokeStyle = '#dee2e6';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);
  
  ctx.fillStyle = '#adb5bd';
  ctx.font = '12px Arial';
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'center';
  ctx.fillText('QR CODE', x + size / 2, y + size / 2);
  ctx.textAlign = prevAlign;
}
