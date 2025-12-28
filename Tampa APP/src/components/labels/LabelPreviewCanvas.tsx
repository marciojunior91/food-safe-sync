// LabelPreviewCanvas - Canvas-based real-time label preview
import { useEffect, useRef, useState } from 'react';
import { LabelData } from './LabelForm';
import { renderGenericLabel, renderPdfLabel, renderZebraLabel } from '@/utils/labelRenderers';
import { Loader2 } from 'lucide-react';

export type LabelFormat = 'generic' | 'pdf' | 'zebra';
export type PreviewScale = 0.5 | 0.75 | 1 | 1.25 | 1.5;

interface LabelPreviewCanvasProps {
  labelData: LabelData;
  format: LabelFormat;
  scale: PreviewScale;
  className?: string;
}

export function LabelPreviewCanvas({ 
  labelData, 
  format, 
  scale = 1,
  className = "" 
}: LabelPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout>();

  // Render function (extracted to avoid duplication)
  const renderCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsRendering(true);

    // Set canvas dimensions based on format
    let baseWidth = 480;  // Default 60mm (~2.36 inches at 203 DPI)
    let baseHeight = 480; // Default 60mm (square label)

    if (format === 'pdf') {
      // A4 dimensions in pixels at 96 DPI (reduced for preview)
      baseWidth = 600;  // Scaled down from 794
      baseHeight = 848; // Scaled down from 1123
    } else if (format === 'zebra') {
      // 60mm x 60mm label at 203 DPI (thermal printer)
      // 60mm = 2.36 inches, at 203 DPI = ~479 pixels
      // For preview, scale down proportionally
      baseWidth = 480;  // ~60mm width
      baseHeight = 480; // ~60mm height (square label)
    }
    // Generic format also uses 60mm x 60mm by default

    // Apply scale
    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scale context for drawing
    ctx.save();
    ctx.scale(scale, scale);

    // Render based on format
    try {
      switch (format) {
        case 'generic':
          await renderGenericLabel(ctx, labelData, baseWidth, baseHeight);
          break;
        case 'pdf':
          await renderPdfLabel(ctx, labelData, baseWidth, baseHeight);
          break;
        case 'zebra':
          await renderZebraLabel(ctx, labelData, baseWidth, baseHeight);
          break;
      }
    } catch (error) {
      console.error('Error rendering label preview:', error);
      
      // Show error on canvas
      ctx.fillStyle = '#dc3545';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Error rendering preview', baseWidth / 2, baseHeight / 2);
    } finally {
      ctx.restore();
      setIsRendering(false);
    }
  };

  // Render label on canvas whenever data, format, or scale changes (debounced)
  useEffect(() => {
    // Clear previous timeout
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    // Debounce rendering (300ms to prevent excessive updates during typing)
    renderTimeoutRef.current = setTimeout(() => {
      renderCanvas();
    }, 300);

    // Cleanup
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [labelData, format, scale]);

  return (
    <div className={`relative flex items-center justify-center bg-muted/30 rounded-lg p-4 overflow-auto ${className}`}>
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="border border-border rounded shadow-sm bg-white"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}
