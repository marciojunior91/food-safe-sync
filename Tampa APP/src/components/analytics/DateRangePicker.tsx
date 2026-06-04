// Date range picker with preset shortcuts. Used by the Analytics page; small
// enough to embed inline. Shadcn-style: Popover + Calendar + presets sidebar.

import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import type { DateRange as DRange } from 'react-day-picker';

export interface AnalyticsDateRange {
  from: Date;
  to: Date;
}

const PRESETS: Array<{ label: string; build: () => AnalyticsDateRange }> = [
  { label: 'Today', build: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: 'Last 7 days', build: () => ({ from: subDays(new Date(), 6), to: endOfDay(new Date()) }) },
  { label: 'This week', build: () => ({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) }) },
  { label: 'This month', build: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'Last month', build: () => ({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(subMonths(new Date(), 1)),
  }) },
  { label: 'Last 90 days', build: () => ({ from: subDays(new Date(), 89), to: endOfDay(new Date()) }) },
];

interface Props {
  value: AnalyticsDateRange;
  onChange: (range: AnalyticsDateRange) => void;
}

function describe(range: AnalyticsDateRange): string {
  const sameDay = range.from.toDateString() === range.to.toDateString();
  if (sameDay) return format(range.from, 'MMM d, yyyy');
  return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`;
}

export function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DRange | undefined>({ from: value.from, to: value.to });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          {describe(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-col gap-1 border-b sm:border-b-0 sm:border-r p-3 min-w-[140px]">
            {PRESETS.map(p => (
              <Button
                key={p.label}
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  const r = p.build();
                  setDraft({ from: r.from, to: r.to });
                  onChange(r);
                  setOpen(false);
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div>
            <Calendar
              mode="range"
              selected={draft}
              onSelect={(r) => {
                setDraft(r);
                if (r?.from && r?.to) {
                  onChange({ from: r.from, to: endOfDay(r.to) });
                  setOpen(false);
                }
              }}
              numberOfMonths={2}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
