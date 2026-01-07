// Zebra Label Renderer - Thermal printer format visualization
import { LabelData } from '@/components/labels/LabelForm';
import QRCode from 'qrcode';

export async function renderZebraLabel(
  ctx: CanvasRenderingContext2D,
  data: LabelData,
  width: number,
  height: number
): Promise<void> {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // White background (thermal label)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Border (thermal label edge)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, width, height);

  // Thermal printer style - monochrome, high contrast
  const padding = 30;
  let yPos = padding + 10;

  // Header - Bold product name
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(data.productName || 'PRODUCT NAME', padding, yPos);
  yPos += 45;

  // Category
  if (data.categoryName) {
    ctx.font = 'bold 20px monospace';
    ctx.fillText(data.categoryName.toUpperCase(), padding, yPos);
    yPos += 30;
  }

  // Subcategory
  if (data.subcategoryName) {
    ctx.font = '18px monospace';
    ctx.fillText(data.subcategoryName, padding, yPos);
    yPos += 30;
  }

  // Thick divider line
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(padding, yPos);
  ctx.lineTo(width - padding, yPos);
  ctx.stroke();
  yPos += 25;

  // Condition box
  if (data.condition) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(padding, yPos - 25, 180, 35);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(data.condition.toUpperCase(), padding + 90, yPos - 3);
    ctx.textAlign = 'left';
    yPos += 25;
  }

  // Information section
  ctx.fillStyle = '#000000';
  ctx.font = '18px monospace';
  
  // Prepared by
  ctx.fillText(`PREPARED BY:`, padding, yPos);
  yPos += 22;
  ctx.font = 'bold 22px monospace';
  ctx.fillText(data.preparedByName || 'UNKNOWN', padding, yPos);
  yPos += 35;

  // Prep date
  ctx.font = '18px monospace';
  ctx.fillText(`PREP DATE:`, padding, yPos);
  yPos += 22;
  ctx.font = 'bold 24px monospace';
  ctx.fillText(data.prepDate || 'N/A', padding, yPos);
  yPos += 35;

  // Expiry date - prominent
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(padding, yPos - 10, width - (padding * 2), 60);
  
  ctx.font = '18px monospace';
  ctx.fillText(`USE BY:`, padding + 10, yPos + 15);
  
  ctx.font = 'bold 28px monospace';
  ctx.fillText(data.expiryDate || 'N/A', padding + 150, yPos + 18);
  yPos += 70;

  // Quantity
  if (data.quantity && data.unit) {
    ctx.font = '18px monospace';
    ctx.fillText(`QTY: ${data.quantity} ${data.unit}`, padding, yPos);
    yPos += 30;
  }

  // Batch number
  if (data.batchNumber) {
    ctx.font = '16px monospace';
    ctx.fillText(`BATCH:`, padding, yPos);
    yPos += 20;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(data.batchNumber, padding, yPos);
    yPos += 30;
  }

  // ============================================================================
  // COMPANY FOOTER - Organization details
  // ============================================================================
  if (data.organizationDetails) {
    // Add separator line
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, yPos);
    ctx.lineTo(width - padding, yPos);
    ctx.stroke();
    yPos += 25;

    // Company name
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(data.organizationDetails.name.toUpperCase(), padding, yPos);
    yPos += 22;

    // Phone
    if (data.organizationDetails.phone) {
      ctx.font = '14px monospace';
      ctx.fillText(`Tel: ${data.organizationDetails.phone}`, padding, yPos);
      yPos += 20;
    }

    // Address
    if (data.organizationDetails.address) {
      ctx.font = '12px monospace';
      try {
        const addr = typeof data.organizationDetails.address === 'string' 
          ? JSON.parse(data.organizationDetails.address)
          : data.organizationDetails.address;
        
        const line1 = `${addr.street || ''}, ${addr.number || ''}`.trim();
        const line2 = `${addr.city || ''} - ${addr.state || ''}`.trim();
        
        if (line1.length > 3) {
          ctx.fillText(line1, padding, yPos);
          yPos += 18;
        }
        if (line2.length > 3) {
          ctx.fillText(line2, padding, yPos);
          yPos += 18;
        }
      } catch {
        ctx.fillText(String(data.organizationDetails.address), padding, yPos);
        yPos += 18;
      }
    }

    // Food Safety Registration
    if (data.organizationDetails.foodSafetyRegistration) {
      ctx.font = '13px monospace';
      ctx.fillText(`SIF: ${data.organizationDetails.foodSafetyRegistration}`, padding, yPos);
      yPos += 25;
    }
  }

  // QR code - large and prominent for thermal scanning
  const qrSize = 200;
  const qrX = width - padding - qrSize;
  const qrY = height - padding - qrSize - 40;
  
  try {
    // Generate QR code data
    const qrData = JSON.stringify({
      productId: data.productId || "",
      productName: data.productName,
      prepDate: data.prepDate,
      expiryDate: data.expiryDate,
      batchNumber: data.batchNumber,
      timestamp: new Date().toISOString(),
    });
    
    // Generate QR code as data URL - high contrast for thermal printing
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
        // Fallback to placeholder
        drawQRPlaceholderZebra(ctx, qrX, qrY, qrSize);
        resolve();
      };
    });
  } catch (error) {
    // Fallback to placeholder
    drawQRPlaceholderZebra(ctx, qrX, qrY, qrSize);
  }
  
  // QR label
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SCAN QR CODE', qrX + qrSize / 2, qrY + qrSize + 25);

  // Barcode placeholder at bottom
  const barcodeY = height - padding - 10;
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`||||| ${data.batchNumber || 'BARCODE'} |||||`, width / 2, barcodeY);

  ctx.textAlign = 'left';
}

function drawQRPlaceholderZebra(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  // QR code border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, size, size);
  
  // QR code grid pattern (simulation)
  ctx.fillStyle = '#000000';
  const gridSize = 10;
  for (let i = 0; i < size; i += gridSize) {
    for (let j = 0; j < size; j += gridSize) {
      if (Math.random() > 0.5) {
        ctx.fillRect(x + i, y + j, gridSize - 1, gridSize - 1);
      }
    }
  }
}
