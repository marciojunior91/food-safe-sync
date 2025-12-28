// Generic Label Renderer - Beautiful visual representation for preview
import { LabelData } from '@/components/labels/LabelForm';
import QRCode from 'qrcode';

export async function renderGenericLabel(
  ctx: CanvasRenderingContext2D,
  data: LabelData,
  width: number,
  height: number
): Promise<void> {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(1, '#f8f9fa');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = '#dee2e6';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, height);

  // Padding
  const padding = 20;
  let yPos = padding + 10;

  // Header Section
  ctx.fillStyle = '#212529';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(data.productName || 'Product Name', padding, yPos);
  yPos += 35;

  // Category
  if (data.categoryName) {
    ctx.fillStyle = '#6c757d';
    ctx.font = '18px sans-serif';
    ctx.fillText(data.categoryName, padding, yPos);
    yPos += 30;
  }

  // Subcategory
  if (data.subcategoryName) {
    ctx.fillStyle = '#6c757d';
    ctx.font = '16px sans-serif';
    ctx.fillText(data.subcategoryName, padding, yPos);
    yPos += 25;
  }

  // Divider line
  ctx.strokeStyle = '#dee2e6';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, yPos);
  ctx.lineTo(width - padding, yPos);
  ctx.stroke();
  yPos += 20;

  // Info grid - Left column
  const leftColX = padding;
  const rightColX = width / 2;
  
  // Condition badge
  if (data.condition) {
    const conditionColors: Record<string, string> = {
      fresh: '#28a745',
      cooked: '#fd7e14',
      frozen: '#0dcaf0',
      dry: '#ffc107',
      refrigerated: '#17a2b8',
      thawed: '#6f42c1',
    };
    
    ctx.fillStyle = conditionColors[data.condition.toLowerCase()] || '#6c757d';
    ctx.fillRect(leftColX, yPos - 15, 120, 25);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(data.condition.toUpperCase(), leftColX + 60, yPos);
    ctx.textAlign = 'left';
    yPos += 30;
  }

  // Prepared by
  ctx.fillStyle = '#6c757d';
  ctx.font = '12px sans-serif';
  ctx.fillText('PREPARED BY', leftColX, yPos);
  yPos += 18;
  
  ctx.fillStyle = '#212529';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(data.preparedByName || 'Unknown', leftColX, yPos);
  yPos += 30;

  // Prep date
  ctx.fillStyle = '#6c757d';
  ctx.font = '12px sans-serif';
  ctx.fillText('PREP DATE', leftColX, yPos);
  yPos += 18;
  
  ctx.fillStyle = '#212529';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(formatDate(data.prepDate), leftColX, yPos);
  yPos += 30;

  // Expiry date
  ctx.fillStyle = '#6c757d';
  ctx.font = '12px sans-serif';
  ctx.fillText('USE BY', leftColX, yPos);
  yPos += 18;
  
  ctx.fillStyle = '#dc3545';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(formatDate(data.expiryDate), leftColX, yPos);

  // Right column - QR code (real)
  const qrSize = 150;
  const qrX = width - padding - qrSize;
  const qrY = 100;
  
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
        // Fallback to placeholder if QR generation fails
        drawQRPlaceholder(ctx, qrX, qrY, qrSize);
        resolve();
      };
    });
  } catch (error) {
    // Fallback to placeholder
    drawQRPlaceholder(ctx, qrX, qrY, qrSize);
  }

  // Bottom info
  const bottomY = height - padding - 20;
  
  // Quantity
  if (data.quantity && data.unit) {
    ctx.fillStyle = '#6c757d';
    ctx.font = '12px sans-serif';
    ctx.fillText('QUANTITY', leftColX, bottomY);
    
    ctx.fillStyle = '#212529';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`${data.quantity} ${data.unit}`, leftColX, bottomY + 18);
  }

  // Batch number
  if (data.batchNumber) {
    ctx.fillStyle = '#6c757d';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('BATCH #', width - padding, bottomY);
    
    ctx.fillStyle = '#212529';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(data.batchNumber, width - padding, bottomY + 18);
    ctx.textAlign = 'left';
  }

  // Footer note
  ctx.fillStyle = '#adb5bd';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FOOD SAFE SYNC - LABEL PREVIEW', width / 2, height - 8);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
  } catch {
    return dateStr;
  }
}

function drawQRPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  // QR code border
  ctx.strokeStyle = '#dee2e6';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);
  
  // QR code placeholder text
  ctx.fillStyle = '#adb5bd';
  ctx.font = '14px sans-serif';
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'center';
  ctx.fillText('QR CODE', x + size / 2, y + size / 2 - 10);
  ctx.font = '12px sans-serif';
  ctx.fillText('PLACEHOLDER', x + size / 2, y + size / 2 + 10);
  ctx.textAlign = prevAlign;
}
