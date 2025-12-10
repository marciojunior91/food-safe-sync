import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import { AllergenWarningBox } from "./AllergenBadge";
import { useAllergens } from "@/hooks/useAllergens";

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
  templateType?: "default" | "recipe" | "allergen";
  templateName?: string; // To detect "Blank" template
  isBlankTemplate?: boolean; // Direct flag for blank templates
}

const CONDITION_COLORS = {
  fresh: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cooked: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  frozen: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  dry: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  refrigerated: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  thawed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export function LabelPreview({
  productName,
  categoryName,
  condition,
  preparedByName,
  prepDate,
  expiryDate,
  quantity,
  unit,
  batchNumber,
  productId,
  templateType = "default",
  templateName,
  isBlankTemplate = false,
}: LabelPreviewProps) {
  const { getProductAllergens } = useAllergens();
  const [allergens, setAllergens] = useState<any[]>([]);
  const [loadingAllergens, setLoadingAllergens] = useState(false);

  // Load allergens when productId changes
  useEffect(() => {
    if (productId) {
      loadAllergens();
    } else {
      setAllergens([]);
    }
  }, [productId]);

  const loadAllergens = async () => {
    if (!productId) return;
    
    setLoadingAllergens(true);
    try {
      const productAllergens = await getProductAllergens(productId);
      setAllergens(productAllergens);
    } catch (error) {
      console.error("Error loading allergens for preview:", error);
      setAllergens([]);
    } finally {
      setLoadingAllergens(false);
    }
  };

  // Generate QR code data
  const qrData = JSON.stringify({
    productId: productId || "",
    productName,
    prepDate,
    expiryDate,
    batchNumber,
    timestamp: new Date().toISOString(),
  });

  // Format dates for display
  const formattedPrepDate = prepDate ? format(new Date(prepDate), "MMM dd, yyyy") : "";
  const formattedExpiryDate = expiryDate ? format(new Date(expiryDate), "MMM dd, yyyy") : "";

  // Get condition color
  const conditionColor = CONDITION_COLORS[condition as keyof typeof CONDITION_COLORS] || "bg-gray-100 text-gray-800";

  // Check if this is a blank template (either by name or explicit flag)
  const isBlank = isBlankTemplate || templateName?.toLowerCase() === "blank";

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="w-5 h-5" />
          Label Preview
        </CardTitle>
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
              {/* Header Section */}
              <div className="text-center border-b-2 border-gray-200 dark:border-gray-800 pb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{productName || "Product Name"}</h3>
                {categoryName && (
                  <p className="text-sm text-muted-foreground mt-1">{categoryName}</p>
                )}
              </div>

          {/* Main Content Section */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column - Info */}
            <div className="space-y-3">
              {/* Condition Badge */}
              {condition && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">CONDITION</p>
                  <Badge className={`${conditionColor} font-semibold uppercase text-xs`}>
                    {condition}
                  </Badge>
                </div>
              )}

              {/* Prepared By */}
              {preparedByName && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">PREPARED BY</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{preparedByName}</p>
                </div>
              )}

              {/* Prep Date */}
              {prepDate && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">PREP DATE</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formattedPrepDate}</p>
                </div>
              )}

              {/* Expiry Date */}
              {expiryDate && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">USE BY</p>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">{formattedExpiryDate}</p>
                </div>
              )}

              {/* Quantity */}
              {quantity && unit && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">QUANTITY</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {quantity} {unit}
                  </p>
                </div>
              )}

              {/* Batch Number */}
              {batchNumber && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">BATCH #</p>
                  <p className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">{batchNumber}</p>
                </div>
              )}
            </div>

            {/* Right Column - QR Code */}
            <div className="flex flex-col items-center justify-center">
              {productName && prepDate && expiryDate ? (
                <>
                  <QRCodeSVG
                    value={qrData}
                    size={140}
                    level="H"
                    includeMargin={false}
                    className="border-2 border-gray-200 dark:border-gray-700 rounded"
                  />
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Scan for details
                  </p>
                </>
              ) : (
                <div className="w-36 h-36 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded flex items-center justify-center">
                  <p className="text-xs text-center text-muted-foreground px-2">
                    Fill in required fields to generate QR code
                  </p>
                </div>
              )}
            </div>
          </div>

              {/* Footer - Template Type Badge */}
              <div className="border-t-2 border-gray-200 dark:border-gray-800 pt-3 flex justify-between items-center">
                <Badge variant="outline" className="text-xs">
                  {templateType.toUpperCase()} TEMPLATE
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(), "yyyy-MM-dd HH:mm")}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Allergen Warning Box */}
        {productId && allergens.length > 0 && (
          <div className="mt-4">
            <AllergenWarningBox allergens={allergens} />
          </div>
        )}

        {/* Loading State for Allergens */}
        {productId && loadingAllergens && (
          <div className="mt-4 text-sm text-muted-foreground text-center animate-pulse">
            Loading allergen information...
          </div>
        )}

        {/* Info Note */}
        <div className="mt-4 text-xs text-muted-foreground text-center">
          This is a preview. Actual printed label may vary based on printer settings.
        </div>
      </CardContent>
    </Card>
  );
}
