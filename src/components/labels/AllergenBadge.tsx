import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Allergen } from "@/hooks/useAllergens";

interface AllergenBadgeProps {
  allergen: Allergen;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const getSeverityIcon = (severity: string | null, size: string) => {
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  
  switch (severity) {
    case 'critical':
      return <AlertCircle className={cn(iconSize, "text-red-600")} />;
    case 'warning':
      return <AlertTriangle className={cn(iconSize, "text-yellow-600")} />;
    case 'info':
      return <Info className={cn(iconSize, "text-blue-600")} />;
    default:
      return null;
  }
};

const getSeverityStyles = (severity: string | null) => {
  switch (severity) {
    case 'critical':
      return "bg-red-100 text-red-900 border-red-300 hover:bg-red-200 font-semibold";
    case 'warning':
      return "bg-yellow-100 text-yellow-900 border-yellow-300 hover:bg-yellow-200 font-medium";
    case 'info':
      return "bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200";
    default:
      return "bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200";
  }
};

export function AllergenBadge({
  allergen,
  size = "md",
  showIcon = true,
  className,
}: AllergenBadgeProps) {
  const sizeClasses = {
    sm: "text-xs py-0.5 px-2",
    md: "text-sm py-1 px-3",
    lg: "text-base py-1.5 px-4",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-2 transition-all",
        getSeverityStyles(allergen.severity),
        sizeClasses[size],
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        {showIcon && allergen.icon && (
          <span className={cn(
            size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base"
          )}>
            {allergen.icon}
          </span>
        )}
        <span>{allergen.name}</span>
        {showIcon && getSeverityIcon(allergen.severity, size)}
      </div>
    </Badge>
  );
}

interface AllergenBadgeListProps {
  allergens: Allergen[];
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  maxDisplay?: number;
  className?: string;
}

export function AllergenBadgeList({
  allergens,
  size = "md",
  showIcon = true,
  maxDisplay,
  className,
}: AllergenBadgeListProps) {
  if (allergens.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No allergens
      </div>
    );
  }

  // Sort by severity (critical first)
  const sortedAllergens = [...allergens].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    const aSeverity = severityOrder[a.severity as keyof typeof severityOrder] ?? 3;
    const bSeverity = severityOrder[b.severity as keyof typeof severityOrder] ?? 3;
    return aSeverity - bSeverity;
  });

  const displayAllergens = maxDisplay
    ? sortedAllergens.slice(0, maxDisplay)
    : sortedAllergens;
  
  const remaining = maxDisplay && allergens.length > maxDisplay
    ? allergens.length - maxDisplay
    : 0;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {displayAllergens.map((allergen) => (
        <AllergenBadge
          key={allergen.id}
          allergen={allergen}
          size={size}
          showIcon={showIcon}
        />
      ))}
      {remaining > 0 && (
        <Badge
          variant="outline"
          className={cn(
            "bg-gray-100 text-gray-700 border-gray-300",
            size === "sm" ? "text-xs py-0.5 px-2" : 
            size === "lg" ? "text-base py-1.5 px-4" : 
            "text-sm py-1 px-3"
          )}
        >
          +{remaining} more
        </Badge>
      )}
    </div>
  );
}

interface AllergenWarningBoxProps {
  allergens: Allergen[];
  className?: string;
}

export function AllergenWarningBox({
  allergens,
  className,
}: AllergenWarningBoxProps) {
  if (allergens.length === 0) return null;

  const hasCritical = allergens.some(a => a.severity === 'critical');
  const criticalAllergens = allergens.filter(a => a.severity === 'critical');

  return (
    <div
      className={cn(
        "rounded-lg border-2 p-4",
        hasCritical
          ? "bg-red-50 border-red-300"
          : "bg-yellow-50 border-yellow-300",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {hasCritical ? (
            <AlertCircle className="h-6 w-6 text-red-600" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          )}
        </div>
        <div className="flex-1">
          <h4 className={cn(
            "font-semibold text-sm mb-2",
            hasCritical ? "text-red-900" : "text-yellow-900"
          )}>
            {hasCritical ? "⚠️ CRITICAL ALLERGEN WARNING" : "Allergen Information"}
          </h4>
          <p className={cn(
            "text-xs mb-3",
            hasCritical ? "text-red-800" : "text-yellow-800"
          )}>
            This product contains the following allergens:
          </p>
          <AllergenBadgeList
            allergens={allergens}
            size="sm"
            showIcon={true}
          />
          {hasCritical && criticalAllergens.length > 0 && (
            <p className="text-xs text-red-700 font-medium mt-3 border-t border-red-200 pt-2">
              ⚠️ Contains {criticalAllergens.length} critical allergen{criticalAllergens.length > 1 ? 's' : ''}: {criticalAllergens.map(a => a.name).join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
