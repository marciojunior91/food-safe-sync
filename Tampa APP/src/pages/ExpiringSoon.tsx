import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Search, Printer, Trash2, Package } from "lucide-react";
import { getExpiryStatus, getStatusColor, getStatusLabel } from "@/utils/trafficLight";
import { useToast } from "@/hooks/use-toast";
import { AllergenBadge } from "@/components/labels/AllergenBadge";

interface PrintedLabel {
  id: string;
  product_id: string;
  expiry_date: string;
  condition: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    category_id: string;
    label_categories?: {
      name: string;
    };
    product_allergens?: Array<{
      allergen_id: string;
      allergens: {
        id: string;
        name: string;
        icon: string;
        severity: string;
      };
    }>;
  };
}

export default function ExpiringSoon() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [labels, setLabels] = useState<PrintedLabel[]>([]);
  const [filteredLabels, setFilteredLabels] = useState<PrintedLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | "critical" | "warning">("all");

  useEffect(() => {
    fetchExpiringLabels();
  }, [user]);

  useEffect(() => {
    filterLabels();
  }, [searchQuery, urgencyFilter, labels]);

  const fetchExpiringLabels = async () => {
    try {
      if (!user?.id) return;

      // Get user's organization_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.organization_id) return;

      // Calculate date range (next 72 hours)
      const now = new Date();
      const in72Hours = new Date();
      in72Hours.setHours(in72Hours.getHours() + 72);

      // Fetch labels expiring in next 72 hours
      const { data, error } = await supabase
        .from('printed_labels')
        .select(`
          id,
          product_id,
          expiry_date,
          condition,
          created_at,
          product:products (
            id,
            name,
            category_id,
            label_categories:category_id (
              name
            ),
            product_allergens (
              allergen_id,
              allergens (
                id,
                name,
                icon,
                severity
              )
            )
          )
        `)
        .eq('organization_id', profile.organization_id)
        .gte('expiry_date', now.toISOString().split('T')[0])
        .lte('expiry_date', in72Hours.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true });

      if (error) throw error;

      setLabels(data || []);
    } catch (error) {
      console.error('Error fetching expiring labels:', error);
      toast({
        title: "Error",
        description: "Failed to load expiring products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLabels = () => {
    let filtered = [...labels];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(label =>
        label.product?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Urgency filter
    if (urgencyFilter !== "all") {
      filtered = filtered.filter(label => {
        const status = getExpiryStatus(label.expiry_date);
        if (urgencyFilter === "critical") return status === "expired";
        if (urgencyFilter === "warning") return status === "warning";
        return true;
      });
    }

    setFilteredLabels(filtered);
  };

  const handleMarkAsWaste = async (labelId: string) => {
    try {
      // TODO: Implement waste tracking
      toast({
        title: "Marked as Waste",
        description: "Product marked as waste (feature coming soon)",
      });
    } catch (error) {
      console.error('Error marking as waste:', error);
    }
  };

  const handleReprint = async (label: PrintedLabel) => {
    try {
      // TODO: Trigger print flow
      toast({
        title: "Reprint Label",
        description: "Reprinting label (feature coming soon)",
      });
    } catch (error) {
      console.error('Error reprinting:', error);
    }
  };

  // Stats
  const criticalCount = labels.filter(l => getExpiryStatus(l.expiry_date) === "expired").length;
  const warningCount = labels.filter(l => getExpiryStatus(l.expiry_date) === "warning").length;

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-orange-500" />
          Expiring Soon
        </h1>
        <p className="text-muted-foreground mt-1">
          Products expiring in the next 72 hours
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Expiring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{labels.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Next 72 hours</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
              Critical (&lt;24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {criticalCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate action</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              Warning (24-72h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {warningCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Monitor closely</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={urgencyFilter === "all" ? "default" : "outline"}
                onClick={() => setUrgencyFilter("all")}
              >
                All
              </Button>
              <Button
                variant={urgencyFilter === "critical" ? "destructive" : "outline"}
                onClick={() => setUrgencyFilter("critical")}
              >
                Critical
              </Button>
              <Button
                variant={urgencyFilter === "warning" ? "outline" : "outline"}
                onClick={() => setUrgencyFilter("warning")}
                className={urgencyFilter === "warning" ? "bg-yellow-500 text-white hover:bg-yellow-600" : ""}
              >
                Warning
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      {filteredLabels.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No expiring products found</p>
              <p className="text-sm mt-1">
                {searchQuery || urgencyFilter !== "all" 
                  ? "Try adjusting your filters"
                  : "All products are safe for now! 🎉"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLabels.map((label) => {
            const status = getExpiryStatus(label.expiry_date);
            const statusColor = getStatusColor(status);
            const statusLabel = getStatusLabel(status);

            return (
              <Card key={label.id} className={`border-l-4 ${
                status === 'expired' ? 'border-l-red-500' : 
                status === 'warning' ? 'border-l-yellow-500' : 
                'border-l-green-500'
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{label.product?.name}</CardTitle>
                      <CardDescription>
                        <span className="font-medium">Category:</span> {label.product?.label_categories?.name || "Unknown"}
                      </CardDescription>
                    </div>
                    <Badge className={statusColor}>
                      {statusLabel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Expiry Info */}
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="ml-2 font-medium">
                        {new Date(label.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Condition:</span>
                      <span className="ml-2 font-medium">{label.condition}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Printed:</span>
                      <span className="ml-2 font-medium">
                        {new Date(label.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Allergens */}
                  {label.product?.product_allergens && label.product.product_allergens.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">Allergens:</span>
                      {label.product.product_allergens.map((pa) => (
                        <AllergenBadge
                          key={pa.allergen_id}
                          allergen={{
                            ...pa.allergens,
                            is_common: false,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReprint(label)}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Reprint
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleMarkAsWaste(label.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Mark as Waste
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
