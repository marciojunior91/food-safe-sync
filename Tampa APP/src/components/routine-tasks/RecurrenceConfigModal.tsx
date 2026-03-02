/**
 * ================================================================
 * RECURRENCE CONFIG MODAL
 * ================================================================
 * Modal for configuring task recurrence patterns
 * Supports 7 recurrence types with visual previews
 * Microsoft Teams-inspired UX
 * ================================================================
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format, addMonths } from "date-fns";
import { CalendarIcon, Repeat, Info } from "lucide-react";
import {
  RecurrenceType,
  RecurrenceConfig,
  Weekday,
  RECURRENCE_TYPES,
} from "@/types/recurring-tasks";

// ================================================================
// TYPES
// ================================================================

interface RecurrenceConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (config: RecurrenceConfig) => void;
  initialConfig?: RecurrenceConfig;
  title?: string;
  description?: string;
}

// ================================================================
// RECURRENCE TYPE LABELS & ICONS
// ================================================================

const RECURRENCE_LABELS: Record<RecurrenceType, { label: string; emoji: string; description: string }> = {
  daily: {
    label: "Daily",
    emoji: "📅",
    description: "Repeats every day",
  },
  weekly: {
    label: "Weekly",
    emoji: "📆",
    description: "Repeats every week",
  },
  fortnightly: {
    label: "Fortnightly",
    emoji: "🗓️",
    description: "Repeats every 2 weeks",
  },
  monthly: {
    label: "Monthly",
    emoji: "📋",
    description: "Repeats every month",
  },
  custom_days: {
    label: "Custom Days",
    emoji: "🔢",
    description: "Repeats every X days",
  },
  custom_weekdays: {
    label: "Specific Weekdays",
    emoji: "📍",
    description: "Repeats on selected weekdays",
  },
  custom_monthday: {
    label: "Day of Month",
    emoji: "📌",
    description: "Repeats on a specific day each month",
  },
};

const WEEKDAY_LABELS = [
  { value: 0, label: "Sun", fullLabel: "Sunday" },
  { value: 1, label: "Mon", fullLabel: "Monday" },
  { value: 2, label: "Tue", fullLabel: "Tuesday" },
  { value: 3, label: "Wed", fullLabel: "Wednesday" },
  { value: 4, label: "Thu", fullLabel: "Thursday" },
  { value: 5, label: "Fri", fullLabel: "Friday" },
  { value: 6, label: "Sat", fullLabel: "Saturday" },
];

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

const getPreviewText = (config: Partial<RecurrenceConfig>): string => {
  if (!config.type) return "Select a recurrence type";

  const typeInfo = RECURRENCE_LABELS[config.type];
  let preview = typeInfo.description;

  switch (config.type) {
    case "custom_days":
      if (config.interval) {
        preview = `Repeats every ${config.interval} day${config.interval > 1 ? "s" : ""}`;
      }
      break;
    case "custom_weekdays":
      if (config.weekdays && config.weekdays.length > 0) {
        const labels = config.weekdays
          .sort()
          .map((d) => WEEKDAY_LABELS[d].label)
          .join(", ");
        preview = `Repeats on ${labels}`;
      }
      break;
    case "custom_monthday":
      if (config.monthday) {
        const suffix =
          config.monthday === 1
            ? "st"
            : config.monthday === 2
            ? "nd"
            : config.monthday === 3
            ? "rd"
            : "th";
        preview = `Repeats on the ${config.monthday}${suffix} of each month`;
      }
      break;
  }

  if (config.start_date) {
    preview += ` starting ${format(new Date(config.start_date), "MMM d, yyyy")}`;
  }

  if (config.end_date) {
    preview += ` until ${format(new Date(config.end_date), "MMM d, yyyy")}`;
  } else {
    preview += " (no end date)";
  }

  return preview;
};

// ================================================================
// MAIN COMPONENT
// ================================================================

export function RecurrenceConfigModal({
  open,
  onOpenChange,
  onConfirm,
  initialConfig,
  title = "Configure Recurrence",
  description = "Set up how often this task should repeat",
}: RecurrenceConfigModalProps) {
  // State
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    initialConfig?.type || "daily"
  );
  const [startDate, setStartDate] = useState<Date>(
    initialConfig?.start_date ? new Date(initialConfig.start_date) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialConfig?.end_date ? new Date(initialConfig.end_date) : undefined
  );
  const [interval, setInterval] = useState<number>(initialConfig?.interval || 1);
  const [weekdays, setWeekdays] = useState<Weekday[]>(
    initialConfig?.weekdays || []
  );
  const [monthday, setMonthday] = useState<number>(
    initialConfig?.monthday || 1
  );

  // Reset state when dialog opens with new initial config
  useEffect(() => {
    if (open && initialConfig) {
      setRecurrenceType(initialConfig.type);
      setStartDate(new Date(initialConfig.start_date));
      setEndDate(initialConfig.end_date ? new Date(initialConfig.end_date) : undefined);
      setInterval(initialConfig.interval || 1);
      setWeekdays(initialConfig.weekdays || []);
      setMonthday(initialConfig.monthday || 1);
    }
  }, [open, initialConfig]);

  // Handle weekday toggle
  const toggleWeekday = (day: Weekday) => {
    if (weekdays.includes(day)) {
      setWeekdays(weekdays.filter((d) => d !== day));
    } else {
      setWeekdays([...weekdays, day].sort());
    }
  };

  // Build current config for preview
  const currentConfig: Partial<RecurrenceConfig> = {
    type: recurrenceType,
    start_date: format(startDate, "yyyy-MM-dd"),
    end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
    interval: recurrenceType === "custom_days" ? interval : undefined,
    weekdays: recurrenceType === "custom_weekdays" ? weekdays : undefined,
    monthday: recurrenceType === "custom_monthday" ? monthday : undefined,
  };

  // Validation
  const isValid =
    recurrenceType &&
    startDate &&
    (recurrenceType !== "custom_days" || interval > 0) &&
    (recurrenceType !== "custom_weekdays" || weekdays.length > 0) &&
    (recurrenceType !== "custom_monthday" || (monthday >= 1 && monthday <= 31));

  // Handle confirm
  const handleConfirm = () => {
    if (!isValid) return;

    const config: RecurrenceConfig = {
      type: recurrenceType,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
      interval: recurrenceType === "custom_days" ? interval : undefined,
      weekdays: recurrenceType === "custom_weekdays" ? weekdays : undefined,
      monthday: recurrenceType === "custom_monthday" ? monthday : undefined,
    };

    onConfirm(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Recurrence Type Selector */}
          <div className="space-y-2">
            <Label htmlFor="recurrence-type">Recurrence Type</Label>
            <Select
              value={recurrenceType}
              onValueChange={(value) => setRecurrenceType(value as RecurrenceType)}
            >
              <SelectTrigger id="recurrence-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      <span>{RECURRENCE_LABELS[type].emoji}</span>
                      <span>{RECURRENCE_LABELS[type].label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {RECURRENCE_LABELS[recurrenceType].description}
            </p>
          </div>

          {/* Custom Days Interval */}
          {recurrenceType === "custom_days" && (
            <div className="space-y-2">
              <Label htmlFor="interval">Repeat Every (days)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="interval"
                  type="number"
                  min={1}
                  max={365}
                  value={interval}
                  onChange={(e) => setInterval(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">
                  day{interval > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}

          {/* Weekday Selector */}
          {recurrenceType === "custom_weekdays" && (
            <div className="space-y-3">
              <Label>Select Weekdays</Label>
              <div className="grid grid-cols-7 gap-2">
                {WEEKDAY_LABELS.map((day) => {
                  const isSelected = weekdays.includes(day.value as Weekday);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWeekday(day.value as Weekday)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-muted border-border hover:border-primary/50"
                      )}
                    >
                      <span className="text-xs font-medium">{day.label}</span>
                    </button>
                  );
                })}
              </div>
              {weekdays.length === 0 && (
                <p className="text-sm text-destructive">
                  Select at least one weekday
                </p>
              )}
            </div>
          )}

          {/* Month Day Selector */}
          {recurrenceType === "custom_monthday" && (
            <div className="space-y-2">
              <Label htmlFor="monthday">Day of Month</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="monthday"
                  type="number"
                  min={1}
                  max={31}
                  value={monthday}
                  onChange={(e) => setMonthday(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">
                  (1-31)
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Note: Months with fewer than {monthday} days will skip that occurrence
              </p>
            </div>
          )}

          <Separator />

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date (Optional) */}
            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "No end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {endDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEndDate(undefined)}
                  className="w-full"
                >
                  Clear End Date
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Preview */}
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Preview</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {getPreviewText(currentConfig)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            Confirm Recurrence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
