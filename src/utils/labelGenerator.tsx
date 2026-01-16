import QRCode from 'qrcode';

interface LabelData {
  recipeName: string;
  batchSize: number;
  batchUnit: string;
  calculatedYield: number;
  yieldUnit: string;
  expiryDate: string;
  preparedDate: string;
  allergens: string[];
  dietaryRequirements: string[];
  staffName: string;
  recipeId: string;
}

export const generateLabelHTML = async (data: LabelData, labelCount: number = 1): Promise<string> => {
  // Generate QR code data URL
  const qrData = JSON.stringify({
    recipeId: data.recipeId,
    recipeName: data.recipeName,
    batchSize: data.batchSize,
    calculatedYield: data.calculatedYield,
    yieldUnit: data.yieldUnit,
    expiryDate: data.expiryDate,
    allergens: data.allergens,
    dietaryRequirements: data.dietaryRequirements,
  });

  const qrCodeDataURL = await QRCode.toDataURL(qrData, {
    width: 120,
    margin: 1,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const labelHTML = `
    <div style="
      width: 4in;
      height: 3in;
      border: 2px solid #000;
      padding: 12px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.3;
      box-sizing: border-box;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    ">
      <!-- Header with Recipe Name and QR Code -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <div style="flex: 1; margin-right: 10px;">
          <h2 style="margin: 0; font-size: 16px; font-weight: bold; text-transform: uppercase;">
            ${data.recipeName}
          </h2>
          <div style="font-size: 11px; color: #666; margin-top: 2px;">
            Batch: ${data.batchSize} ${data.batchUnit}
          </div>
        </div>
        <img src="${qrCodeDataURL}" alt="QR Code" style="width: 60px; height: 60px;" />
      </div>

      <!-- Yield Information -->
      <div style="margin-bottom: 8px;">
        <div style="font-weight: bold; font-size: 14px;">
          YIELD: ${data.calculatedYield} ${data.yieldUnit}
        </div>
      </div>

      <!-- Date Information -->
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between;">
          <span><strong>Prepared:</strong> ${formatDate(data.preparedDate)}</span>
          <span><strong>Use By:</strong> ${formatDate(data.expiryDate)}</span>
        </div>
      </div>

      <!-- Allergens Section -->
      ${data.allergens.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <div style="font-weight: bold; color: #d32f2f; margin-bottom: 4px;">
            ⚠️ ALLERGENS:
          </div>
          <div style="background: #ffebee; padding: 4px 6px; border-radius: 4px; font-weight: bold; color: #d32f2f;">
            ${data.allergens.join(', ').toUpperCase()}
          </div>
        </div>
      ` : ''}

      <!-- Dietary Requirements -->
      ${data.dietaryRequirements.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <div style="font-weight: bold; color: #2e7d32; margin-bottom: 4px;">
            🌱 DIETARY:
          </div>
          <div style="background: #e8f5e8; padding: 4px 6px; border-radius: 4px; color: #2e7d32;">
            ${data.dietaryRequirements.join(', ')}
          </div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="font-size: 10px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 4px;">
        Prepared by: ${data.staffName}
      </div>
    </div>
  `;

  // Generate multiple labels if needed
  const labels = Array(labelCount).fill(labelHTML).join('\n');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Food Safety Labels</title>
      <style>
        @page {
          margin: 0.5in;
          size: letter;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
        }
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      ${labels}
    </body>
    </html>
  `;
};