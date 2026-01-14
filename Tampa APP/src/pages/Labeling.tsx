import { useState, useEffect } from "react";
import { 
  Plus, 
  Printer, 
  QrCode, 
  Calendar, 
  AlertTriangle,
  Search,
  Filter,
  GitMerge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/StatsCard";
import { LabelForm, LabelData } from "@/components/labels/LabelForm";
import { UserSelectionDialog } from "@/components/labels/UserSelectionDialog";
import { QuickPrintDetailsDialog } from "@/components/labels/QuickPrintDetailsDialog";
import { RecipePrintDialog } from "@/components/recipes/RecipePrintDialog";
import { QuickPrintGrid } from "@/components/labels/QuickPrintGrid";
import { MergeProductsAdmin } from "@/components/admin/MergeProductsAdmin";
import { PrintQueue } from "@/components/shopping/PrintQueue";
import { PrintQueueBadge } from "@/components/shopping/PrintQueueBadge";
import { usePrintQueue } from "@/hooks/usePrintQueue";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { usePrinter } from "@/hooks/usePrinter";
import type { TeamMember } from "@/types/teamMembers";
import { supabase } from "@/integrations/supabase/client";
import { saveLabelToDatabase } from "@/utils/zebraPrinter";
import { getExpiryStatus, getStatusColor } from "@/utils/trafficLight";

export default function Labeling() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState<'overview' | 'form' | 'admin'>('overview');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [quickPrintDetailsOpen, setQuickPrintDetailsOpen] = useState(false);
  const [recipePrintDialogOpen, setRecipePrintDialogOpen] = useState(false);
  const [pendingQuickPrint, setPendingQuickPrint] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { print, isLoading: isPrinting } = usePrinter();
  const { openQueue, totalLabels: queueTotalLabels, items: queueItems, printAll: printQueueAll } = usePrintQueue();
  const [organizationId, setOrganizationId] = useState<string>("");

  // Dashboard Stats State
  const [labelsToday, setLabelsToday] = useState(0);
  const [totalLabels, setTotalLabels] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [recentPrintedLabels, setRecentPrintedLabels] = useState<any[]>([]);

  // Quick Actions State
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
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
      // Get user's organization_id first
      if (!user?.id) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      
      if (!profile?.organization_id) return;

      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          category_id,
          subcategory_id,
          measuring_unit_id,
          organization_id,
          measuring_units:measuring_unit_id (
            name,
            abbreviation
          ),
          label_categories:category_id (
            id,
            name
          ),
          product_allergens (
            allergen_id,
            allergens (
              id,
              name,
              icon,
              severity,
              is_common
            )
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order("name");

      if (error) throw error;
      
      // Transform product_allergens into allergens array
      const productsWithAllergens = (data || []).map(product => ({
        ...product,
        allergens: product.product_allergens
          ?.map((pa: any) => pa.allergens)
          .filter(Boolean) || []
      }));
      
      // Fetch latest printed label for each product to enable expiry warnings
      const productsWithLabels = await Promise.all(
        productsWithAllergens.map(async (product) => {
          const { data: latestLabel } = await supabase
            .from('printed_labels')
            .select('id, expiry_date, condition')
            .eq('product_id', product.id)
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          return {
            ...product,
            latestLabel
          };
        })
      );
      
      setProducts(productsWithLabels);
    } catch (error) {
      console.error("Error fetching products:", error);
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

  // Handler for QuickPrintGrid
  const handleQuickPrintFromGrid = async (product: any) => {
    // Store product and open user selection dialog
    setPendingQuickPrint(product);
    setUserDialogOpen(true);
  };


  const handleCreateLabel = () => {
    setPendingQuickPrint(null);
    setUserDialogOpen(true);
  };

  const handleUserSelected = (selectedUserData: TeamMember) => {
    setSelectedUser(selectedUserData);
    
    if (pendingQuickPrint) {
      // Check if it's a recipe (has shelf_life_days property from recipes table)
      if (pendingQuickPrint.shelf_life_days !== undefined) {
        // It's a recipe - open recipe print dialog
        setRecipePrintDialogOpen(true);
      } else {
        // It's a regular product - open quick print details dialog
        setQuickPrintDetailsOpen(true);
      }
    } else {
      // Open form for new label creation
      setCurrentView('form');
    }
  };

  const handleQuickPrintDetailsConfirmed = (details: { quantity: string; unit: string; condition: string }) => {
    if (pendingQuickPrint && selectedUser) {
      executeQuickPrint(pendingQuickPrint, selectedUser, details);
      setPendingQuickPrint(null);
      setQuickPrintDetailsOpen(false);
    }
  };

  const executeQuickPrint = async (
    product: any, 
    selectedUserData: TeamMember,
    details?: { quantity: string; unit: string; condition: string }
  ) => {
    if (!organizationId) {
      toast({
        title: "Organization Required",
        description: "Could not determine your organization. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }

    // Get user_id - either from team_member.auth_role_id or fallback to current logged-in user
    let userId: string;
    if (selectedUserData.auth_role_id) {
      userId = selectedUserData.auth_role_id;
    } else {
      // Fallback: use current logged-in user (this maintains backward compatibility)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast({
          title: "Authentication Error",
          description: "Unable to determine user. Please refresh the page.",
          variant: "destructive"
        });
        return;
      }
      userId = currentUser.id;
      
      // Show warning that team member needs to be linked
      console.warn(`Team member ${selectedUserData.display_name} (${selectedUserData.id}) is not linked to a user account. Using current user as fallback.`);
    }

    const now = new Date();
    const prepDate = now.toISOString().split('T')[0];
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
        .eq("product_id", product.id);
      
      productAllergens = (allergenData || [])
        .map((pa: any) => pa.allergens)
        .filter(Boolean);
    } catch (error) {
      console.error("Error fetching allergens for quick print:", error);
    }

    const labelData = {
      productId: product.id,
      productName: product.name,
      categoryId: product.label_categories?.id || null,
      categoryName: product.label_categories?.name || "Quick Print",
      preparedBy: userId, // ✅ Use auth_role_id or fallback to current user
      preparedByName: selectedUserData.display_name || "Unknown",
      prepDate: prepDate,
      expiryDate: expiryDate,
      condition: details?.condition || "REFRIGERATED",
      quantity: details?.quantity || "1",
      unit: details?.unit || product.measuring_units?.abbreviation || "Unit",
      batchNumber: "",
      allergens: productAllergens,
      organizationId: organizationId, // Required for RLS
    };

    try {
      // Save to database first
      await saveLabelToDatabase(labelData);
      
      // Print using new printer system - pass complete label data
      const success = await print({
        productName: product.name,
        categoryName: product.label_categories?.name || "Quick Print",
        preparedDate: prepDate,
        useByDate: expiryDate,
        preparedByName: selectedUserData.display_name || "Unknown", // ✅ Pass team member name
        allergens: productAllergens.map((a: any) => a.name),
        storageInstructions: details?.condition || "REFRIGERATED",
        quantity: details?.quantity || "1",
        unit: details?.unit || product.measuring_units?.abbreviation || "Unit",
        condition: details?.condition || "REFRIGERATED",
      });
      
      if (success) {
        toast({
          title: "Label Sent to Printer",
          description: `Printing label for ${product.name} prepared by ${selectedUserData.display_name}`,
        });
        fetchDashboardStats();
        fetchRecentLabels();
      } else {
        toast({
          title: "Print Failed",
          description: "Could not connect to printer.",
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

  const handleSaveLabel = (data: LabelData) => {
    toast({
      title: "Label Saved",
      description: "Your label has been saved as a draft.",
    });
    setCurrentView('overview');
  };

  const handlePrintLabel = async (data: LabelData) => {
    if (!organizationId) {
      toast({
        title: "Organization Required",
        description: "Could not determine your organization. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }

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
      
      // Save to database first
      await saveLabelToDatabase({
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
        organizationId: organizationId, // Required for RLS
      });

      // Print using new printer system - pass complete label data
      const success = await print({
        productName: data.productName,
        categoryName: data.categoryName,
        subcategoryName: data.subcategoryName,
        preparedDate: data.prepDate,
        useByDate: data.expiryDate,
        preparedByName: data.preparedByName, // ✅ Pass prepared by name from form
        allergens: productAllergens.map(a => a.name),
        storageInstructions: `Condition: ${data.condition}`,
        barcode: data.batchNumber,
        quantity: data.quantity,
        unit: data.unit,
        condition: data.condition,
      });

      if (success) {
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
          description: "Could not connect to printer.",
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
        />
        <UserSelectionDialog
          open={userDialogOpen}
          onOpenChange={setUserDialogOpen}
          onSelectUser={handleUserSelected}
        />
      </>
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
      <QuickPrintDetailsDialog
        open={quickPrintDetailsOpen}
        onOpenChange={setQuickPrintDetailsOpen}
        onConfirm={handleQuickPrintDetailsConfirmed}
        productName={pendingQuickPrint?.name || ""}
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
          <Button variant="outline" onClick={openQueue}>
            <Printer className="w-4 h-4 mr-2" />
            Print Queue
            {queueTotalLabels > 0 && (
              <Badge variant="default" className="ml-2">
                {queueTotalLabels}
              </Badge>
            )}
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

      {/* SECTION 3: Recent Labels */}
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

      {/* Print Queue Components */}
      <PrintQueue />
      <PrintQueueBadge />

      {/* Recipe Print Dialog */}
      {pendingQuickPrint && selectedUser && (
        <RecipePrintDialog
          open={recipePrintDialogOpen}
          onOpenChange={(open) => {
            setRecipePrintDialogOpen(open);
            if (!open) {
              setPendingQuickPrint(null);
              setSelectedUser(null);
            }
          }}
          recipe={{
            id: pendingQuickPrint.id,
            name: pendingQuickPrint.name,
            shelf_life_days: pendingQuickPrint.shelf_life_days,
            allergens: pendingQuickPrint.allergens
          }}
          initialUser={selectedUser ? {
            id: selectedUser.id,
            display_name: selectedUser.display_name
          } : null}
        />
      )}
    </>
  );
}