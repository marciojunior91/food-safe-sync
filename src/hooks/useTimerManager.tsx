import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerSession {
  id: string;
  recipeId: string;
  recipeName: string;
  staffId: string;
  staffName: string;
  startTime: number;
  elapsedTime: number;
  isRunning: boolean;
  batchSize: number;
  batchUnit: string;
  sessionId?: string;
}

interface TimerStore {
  timers: TimerSession[];
  addTimer: (timer: Omit<TimerSession, 'id' | 'elapsedTime'>) => string;
  pauseTimer: (id: string) => void;
  resumeTimer: (id: string) => void;
  updateTimer: (id: string, elapsed: number) => void;
  removeTimer: (id: string) => void;
  getActiveTimers: () => TimerSession[];
  getTimerById: (id: string) => TimerSession | undefined;
}

export const useTimerManager = create<TimerStore>()(
  persist(
    (set, get) => ({
      timers: [],

      addTimer: (timerData) => {
        const id = crypto.randomUUID();
        const timer: TimerSession = {
          ...timerData,
          id,
          elapsedTime: 0,
        };
        
        set((state) => ({
          timers: [...state.timers, timer],
        }));
        
        return id;
      },

      pauseTimer: (id) => {
        set((state) => ({
          timers: state.timers.map((timer) =>
            timer.id === id
              ? { ...timer, isRunning: false }
              : timer
          ),
        }));
      },

      resumeTimer: (id) => {
        set((state) => ({
          timers: state.timers.map((timer) =>
            timer.id === id
              ? { ...timer, isRunning: true, startTime: Date.now() - timer.elapsedTime }
              : timer
          ),
        }));
      },

      updateTimer: (id, elapsed) => {
        set((state) => ({
          timers: state.timers.map((timer) =>
            timer.id === id
              ? { ...timer, elapsedTime: elapsed }
              : timer
          ),
        }));
      },

      removeTimer: (id) => {
        set((state) => ({
          timers: state.timers.filter((timer) => timer.id !== id),
        }));
      },

      getActiveTimers: () => {
        return get().timers.filter((timer) => timer.isRunning);
      },

      getTimerById: (id) => {
        return get().timers.find((timer) => timer.id === id);
      },
    }),
    {
      name: 'timer-storage',
    }
  )
);

// Hook to manage timer intervals globally
export const useTimerInterval = () => {
  const { timers, updateTimer } = useTimerManager();

  React.useEffect(() => {
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
};