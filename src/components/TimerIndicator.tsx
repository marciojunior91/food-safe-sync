import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Timer } from 'lucide-react';
import { useTimerManager } from '@/hooks/useTimerManager';

export function TimerIndicator() {
  const { getActiveTimers } = useTimerManager();
  const activeTimers = getActiveTimers();

  if (activeTimers.length === 0) return null;

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {activeTimers.map((timer) => (
        <Badge key={timer.id} variant="secondary" className="px-3 py-2 text-sm animate-pulse">
          <Timer className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">{timer.recipeName}</span>
            <span className="text-xs text-muted-foreground">
              {timer.staffName} - {formatTime(timer.elapsedTime)}
            </span>
          </div>
        </Badge>
      ))}
    </div>
  );
}