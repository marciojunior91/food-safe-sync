import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LabelPreview } from "@/components/labels/LabelPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, Download, Share2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePrinter } from "@/hooks/usePrinter";
import { format } from "date-fns";

interface LabelData {
  id: string;
  product_id: string;
  product_name: string;
  category_id: string | null;
  category_name: string;
  condition: string;
  prepared_by: string;
  prepared_by_name: string;
  prep_date: string;
  expiry_date: string;
  quantity: string;
  unit: string;
  created_at: string;
}

export default function LabelPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { print, isLoading: isPrinting } = usePrinter('label-preview');
  
  const [label, setLabel] = useState<LabelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchLabel(id);
    }
  }, [id]);

  const fetchLabel = async (labelId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("printed_labels")
        .select(`
          id,
          product_id,
          product_name,
          category_id,
          category_name,
          condition,
          prepared_by,
          prepared_by_name,
          prep_date,
          expiry_date,
          quantity,
          unit,
          created_at
        `)
        .eq("id", labelId)
        .single();

      if (fetchError) throw fetchError;

      if (!data) {
        setError("Label not found");
        return;
      }

      setLabel(data as LabelData);
    } catch (err: any) {
      console.error("Error fetching label:", err);
      setError(err.message || "Failed to load label");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load label details",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!label) return;

    try {
      const success = await print({
        productName: label.product_name,
        categoryName: label.category_name,
        subcategoryName: undefined,
        preparedDate: label.prep_date,
        useByDate: label.expiry_date,
        allergens: [],
        storageInstructions: `Condition: ${label.condition}`,
        barcode: label.id, // Use label ID as barcode
      });

      if (success) {
        toast({
          title: "Print Success",
          description: "Label sent to printer",
        });
      }
    } catch (error) {
      console.error("Print error:", error);
      toast({
        variant: "destructive",
        title: "Print Error",
        description: "Failed to print label",
      });
    }
  };

  const handleShare = async () => {
    if (!label) return;

    const shareUrl = `${window.location.origin}/labels/${label.id}/preview`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Label: ${label.product_name}`,
          text: `Preview of ${label.product_name} label`,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Share error:", err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied",
        description: "Preview link copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading label preview...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !label) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold">Label Not Found</h3>
              <p className="text-muted-foreground">
                {error || "The requested label could not be found."}
              </p>
              <Button onClick={() => navigate(-1)} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate(-1)} variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Label Preview</h1>
            <p className="text-muted-foreground">
              Created {format(new Date(label.created_at), "MMM dd, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        
        {/* No status badge since it's not in the database */}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button 
          onClick={handlePrint} 
          disabled={isPrinting}
          variant="default"
          className="gap-2"
        >
          {isPrinting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Printing...
            </>
          ) : (
            <>
              <Printer className="w-4 h-4" />
              Print Label
            </>
          )}
        </Button>
        
        <Button onClick={handleShare} variant="outline" className="gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
        
        <Button 
          onClick={() => window.print()} 
          variant="outline" 
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export as PDF
        </Button>
      </div>

      {/* Label Preview */}
      <LabelPreview
        productName={label.product_name}
        categoryName={label.category_name}
        condition={label.condition}
        preparedByName={label.prepared_by_name}
        prepDate={label.prep_date}
        expiryDate={label.expiry_date}
        quantity={label.quantity}
        unit={label.unit}
        batchNumber={label.id.slice(0, 8)} // Use label ID first 8 chars as batch
        productId={label.product_id}
      />

      {/* Label Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Label Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Label ID</p>
              <p className="font-mono text-sm">{label.id.slice(0, 8)}...</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Product ID</p>
              <p className="font-mono text-sm">{label.product_id.slice(0, 8)}...</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Condition</p>
              <p className="text-sm font-medium uppercase">{label.condition}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="text-sm font-medium">{label.category_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quantity</p>
              <p className="text-sm font-medium">{label.quantity} {label.unit}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
