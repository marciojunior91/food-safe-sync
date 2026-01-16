import { LucideIcon, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  className?: string;
  flags?: {
    yellow?: number;
    green?: number;
  };
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon,
  className,
  flags
}: StatsCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-lg border shadow-card hover:shadow-card-hover transition-shadow p-6",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
          {change && (
            <p className={cn(
              "text-sm mt-2 font-medium",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
          {flags && (
            <div className="flex gap-3 mt-2">
              {flags.yellow !== undefined && flags.yellow > 0 && (
                <div className="flex items-center gap-1">
                  <Flag className="w-4 h-4 text-yellow-500" fill="currentColor" />
                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">{flags.yellow}</span>
                </div>
              )}
              {flags.green !== undefined && flags.green > 0 && (
                <div className="flex items-center gap-1">
                  <Flag className="w-4 h-4 text-green-500" fill="currentColor" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">{flags.green}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}