// usePrinter - React hook for printer management
import { useState, useEffect, useCallback } from 'react';
import { PrinterDriver, PrinterType, PrinterSettings } from '@/types/printer';
import { PrinterFactory } from '@/lib/printers/PrinterFactory';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'printer_settings';

export function usePrinter() {
  const { toast } = useToast();
  const [printer, setPrinter] = useState<PrinterDriver | null>(null);
  const [settings, setSettings] = useState<PrinterSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        // ✅ REMOVED PRODUCTION LOCK - Allow testing all printer methods
        console.log('🖨️ Loading printer settings (all methods available)');
        
        // Load user preference from localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedSettings = JSON.parse(stored) as PrinterSettings;
          setSettings(parsedSettings);
          
          // Initialize printer with stored settings
          const printerInstance = PrinterFactory.createPrinter(parsedSettings.type, parsedSettings);
          setPrinter(printerInstance);
        } else {
          // Default to Zebra printer (recommended for production)
          const defaultSettings = PrinterFactory.getDefaultSettings('zebra');
          setSettings(defaultSettings);
          setPrinter(PrinterFactory.createPrinter('zebra', defaultSettings));
        }
      } catch (error) {
        console.error('Failed to load printer settings:', error);
        toast({
          title: 'Settings Error',
          description: 'Failed to load printer settings. Using default Zebra printer.',
          variant: 'destructive'
        });
        
        // Fallback to Zebra
        const defaultSettings = PrinterFactory.getDefaultSettings('zebra');
        setSettings(defaultSettings);
        setPrinter(PrinterFactory.createPrinter('zebra', defaultSettings));
      }
    };

    loadSettings();
  }, [toast]);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: PrinterSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // Create new printer instance with updated settings
      const printerInstance = PrinterFactory.createPrinter(newSettings.type, newSettings);
      setPrinter(printerInstance);
      
      toast({
        title: 'Settings Saved',
        description: `Printer configured: ${newSettings.name}`,
      });
    } catch (error) {
      console.error('Failed to save printer settings:', error);
      toast({
        title: 'Save Error',
        description: 'Failed to save printer settings.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Change printer type
  const changePrinter = useCallback((type: PrinterType) => {
    // ✅ REMOVED PRODUCTION LOCK - Allow switching printer methods for testing
    console.log(`🖨️ Switching to ${type} printer`);
    
    const newSettings = PrinterFactory.getDefaultSettings(type);
    saveSettings(newSettings);
  }, [saveSettings]);

  // Print single label
  const print = useCallback(async (labelData: any): Promise<boolean> => {
    if (!printer) {
      toast({
        title: 'Printer Error',
        description: 'No printer configured.',
        variant: 'destructive'
      });
      return false;
    }

    setIsLoading(true);
    
    try {
      const success = await printer.print(labelData);
      
      if (success) {
        toast({
          title: 'Print Successful',
          description: `Label for "${labelData.productName}" sent to printer.`,
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
      console.error('Print error:', error);
      toast({
        title: 'Print Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [printer, toast]);

  // Print multiple labels
  const printBatch = useCallback(async (labels: any[]): Promise<boolean> => {
    if (!printer) {
      toast({
        title: 'Printer Error',
        description: 'No printer configured.',
        variant: 'destructive'
      });
      return false;
    }

    if (labels.length === 0) {
      toast({
        title: 'No Labels',
        description: 'No labels to print.',
        variant: 'destructive'
      });
      return false;
    }

    setIsLoading(true);
    
    try {
      const success = await printer.printBatch(labels);
      
      if (success) {
        toast({
          title: 'Batch Print Successful',
          description: `${labels.length} labels sent to printer.`,
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
      console.error('Batch print error:', error);
      toast({
        title: 'Batch Print Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [printer, toast]);

  // Update printer settings
  const updateSettings = useCallback((newSettings: Partial<PrinterSettings>) => {
    if (!settings) return;
    
    const updatedSettings = { ...settings, ...newSettings };
    saveSettings(updatedSettings);
  }, [settings, saveSettings]);

  // Get available printers
  const availablePrinters = PrinterFactory.getAvailablePrinters();
  
  // Check if in production mode
  const isProduction = import.meta.env.PROD;

  return {
    printer,
    settings,
    isLoading,
    print,
    printBatch,
    changePrinter,
    updateSettings,
    saveSettings,
    availablePrinters,
    isProduction, // Expose to UI so it can hide printer selection in prod
  };
}
