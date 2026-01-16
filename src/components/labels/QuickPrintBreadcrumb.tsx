import { Fragment } from "react";
import { ChevronLeft, ChevronRight, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationLevel } from "@/constants/quickPrintIcons";
import { cn } from "@/lib/utils";

interface QuickPrintBreadcrumbProps {
  navigationStack: NavigationLevel[];
  onBack: () => void;
  onNavigateToLevel: (index: number) => void;
  className?: string;
}

export function QuickPrintBreadcrumb({
  navigationStack,
  onBack,
  onNavigateToLevel,
  className
}: QuickPrintBreadcrumbProps) {
  const canGoBack = navigationStack.length > 0;

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {/* Back Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onBack}
        disabled={!canGoBack}
        className="h-9"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back
      </Button>

      {/* Breadcrumb Trail */}
      <div className="flex items-center gap-2 flex-wrap">
        <FolderTree className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">Categories</span>

        {navigationStack.length > 0 && (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        )}

        {navigationStack.map((level, index) => (
          <Fragment key={index}>
            <Button
              variant="link"
              size="sm"
              onClick={() => onNavigateToLevel(index)}
              className="h-auto p-0 text-sm hover:text-primary"
            >
              <span className="mr-1 text-base">{level.icon}</span>
              {level.name}
            </Button>
            {index < navigationStack.length - 1 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
