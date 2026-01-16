import { AlertCircle, CheckCircle2, Clock, Tag } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SimilarProduct } from "@/hooks/useDuplicateDetection";
import { format } from "date-fns";

interface DuplicateProductWarningProps {
  similarProducts: SimilarProduct[];
  isLoading: boolean;
  isDuplicate: boolean;
  error: string | null;
  onSelectProduct?: (product: SimilarProduct) => void;
  onProceedAnyway?: () => void;
  showProceedButton?: boolean;
}

/**
 * Component to display duplicate product warnings
 * 
 * Features:
 * - Shows critical warning for high similarity (85%+)
 * - Displays list of similar products with scores
 * - Shows category, allergens, last printed date
 * - Allows selecting existing product or proceeding anyway
 */
export function DuplicateProductWarning({
  similarProducts,
  isLoading,
  isDuplicate,
  error,
  onSelectProduct,
  onProceedAnyway,
  showProceedButton = true,
}: DuplicateProductWarningProps) {
  // Don't show anything if no similar products and not loading
  if (!isLoading && similarProducts.length === 0 && !error) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Checking Duplicates</AlertTitle>
        <AlertDescription className="text-sm">{error}</AlertDescription>
      </Alert>
    );
  }

  // No similar products found
  if (similarProducts.length === 0) {
    return null;
  }

  // Determine severity based on similarity scores
  const highestSimilarity = Math.max(
    ...similarProducts.map((p) => p.similarity_score)
  );
  const isCritical = highestSimilarity >= 0.85 || isDuplicate;

  return (
    <Alert
      variant={isCritical ? "destructive" : "default"}
      className={isCritical ? "border-red-500" : "border-yellow-500 bg-yellow-50"}
    >
      <AlertCircle className={`h-4 w-4 ${isCritical ? "" : "text-yellow-600"}`} />
      <AlertTitle className="mb-3">
        {isCritical
          ? "⚠️ Potential Duplicate Product Detected"
          : "Similar Products Found"}
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-3">
          <p className="text-sm">
            {isCritical
              ? "A very similar product already exists. Please review before creating:"
              : `Found ${similarProducts.length} similar product${similarProducts.length > 1 ? "s" : ""}. Consider using an existing product:`}
          </p>

          {/* Similar products list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {similarProducts.map((product) => (
              <Card
                key={product.product_id}
                className="border-gray-200 hover:border-gray-300 transition-colors"
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      {/* Product name and similarity */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {product.product_name}
                        </span>
                        <Badge
                          variant={
                            product.similarity_score >= 0.85
                              ? "destructive"
                              : product.similarity_score >= 0.6
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {Math.round(product.similarity_score * 100)}% match
                        </Badge>
                      </div>

                      {/* Category and subcategory */}
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Tag className="h-3 w-3" />
                        <span>
                          {product.category_name}
                          {product.subcategory_name &&
                            ` → ${product.subcategory_name}`}
                        </span>
                      </div>

                      {/* Additional info */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {/* Allergen count */}
                        {product.allergen_count > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="text-base">⚠️</span>
                            {product.allergen_count} allergen
                            {product.allergen_count > 1 ? "s" : ""}
                          </span>
                        )}

                        {/* Last printed */}
                        {product.last_printed && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last printed:{" "}
                            {format(
                              new Date(product.last_printed),
                              "MMM d, yyyy"
                            )}
                          </span>
                        )}

                        {!product.last_printed && (
                          <span className="flex items-center gap-1 text-gray-400">
                            <Clock className="h-3 w-3" />
                            Never printed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Select button */}
                    {onSelectProduct && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSelectProduct(product)}
                        className="shrink-0"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Use This
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action buttons */}
          {showProceedButton && onProceedAnyway && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant={isCritical ? "destructive" : "default"}
                onClick={onProceedAnyway}
                className="w-full"
              >
                {isCritical
                  ? "Create New Product Anyway"
                  : "Proceed with New Product"}
              </Button>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
