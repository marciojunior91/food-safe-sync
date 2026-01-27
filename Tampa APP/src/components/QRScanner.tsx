import { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export function QRScanner({ open, onClose, onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });

      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        scanQRCode();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setHasPermission(false);
      toast({
        title: 'Camera Access Denied',
        description: 'Please allow camera access to scan QR codes.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
    setHasPermission(null);
  };

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode);
      return;
    }

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Try to detect QR code using BarcodeDetector API if available
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code']
        });
        const barcodes = await barcodeDetector.detect(imageData);

        if (barcodes.length > 0) {
          const qrCode = barcodes[0].rawValue;
          handleScan(qrCode);
          return;
        }
      } catch (error) {
        console.error('BarcodeDetector error:', error);
      }
    }

    // Continue scanning
    if (scanning) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const handleScan = (data: string) => {
    stopCamera();
    onScan(data);
    onClose();
  };

  const handleManualInput = () => {
    stopCamera();
    const labelId = prompt('Enter Label ID manually:');
    if (labelId) {
      onScan(`label-${labelId}`);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan QR Code
          </DialogTitle>
          <DialogDescription>
            Point your camera at a label QR code to scan it
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera View */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-square max-h-[400px]">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Overlay */}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-4 border-primary w-48 h-48 rounded-lg animate-pulse" />
              </div>
            )}

            {/* Permission Denied */}
            {hasPermission === false && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-6 text-center">
                <Camera className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-semibold mb-2">Camera Access Required</p>
                <p className="text-sm text-gray-300 mb-4">
                  Please allow camera access in your browser settings to scan QR codes.
                </p>
                <Button variant="outline" onClick={startCamera}>
                  Try Again
                </Button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">How to scan:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Hold your device steady</li>
              <li>Point the camera at the QR code on the label</li>
              <li>Wait for automatic detection</li>
              <li>The label action page will open automatically</li>
            </ul>
          </div>

          {/* Browser Not Supported */}
          {!('BarcodeDetector' in window) && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> QR code detection is not fully supported in this browser.
                You can still enter the Label ID manually.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleManualInput} className="flex-1">
              Enter ID Manually
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
