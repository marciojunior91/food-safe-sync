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
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedSettings = JSON.parse(stored) as PrinterSettings;
          setSettings(parsedSettings);
          
          // Initialize printer with stored settings
          const printerInstance = PrinterFactory.createPrinter(parsedSettings.type, parsedSettings);
          setPrinter(printerInstance);
        } else {
          // Default to generic printer
          const defaultSettings = PrinterFactory.getDefaultSettings('generic');
          setSettings(defaultSettings);
          setPrinter(PrinterFactory.createPrinter('generic', defaultSettings));
        }
      } catch (error) {
        console.error('Failed to load printer settings:', error);
        toast({
          title: 'Settings Error',
          description: 'Failed to load printer settings. Using default.',
          variant: 'destructive'
        });
        
        // Fallback to generic printer
        const defaultSettings = PrinterFactory.getDefaultSettings('generic');
        setSettings(defaultSettings);
        setPrinter(PrinterFactory.createPrinter('generic', defaultSettings));
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

  return {
    printer,
    settings,
    isLoading,
    print,
    printBatch,
    changePrinter,
    updateSettings,
    saveSettings,
    availablePrinters
  };
}
