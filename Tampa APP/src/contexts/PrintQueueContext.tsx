// PrintQueueContext - Shared state for print queue across all components
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface LabelData {
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
  productId: string;
  productName: string;
  condition: string;
  preparedBy: string;
  preparedByName: string;
  prepDate: string;
  expiryDate: string;
  quantity: string;
  unit: string;
  batchNumber: string;
}

interface PrintQueueItem {
  id: string;
  labelData: LabelData;
  quantity: number;
  addedAt: string;
  productName: string;
  categoryName: string;
}

interface StoredQueue {
  version: string;
  lastUpdated: string;
  items: PrintQueueItem[];
}

const STORAGE_KEY = 'tampa_print_queue';
const QUEUE_VERSION = '1.0';

interface PrintQueueContextType {
  isOpen: boolean;
  items: PrintQueueItem[];
  openQueue: () => void;
  closeQueue: () => void;
  toggleQueue: () => void;
  setItems: React.Dispatch<React.SetStateAction<PrintQueueItem[]>>;
}

const PrintQueueContext = createContext<PrintQueueContextType | undefined>(undefined);

export function PrintQueueProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<PrintQueueItem[]>([]);

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        const queue: StoredQueue = JSON.parse(stored);
        
        // Validate version
        if (queue.version !== QUEUE_VERSION) {
          console.warn('Queue version mismatch, clearing old queue');
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        // Remove expired items (older than 7 days)
        const now = new Date();
        const validItems = queue.items.filter(item => {
          const addedDate = new Date(item.addedAt);
          const daysDiff = (now.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff < 7;
        });

        if (validItems.length !== queue.items.length) {
          console.log(`Removed ${queue.items.length - validItems.length} expired items`);
        }

        console.log('PrintQueueProvider: Loading items from storage:', validItems.length);
        setItems(validItems);
      }
    } catch (error) {
      console.error('Failed to load print queue:', error);
      toast({
        title: 'Queue Load Error',
        description: 'Failed to restore print queue. Starting fresh.',
        variant: 'destructive'
      });
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [toast]);

  // Save queue to localStorage whenever items change
  useEffect(() => {
    try {
      const queue: StoredQueue = {
        version: QUEUE_VERSION,
        lastUpdated: new Date().toISOString(),
        items
      };
      console.log('PrintQueueProvider: Saving items to storage:', items.length);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save print queue:', error);
    }
  }, [items]);

  const openQueue = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeQueue = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleQueue = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <PrintQueueContext.Provider value={{ isOpen, items, openQueue, closeQueue, toggleQueue, setItems }}>
      {children}
    </PrintQueueContext.Provider>
  );
}

export function usePrintQueueContext() {
  const context = useContext(PrintQueueContext);
  if (context === undefined) {
    throw new Error('usePrintQueueContext must be used within a PrintQueueProvider');
  }
  return context;
}
