import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface ComingSoonBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ComingSoonBadge({ className = "", size = "md" }: ComingSoonBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5"
  };

  return (
    <Badge 
      variant="outline" 
      className={`ml-2 border-dashed border-orange-400 text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400 ${sizeClasses[size]} ${className}`}
    >
      <Clock className={`mr-1 ${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />
      Coming Soon
    </Badge>
  );
}
