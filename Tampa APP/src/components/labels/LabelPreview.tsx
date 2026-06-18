import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

import { useAllergens } from "@/hooks/useAllergens";
import { formatDateDMY } from "@/utils/labelZpl";

interface LabelPreviewProps {
  productName: string;
  categoryName: string;
  condition: string;
  preparedByName: string;
  prepDate: string;
  expiryDate: string;
  quantity: string;
  unit: string;
  batchNumber: string;
  productId?: string;
  labelId?: string;
  templateType?: "default" | "recipe" | "allergen" | "blank";
  templateName?: string; // To detect "Blank" template
  isBlankTemplate?: boolean; // Direct flag for blank templates
  allergens?: Array<{ id: string; name: string; icon?: string | null; severity?: string }>; // Pre-fetched allergens (overrides internal fetch)
}

export function LabelPreview({
  productName,
  categoryName,
  condition,
  preparedByName,
  prepDate,
  expiryDate,
  quantity,
  unit,
  productId,
  templateName,
  isBlankTemplate = false,
  allergens: allergensProp,
}: LabelPreviewProps) {
  const { getProductAllergens } = useAllergens();
  const [fetchedAllergens, setFetchedAllergens] = useState<any[]>([]);
  const [loadingAllergens, setLoadingAllergens] = useState(false);

  // Use pre-fetched allergens if provided, otherwise load via productId
  const allergens = allergensProp ?? fetchedAllergens;

  // Only do internal fetch when no allergens were passed as prop
  useEffect(() => {
    if (allergensProp !== undefined) return; // parent already supplied them
    if (productId) {
      loadAllergens();
    } else {
      setFetchedAllergens([]);
    }
  }, [productId, allergensProp]);

  const loadAllergens = async () => {
    if (!productId) return;
    
    setLoadingAllergens(true);
    try {
      const productAllergens = await getProductAllergens(productId);
      setFetchedAllergens(productAllergens);
    } catch (error) {
      console.error("Error loading allergens for preview:", error);
      setFetchedAllergens([]);
    } finally {
      setLoadingAllergens(false);
    }
  };

  // Format dates as DD/MM/YYYY to match the printed label exactly.
  const formattedPrepDate = formatDateDMY(prepDate);
  const formattedExpiryDate = formatDateDMY(expiryDate);

  // Check if this is a blank template (either by name or explicit flag)
  const isBlank = isBlankTemplate || templateName?.toLowerCase() === "blank";

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="w-5 h-5" />
            Label Preview
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 space-y-4 bg-white dark:bg-gray-950">
          {/* Blank Template - Show Empty Preview */}
          {isBlank ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Eye className="w-10 h-10 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Blank Template
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                This template has no predefined layout. The printer will use its own formatting or custom ZPL code.
              </p>
              {templateName && (
                <Badge variant="outline" className="text-xs mt-2">
                  {templateName.toUpperCase()}
                </Badge>
              )}
            </div>
          ) : (
            <>
              {/* PRODUCT NAME + CATEGORY — mirrors the printed ZPL header */}
              <div className="text-center border-b-2 border-gray-300 dark:border-gray-700 pb-3">
                <h3 className="text-3xl font-bold uppercase text-gray-900 dark:text-gray-100 leading-tight">
                  {productName || "Product Name"}
                </h3>
                {categoryName && (
                  <p className="text-sm text-muted-foreground mt-1 uppercase">{categoryName}</p>
                )}
              </div>

              {/* DATES (bold) */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">PREPARED DATE</span>
                  <span className="text-base font-bold text-gray-900 dark:text-gray-100">{formattedPrepDate}</span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">EXPIRE DATE</span>
                  <span className="text-base font-bold text-red-600 dark:text-red-400">{formattedExpiryDate}</span>
                </div>
              </div>

              {/* BODY — printed by / quantity / condition */}
              <div className="border-t-2 border-gray-300 dark:border-gray-700 pt-3 space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">PRINTED BY</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{preparedByName || "Unknown"}</span>
                </div>
                {quantity && (
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">QUANTITY</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase">
                      {quantity}{unit ? ` ${unit}` : ""}
                    </span>
                  </div>
                )}
                {condition && (
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">CONDITION</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase">{condition}</span>
                  </div>
                )}
              </div>

              {/* ALLERGENS */}
              {loadingAllergens ? (
                <p className="text-xs text-muted-foreground animate-pulse">Loading allergens...</p>
              ) : allergens.length > 0 && (
                <div className="border-t-2 border-gray-300 dark:border-gray-700 pt-3">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ALLERGENS</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase">
                    {allergens.map((a: any) => a.name).join(", ")}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info Note */}
        <div className="mt-4 text-xs text-muted-foreground text-center">
          This is a preview. Actual printed label may vary based on printer settings.
        </div>
      </CardContent>
    </Card>
  );
}
