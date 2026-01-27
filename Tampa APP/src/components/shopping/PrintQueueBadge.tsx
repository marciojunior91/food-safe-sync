// PrintQueueBadge - Floating action button to open print queue
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePrintQueue } from '@/hooks/usePrintQueue';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function PrintQueueBadge() {
  const { totalLabels, totalItems, openQueue } = usePrintQueue();
  const [pulse, setPulse] = useState(false);

  // Trigger pulse animation when items change
  useEffect(() => {
    if (totalItems > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  // Don't show badge if queue is empty
  if (totalItems === 0) return null;

  return (
    <Button
      onClick={openQueue}
      className={cn(
        "fixed bottom-6 right-6 z-30",
        "rounded-full w-16 h-16 shadow-lg",
        "hover:scale-110 transition-all duration-200",
        "text-white",
        pulse && "animate-pulse"
      )}
      variant="hero"
      size="icon"
    >
      <Printer className="w-6 h-6" />
      <Badge 
        className={cn(
          "absolute -top-2 -right-2",
          "bg-red-500 text-white border-2 border-background",
          "min-w-[24px] h-6 flex items-center justify-center",
          "font-bold text-xs",
          pulse && "animate-bounce"
        )}
      >
        {totalLabels}
      </Badge>
    </Button>
  );
}
