import { useState, useEffect } from "react";
import { 
  Plus, 
  Printer, 
  QrCode, 
  Calendar, 
  AlertTriangle,
  Search,
  Filter,
  Settings,
  Check,
  ChevronsUpDown,
  GitMerge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/StatsCard";
import { LabelForm, LabelData } from "@/components/labels/LabelForm";
import { TemplateManagement } from "@/components/labels/TemplateManagement";
import { UserSelectionDialog } from "@/components/labels/UserSelectionDialog";
import { QuickPrintGrid } from "@/components/labels/QuickPrintGrid";
import { MergeProductsAdmin } from "@/components/admin/MergeProductsAdmin";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { printLabel } from "@/utils/zebraPrinter";
import { getExpiryStatus, getStatusColor } from "@/utils/trafficLight";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function Labeling() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState<'overview' | 'templates' | 'form' | 'admin'>('overview');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    user_id: string;
    display_name: string | null;
  } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [organizationId, setOrganizationId] = useState<string>("");

  // Dashboard Stats State
  const [labelsToday, setLabelsToday] = useState(0);
  const [totalLabels, setTotalLabels] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [recentPrintedLabels, setRecentPrintedLabels] = useState<any[]>([]);

  // Quick Actions State
  const [products, setProducts] = useState<any[]>([]);
  const [openProduct, setOpenProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quickQuantity, setQuickQuantity] = useState(1);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
    fetchTemplates();
    fetchDashboardStats();
    fetchRecentLabels();
    fetchOrganizationId();
  }, []);

  const fetchOrganizationId = async () => {
    if (!user?.id) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      if (profile?.organization_id) {
        setOrganizationId(profile.organization_id);
      }
    } catch (error) {
      console.error("Error fetching organization_id:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          measuring_unit_id,
          measuring_units:measuring_unit_id (
            name,
            abbreviation
          )
        `)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("label_templates")
        .select("*")
        .order("name")
        .returns<any[]>();

      if (error) throw error;
      setTemplates(data || []);
      
      // Set default template (first one or the one named "Standard Food Label")
      if (data && data.length > 0) {
        const defaultTemplate = data.find(t => t.name === "Standard Food Label") || data[0];
        setSelectedTemplate(defaultTemplate);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get labels printed today
      const { count: todayCount, error: todayError } = await supabase
        .from("printed_labels")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString())
        .lt("created_at", tomorrow.toISOString());

      if (todayError) throw todayError;
      setLabelsToday(todayCount || 0);

      // Get total labels
      const { count: totalCount, error: totalError } = await supabase
        .from("printed_labels")
        .select("*", { count: "exact", head: true });

      if (totalError) throw totalError;
      setTotalLabels(totalCount || 0);

      // Get labels expiring in next 24 hours
      const now = new Date();
      const next24Hours = new Date();
      next24Hours.setHours(next24Hours.getHours() + 24);

      const { count: expiringCountData, error: expiringError } = await supabase
        .from("printed_labels")
        .select("*", { count: "exact", head: true })
        .gte("expiry_date", now.toISOString().split('T')[0])
        .lte("expiry_date", next24Hours.toISOString().split('T')[0]);

      if (expiringError) throw expiringError;
      setExpiringCount(expiringCountData || 0);

    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchRecentLabels = async () => {
    try {
      const { data, error } = await supabase
        .from("printed_labels")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentPrintedLabels(data || []);
    } catch (error) {
      console.error("Error fetching recent labels:", error);
    }
  };

  const handleQuickPrint = async () => {
    if (!selectedProduct) {
      toast({
        title: "Product Required",
        description: "Please select a product to print.",
        variant: "destructive"
      });
      return;
    }

    // Get current user info
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to print labels.",
        variant: "destructive"
      });
      return;
    }

    // Get user profile for display name
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();

    const now = new Date();
    const prepDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    // Default expiry 3 days for quick print example
    const expiryDateObj = new Date(now);
    expiryDateObj.setDate(now.getDate() + 3);
    const expiryDate = expiryDateObj.toISOString().split('T')[0];

    // Fetch allergens for the product
    let productAllergens: any[] = [];
    try {
      const { data: allergenData } = await supabase
        .from("product_allergens")
        .select(`
          allergen_id,
          allergens (
            id,
            name,
            icon,
            severity
          )
        `)
        .eq("product_id", selectedProduct.id);
      
      productAllergens = (allergenData || [])
        .map((pa: any) => pa.allergens)
        .filter(Boolean);
    } catch (error) {
      console.error("Error fetching allergens for quick print:", error);
    }

    const labelData = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      categoryId: null, // Quick print doesn't have category
      categoryName: "Quick Print",
      preparedBy: user.id,
      preparedByName: profile?.display_name || user.email || "Unknown",
      prepDate: prepDate,
      expiryDate: expiryDate,
      condition: "refrigerated", // Default condition for quick print
      quantity: quickQuantity.toString(),
      unit: selectedProduct.measuring_units?.abbreviation || "",
      batchNumber: selectedProduct.batch_number || "",
      allergens: productAllergens,
      };

    try {
      const result = await printLabel(labelData);
      
      if (result.success) {
        toast({
          title: "Label Sent to Printer",
          description: `Printing ${quickQuantity} label(s) for ${selectedProduct.name}`,
        });
        
        // Reload dashboard stats
        fetchDashboardStats();
        fetchRecentLabels();
      } else {
        toast({
          title: "Print Failed",
          description: result.error || "Could not connect to printer.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in quick print:", error);
      toast({
        title: "Print Failed",
        description: "An error occurred while printing.",
        variant: "destructive"
      });
    }
  };

  // Handler for QuickPrintGrid
  const handleQuickPrintFromGrid = async (product: any) => {
    // Get current user info
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to print labels.",
        variant: "destructive"
      });
      return;
    }

    // Get user profile for display name
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();

    const now = new Date();
    const prepDate = now.toISOString().split('T')[0];
    const expiryDateObj = new Date(now);
    expiryDateObj.setDate(now.getDate() + 3); // Default 3 days
    const expiryDate = expiryDateObj.toISOString().split('T')[0];

    // Fetch allergens for the product (if not already in product object)
    let productAllergens = product.allergens || [];
    if (!productAllergens || productAllergens.length === 0) {
      try {
        const { data: allergenData } = await supabase
          .from("product_allergens")
          .select(`
            allergen_id,
            allergens (
              id,
              name,
              icon,
              severity
            )
          `)
          .eq("product_id", product.id);
        
        productAllergens = (allergenData || [])
          .map((pa: any) => pa.allergens)
          .filter(Boolean);
      } catch (error) {
        console.error("Error fetching allergens for quick print:", error);
      }
    }

    const labelData = {
      productId: product.id,
      productName: product.name,
      categoryId: product.label_categories?.id || null,
      categoryName: product.label_categories?.name || "Quick Print",
      preparedBy: user.id,
      preparedByName: profile?.display_name || user.email || "Unknown",
      prepDate: prepDate,
      expiryDate: expiryDate,
      condition: "refrigerated",
      quantity: "1",
      unit: product.measuring_units?.abbreviation || "",
      batchNumber: "",
      allergens: productAllergens,
    };

    try {
      const result = await printLabel(labelData);
      
      if (result.success) {
        toast({
          title: "Label Sent to Printer",
          description: `Printing label for ${product.name}`,
        });
        fetchDashboardStats();
        fetchRecentLabels();
      } else {
        toast({
          title: "Print Failed",
          description: result.error || "Could not connect to printer.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in quick print:", error);
      toast({
        title: "Print Failed",
        description: "An error occurred while printing.",
        variant: "destructive"
      });
    }
  };


  const handleCreateLabel = () => {
    setUserDialogOpen(true);
  };

  const handleUserSelected = (user: { id: string; user_id: string; display_name: string | null }) => {
    setSelectedUser(user);
    setCurrentView('form');
  };

  const handleSaveLabel = (data: LabelData) => {
    toast({
      title: "Label Saved",
      description: "Your label has been saved as a draft.",
    });
    setCurrentView('overview');
  };

  const handlePrintLabel = async (data: LabelData) => {
    try {
      // Fetch allergens for the product
      let productAllergens: any[] = [];
      if (data.productId) {
        try {
          const { data: allergenData } = await supabase
            .from("product_allergens")
            .select(`
              allergen_id,
              allergens (
                id,
                name,
                icon,
                severity
              )
            `)
            .eq("product_id", data.productId);
          
          productAllergens = (allergenData || [])
            .map((pa: any) => pa.allergens)
            .filter(Boolean);
        } catch (error) {
          console.error("Error fetching allergens for print:", error);
        }
      }
      
      const result = await printLabel({
        productId: data.productId,
        productName: data.productName,
        categoryId: data.categoryId === "all" ? null : data.categoryId,
        categoryName: data.categoryName,
        preparedBy: data.preparedBy,
        preparedByName: data.preparedByName,
        prepDate: data.prepDate,
        expiryDate: data.expiryDate,
        condition: data.condition,
        quantity: data.quantity,
        unit: data.unit,
        batchNumber: data.batchNumber,
        allergens: productAllergens,
      });

      if (result.success) {
        toast({
          title: "Label Printed Successfully",
          description: `Label for ${data.productName} has been sent to the printer and saved to history.`,
        });
        
        // Reload dashboard stats
        fetchDashboardStats();
        fetchRecentLabels();
        
        setCurrentView('overview');
      } else {
        toast({
          title: "Print Failed",
          description: result.error || "Could not connect to printer.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error printing label:", error);
      toast({
        title: "Print Error",
        description: "An unexpected error occurred while printing.",
        variant: "destructive"
      });
    }
  };

  const handleCancelForm = () => {
    setCurrentView('overview');
  };

  if (currentView === 'form') {
    return (
      <>
        <LabelForm
          onSave={handleSaveLabel}
          onPrint={handlePrintLabel}
          onCancel={handleCancelForm}
          selectedUser={selectedUser || undefined}
          selectedTemplate={selectedTemplate || undefined}
        />
        <UserSelectionDialog
          open={userDialogOpen}
          onOpenChange={setUserDialogOpen}
          onSelectUser={handleUserSelected}
        />
      </>
    );
  }

  if (currentView === 'templates') {
    return (
      <TemplateManagement
        onCreateNew={handleCreateLabel}
        onBack={() => setCurrentView('overview')}
      />
    );
  }

  if (currentView === 'admin') {
    if (!isAdmin) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Admin Access Required</h1>
            <Button variant="outline" onClick={() => setCurrentView('overview')}>
              Back to Overview
            </Button>
          </div>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You need administrator privileges to access product duplicate management.
            </p>
          </div>
        </div>
      );
    }

    if (!organizationId) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Product Duplicate Management</h1>
            <Button variant="outline" onClick={() => setCurrentView('overview')}>
              Back to Overview
            </Button>
          </div>
          <div className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading organization information...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Product Duplicate Management</h1>
            <p className="text-muted-foreground mt-2">
              Identify and merge duplicate products to maintain data integrity
            </p>
          </div>
          <Button variant="outline" onClick={() => setCurrentView('overview')}>
            Back to Overview
          </Button>
        </div>
        <MergeProductsAdmin organizationId={organizationId} />
      </div>
    );
  }

  return (
    <>
      <UserSelectionDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        onSelectUser={handleUserSelected}
      />
      <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Label Management</h1>
          <p className="text-muted-foreground mt-2">
            Quick print labels with one tap - designed for busy kitchens
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <Button 
              variant="outline"
              onClick={() => setCurrentView('admin')}
              className="flex items-center gap-2"
            >
              <GitMerge className="w-4 h-4" />
              Manage Duplicates
            </Button>
          )}
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print Queue
          </Button>
          <Button 
            variant="outline"
            onClick={() => setCurrentView('templates')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Templates
          </Button>
          <Button variant="hero" onClick={handleCreateLabel}>
            <Plus className="w-4 h-4 mr-2" />
            New Label
          </Button>
        </div>
      </div>

      {/* SECTION 1: Quick Print Grid - PROMINENT & TOUCH-FRIENDLY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Quick Print</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tap any product to print a label instantly
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {products.length} products available
          </div>
        </div>
        <QuickPrintGrid 
          products={products}
          onQuickPrint={handleQuickPrintFromGrid}
        />
      </div>

      {/* SECTION 2: Dashboard Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground">Today's Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Labels Today"
            value={labelsToday}
            change={`Total: ${totalLabels} labels`}
            changeType="neutral"
            icon={Printer}
          />
          <StatsCard
            title="Recent Labels"
            value={recentPrintedLabels.length}
            change="Last 10 printed"
            changeType="neutral"
            icon={QrCode}
          />
          <StatsCard
            title="Expiring Soon"
            value={expiringCount}
            change="Next 24 hours"
            changeType={expiringCount > 10 ? "negative" : "neutral"}
            icon={AlertTriangle}
          />
          <StatsCard
            title="Compliance Rate"
            value={totalLabels > 0 ? "Active" : "No Data"}
            change={`${totalLabels} printed`}
            changeType="positive"
            icon={Calendar}
          />
        </div>
      </div>

      {/* SECTION 3: Template Preview & Recent Labels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Label Template */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Label Template</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentView('templates')}
            >
              <Settings className="w-4 h-4 mr-2" />
              View Template
            </Button>
          </div>
          
          <div className="bg-card rounded-lg border shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Standard Food Label</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Fixed template</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {[
                  "Product Name",
                  "Prep Date",
                  "Expiry Date",
                  "Staff Name",
                  "Quantity",
                  "Allergens",
                  "QR Code"
                ].map((field) => (
                  <span 
                    key={field}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium"
                  >
                    {field}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Compliant with Australian food labeling standards
              </p>
            </div>
          </div>
        </div>

        {/* Recent Labels */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Recent Labels</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search labels..." 
                  className="pl-10 w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {recentPrintedLabels.length === 0 ? (
              <div className="bg-card rounded-lg border shadow-card p-8 text-center">
                <Printer className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No labels printed yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start printing labels to see them here
                </p>
              </div>
            ) : (
              recentPrintedLabels
                .filter(label => 
                  searchTerm === "" || 
                  label.product_name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((label) => {
                  const expiryStatus = getExpiryStatus(label.expiry_date);
                  const statusColor = getStatusColor(expiryStatus);
                  
                  return (
                    <div key={label.id} className="bg-card rounded-lg border shadow-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{label.product_name}</h4>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium`}
                          style={{ 
                            backgroundColor: `${statusColor}20`, 
                            color: statusColor 
                          }}
                        >
                          {expiryStatus}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Category: {label.category_name || "N/A"}</p>
                        <p>Condition: {label.condition}</p>
                        <p>Prep: {new Date(label.prep_date).toLocaleDateString()} | Expires: {new Date(label.expiry_date).toLocaleDateString()}</p>
                        <p>By: {label.prepared_by_name} at {new Date(label.created_at).toLocaleTimeString()}</p>
                        {label.quantity && <p>Qty: {label.quantity} {label.unit}</p>}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}