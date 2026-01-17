import { memo } from "react";

/**
 * TimelineGrid component
 * Displays a 24-hour grid with hour markers and lines
 */
export const TimelineGrid = memo(() => {
  // Generate 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="relative h-[1440px] bg-muted/20">
      {/* Hour grid lines and labels */}
      {hours.map((hour) => {
        const topPosition = (hour / 24) * 100;
        const formattedHour = hour.toString().padStart(2, "0") + ":00";
        
        return (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-muted"
            style={{ top: `${topPosition}%` }}
          >
            {/* Hour label */}
            <div className="absolute -left-1 -top-3 w-16 text-right pr-2">
              <span className="text-xs font-medium text-muted-foreground">
                {formattedHour}
              </span>
            </div>
            
            {/* 15-minute subdivision lines */}
            <div
              className="absolute left-0 right-0 border-t border-dashed border-muted/40"
              style={{ top: "25%" }}
            />
            <div
              className="absolute left-0 right-0 border-t border-dashed border-muted/40"
              style={{ top: "50%" }}
            />
            <div
              className="absolute left-0 right-0 border-t border-dashed border-muted/40"
              style={{ top: "75%" }}
            />
          </div>
        );
      })}
      
      {/* Vertical line separating time labels from task area */}
      <div className="absolute left-16 top-0 bottom-0 border-r-2 border-muted" />
    </div>
  );
});

TimelineGrid.displayName = "TimelineGrid";
