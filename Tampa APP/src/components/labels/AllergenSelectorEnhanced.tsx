import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { useAllergens, type Allergen } from "@/hooks/useAllergens";
import { cn } from "@/lib/utils";

export interface AllergenSelectorEnhancedProps {
  selectedAllergenIds: string[];
  onChange: (allergenIds: string[]) => void;
  disabled?: boolean;
  showCommonOnly?: boolean;
  className?: string;
  productId?: string; // If provided, will load existing allergens
}

const getSeverityIcon = (severity: string | null) => {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'info':
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return null;
  }
};

const getSeverityColor = (severity: string | null) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200';
    case 'info':
      return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200';
  }
};

export function AllergenSelectorEnhanced({
  selectedAllergenIds = [],
  onChange,
  disabled = false,
  showCommonOnly = false,
  className = "",
  productId,
}: AllergenSelectorEnhancedProps) {
  const { allergens, loading, getProductAllergens } = useAllergens();
  const [showAll, setShowAll] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  // Load existing allergens if productId is provided
  useEffect(() => {
    if (productId) {
      loadProductAllergens();
    }
  }, [productId]);

  const loadProductAllergens = async () => {
    if (!productId) return;
    
    setLoadingProduct(true);
    try {
      const productAllergens = await getProductAllergens(productId);
      const ids = productAllergens.map(a => a.id);
      onChange(ids);
    } catch (error) {
      console.error("Error loading product allergens:", error);
    } finally {
      setLoadingProduct(false);
    }
  };

  const toggleAllergen = (allergenId: string) => {
    if (disabled) return;
    
    const newSelected = selectedAllergenIds.includes(allergenId)
      ? selectedAllergenIds.filter(id => id !== allergenId)
      : [...selectedAllergenIds, allergenId];
    
    onChange(newSelected);
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const selectCommon = () => {
    if (disabled) return;
    const commonIds = allergens
      .filter(a => a.is_common)
      .map(a => a.id);
    onChange(commonIds);
  };

  const filteredAllergens = showCommonOnly || !showAll
    ? allergens.filter(a => a.is_common)
    : allergens;

  const selectedAllergens = allergens.filter(a => 
    selectedAllergenIds.includes(a.id)
  );

  const groupedAllergens = {
    critical: filteredAllergens.filter(a => a.severity === 'critical'),
    warning: filteredAllergens.filter(a => a.severity === 'warning'),
    info: filteredAllergens.filter(a => a.severity === 'info'),
  };

  if (loading || loadingProduct) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Allergens
        </Label>
        <div className="flex gap-2">
          {selectedAllergenIds.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={disabled}
            >
              Clear All
            </Button>
          )}
          {!showCommonOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              disabled={disabled}
            >
              {showAll ? 'Common Only' : 'Show All'}
            </Button>
          )}
        </div>
      </div>

      {/* Selected Allergens Display */}
      {selectedAllergens.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Selected Allergens ({selectedAllergens.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedAllergens.map(allergen => (
                <Badge
                  key={allergen.id}
                  variant="secondary"
                  className={cn(
                    "text-sm py-1 px-3 cursor-pointer",
                    getSeverityColor(allergen.severity)
                  )}
                  onClick={() => !disabled && toggleAllergen(allergen.id)}
                >
                  {allergen.icon && <span className="mr-1">{allergen.icon}</span>}
                  {allergen.name}
                  {!disabled && (
                    <X className="h-3 w-3 ml-1 inline" />
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allergen Selection */}
      <ScrollArea className="h-[300px] rounded-md border p-4">
        <div className="space-y-4">
          {/* Critical Allergens */}
          {groupedAllergens.critical.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <h4 className="text-sm font-semibold text-red-700">
                  Critical Allergens
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {groupedAllergens.critical.map(allergen => (
                  <AllergenCheckbox
                    key={allergen.id}
                    allergen={allergen}
                    checked={selectedAllergenIds.includes(allergen.id)}
                    onCheckedChange={() => toggleAllergen(allergen.id)}
                    disabled={disabled}
                  />
                ))}
              </div>
              <Separator className="mt-4" />
            </div>
          )}

          {/* Warning Level Allergens */}
          {groupedAllergens.warning.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <h4 className="text-sm font-semibold text-yellow-700">
                  Common Allergens
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {groupedAllergens.warning.map(allergen => (
                  <AllergenCheckbox
                    key={allergen.id}
                    allergen={allergen}
                    checked={selectedAllergenIds.includes(allergen.id)}
                    onCheckedChange={() => toggleAllergen(allergen.id)}
                    disabled={disabled}
                  />
                ))}
              </div>
              <Separator className="mt-4" />
            </div>
          )}

          {/* Info Level Allergens */}
          {groupedAllergens.info.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-blue-500" />
                <h4 className="text-sm font-semibold text-blue-700">
                  Other Allergens
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {groupedAllergens.info.map(allergen => (
                  <AllergenCheckbox
                    key={allergen.id}
                    allergen={allergen}
                    checked={selectedAllergenIds.includes(allergen.id)}
                    onCheckedChange={() => toggleAllergen(allergen.id)}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Info Text */}
      <p className="text-xs text-muted-foreground">
        {showCommonOnly || !showAll
          ? "Showing FDA/EU recognized major allergens (Top 14)"
          : "Showing all allergens including less common ones"}
      </p>
    </div>
  );
}

interface AllergenCheckboxProps {
  allergen: Allergen;
  checked: boolean;
  onCheckedChange: () => void;
  disabled?: boolean;
}

function AllergenCheckbox({
  allergen,
  checked,
  onCheckedChange,
  disabled,
}: AllergenCheckboxProps) {
  return (
    <div
      className={cn(
        "flex items-center space-x-3 rounded-md border p-3 transition-colors cursor-pointer",
        checked ? getSeverityColor(allergen.severity) : "hover:bg-accent",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !disabled && onCheckedChange()}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        id={`allergen-${allergen.id}`}
      />
      <label
        htmlFor={`allergen-${allergen.id}`}
        className="flex-1 cursor-pointer flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {allergen.icon && (
          <span className="text-lg">{allergen.icon}</span>
        )}
        <span>{allergen.name}</span>
        {allergen.severity && (
          <span className="ml-auto">
            {getSeverityIcon(allergen.severity)}
          </span>
        )}
      </label>
    </div>
  );
}
