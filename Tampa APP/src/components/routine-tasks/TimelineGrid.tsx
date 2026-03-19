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
            className="absolute left-0 right-0"
            style={{ top: `${topPosition}%` }}
          >
            {/* Hour label — stays in the left time-label column */}
            <div className="absolute -left-1 -top-3 w-16 text-right pr-2">
              <span className="text-xs font-medium text-muted-foreground">
                {formattedHour}
              </span>
            </div>

            {/* Hour border line — only to the right of the vertical separator */}
            <div className="absolute left-16 right-0 border-t border-muted" />
          </div>
        );
      })}

      {/* 15-minute subdivision lines — rendered at grandparent level so
          percentage `top` values are relative to the 1440px container */}
      {hours.map((hour) =>
        [0.25, 0.5, 0.75].map((fraction) => (
          <div
            key={`sub-${hour}-${fraction}`}
            className="absolute left-16 right-0 border-t border-dashed border-muted/40"
            style={{ top: `${((hour + fraction) / 24) * 100}%` }}
          />
        ))
      )}

      {/* Vertical line separating time labels from task area */}
      <div className="absolute left-16 top-0 bottom-0 border-r-2 border-muted" />
    </div>
  );
});

TimelineGrid.displayName = "TimelineGrid";
