// usePrinter - React hook for printer management
import { useState, useEffect, useCallback } from 'react';
import { PrinterDriver, PrinterType, PrinterSettings } from '@/types/printer';
import { PrinterFactory } from '@/lib/printers/PrinterFactory';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_STORAGE_KEY = 'printer_settings';

// Custom event for printer settings changes
const PRINTER_SETTINGS_CHANGED_EVENT = 'printer-settings-changed';

interface PrinterSettingsChangedDetail {
  storageKey: string;
  settings: PrinterSettings;
}

/**
 * usePrinter Hook
 * 
 * @param context - Optional context/namespace for isolated printer settings
 *                  Examples: 'quick-print', 'print-queue', 'label-form'
 *                  If not provided, uses global 'printer_settings'
 */
export function usePrinter(context?: string) {
  const STORAGE_KEY = context ? `printer_settings_${context}` : DEFAULT_STORAGE_KEY;
  const { toast } = useToast();
  const [printer, setPrinter] = useState<PrinterDriver | null>(null);
  const [settings, setSettings] = useState<PrinterSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from localStorage
  const loadSettings = useCallback(() => {
    try {
      console.log(`🖨️ Loading printer settings for context: ${context || 'default'}`);
      
      // Load user preference from localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored) as PrinterSettings;
        setSettings(parsedSettings);
        
        // Initialize printer with stored settings
        const printerInstance = PrinterFactory.createPrinter(parsedSettings.type, parsedSettings);
        setPrinter(printerInstance);
        
        console.log(`✅ Printer loaded: ${parsedSettings.type} for context: ${context || 'default'}`);
      } else {
        // Default to Zebra printer (recommended for production)
        const defaultSettings = PrinterFactory.getDefaultSettings('zebra');
        setSettings(defaultSettings);
        setPrinter(PrinterFactory.createPrinter('zebra', defaultSettings));
        
        console.log(`✅ Default Zebra printer loaded for context: ${context || 'default'}`);
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
  }, [STORAGE_KEY, context, toast]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Listen for printer settings changes from other components
  useEffect(() => {
    const handleSettingsChanged = (event: Event) => {
      const customEvent = event as CustomEvent<PrinterSettingsChangedDetail>;
      const { storageKey, settings: newSettings } = customEvent.detail;
      
      // Only reload if this is our storage key
      if (storageKey === STORAGE_KEY) {
        console.log(`🔄 Printer settings changed externally for context: ${context || 'default'}`);
        setSettings(newSettings);
        
        // Create new printer instance with updated settings
        const printerInstance = PrinterFactory.createPrinter(newSettings.type, newSettings);
        setPrinter(printerInstance);
        
        console.log(`✅ Printer reloaded: ${newSettings.type} for context: ${context || 'default'}`);
      }
    };

    window.addEventListener(PRINTER_SETTINGS_CHANGED_EVENT, handleSettingsChanged);
    
    return () => {
      window.removeEventListener(PRINTER_SETTINGS_CHANGED_EVENT, handleSettingsChanged);
    };
  }, [STORAGE_KEY, context]);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: PrinterSettings) => {
    try {
      console.log(`💾 Saving printer settings for context: ${context || 'default'}`, newSettings);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // Create new printer instance with updated settings
      const printerInstance = PrinterFactory.createPrinter(newSettings.type, newSettings);
      setPrinter(printerInstance);
      
      // Dispatch custom event to notify other components
      const event = new CustomEvent<PrinterSettingsChangedDetail>(
        PRINTER_SETTINGS_CHANGED_EVENT,
        {
          detail: {
            storageKey: STORAGE_KEY,
            settings: newSettings
          }
        }
      );
      window.dispatchEvent(event);
      
      console.log(`📢 Dispatched settings change event for context: ${context || 'default'}`);
      
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
  }, [STORAGE_KEY, context, toast]);

  // Change printer type
  const changePrinter = useCallback((type: PrinterType) => {
    console.log(`� Switching to ${type} printer for context: ${context || 'default'}`);
    
    const newSettings = PrinterFactory.getDefaultSettings(type);
    saveSettings(newSettings);
  }, [context, saveSettings]);

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

  // Get available printers
  const availablePrinters = PrinterFactory.getAvailablePrinters();

  return {
    printer,
    settings,
    isLoading,
    print,
    printBatch,
    changePrinter,
    saveSettings,
    availablePrinters,
  };
}
