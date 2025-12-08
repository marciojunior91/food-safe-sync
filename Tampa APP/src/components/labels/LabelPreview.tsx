import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { Eye } from "lucide-react";

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
}: LabelPreviewProps) {
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
        </div>

        {/* Info Note */}
        <div className="mt-4 text-xs text-muted-foreground text-center">
          This is a preview. Actual printed label may vary based on printer settings.
        </div>
      </CardContent>
    </Card>
  );
}
