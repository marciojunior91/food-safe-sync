import { useEffect } from 'react';
import { useTimerManager } from '@/hooks/useTimerManager';

export function GlobalTimerManager() {
  const { timers, updateTimer } = useTimerManager();

  useEffect(() => {
    const interval = setInterval(() => {
      timers.forEach((timer) => {
        if (timer.isRunning) {
          const elapsed = Date.now() - timer.startTime;
          updateTimer(timer.id, elapsed);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timers, updateTimer]);

  return null;
}