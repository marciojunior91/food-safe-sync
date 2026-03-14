import { useState, useEffect } from "react";
import { 
  Plus, 
  Printer, 
  QrCode, 
  Calendar, 
  AlertTriangle,
  Search,
  Filter,
  GitMerge,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/StatsCard";
import { LabelForm, LabelData } from "@/components/labels/LabelForm";
import { UserSelectionDialog } from "@/components/labels/UserSelectionDialog";
import { QuickPrintDetailsDialog } from "@/components/labels/QuickPrintDetailsDialog";
import { RecipePrintDialog } from "@/components/recipes/RecipePrintDialog";
import { CreateCategoryDialog } from "@/components/labels/CreateCategoryDialog";
import { QuickPrintGrid } from "@/components/labels/QuickPrintGrid";
import { MergeProductsAdmin } from "@/components/admin/MergeProductsAdmin";
import { PrintQueue } from "@/components/shopping/PrintQueue";
import { PrintQueueBadge } from "@/components/shopping/PrintQueueBadge";
import { usePrintQueue } from "@/hooks/usePrintQueue";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { usePrinter } from "@/hooks/usePrinter";
import { useTeamMemberSelection } from "@/hooks/useTeamMemberSelection";
import type { TeamMember } from "@/types/teamMembers";
import { supabase } from "@/integrations/supabase/client";
import { saveLabelToDatabase } from "@/utils/zebraPrinter";
import { getExpiryStatus, getStatusColor } from "@/utils/trafficLight";
import { calculateExpiryDate } from "@/utils/dateCalculations";
import type { StorageCondition } from "@/utils/dateCalculations";

export default function Labeling() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState<'overview' | 'form' | 'admin'>('overview');
  const [quickPrintDetailsOpen, setQuickPrintDetailsOpen] = useState(false);
  const [recipePrintDialogOpen, setRecipePrintDialogOpen] = useState(false);
  const [pendingQuickPrint, setPendingQuickPrint] = useState<any | null>(null);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false); // Sprint 3 T13.1: Category creation modal
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { print, isLoading: isPrinting } = usePrinter('labeling-quick-print');
  const { openQueue, totalLabels: queueTotalLabels, items: queueItems, printAll: printQueueAll } = usePrintQueue();
  const [organizationId, setOrganizationId] = useState<string>("");
  
  // T1.2: Team Member Selection Hook (auto-opens modal if not selected)
  const {
    teamMember: selectedUser,
    isModalOpen: userDialogOpen,
    closeModal: closeUserDialog,
    selectTeamMember: handleUserSelected,
    openModal: openUserDialog,
    clearSelection: clearUserSelection
  } = useTeamMemberSelection();

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
      
      // BUG-005 FIX: Fetch ALL latest labels in 1 query instead of N queries
      const { data: allLabels } = await supabase
        .from('printed_labels')
        .select('product_id, id, expiry_date, condition, created_at')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });
      
      // Group labels by product_id and keep only the latest
      const latestLabelsByProduct = (allLabels || []).reduce((acc: any, label: any) => {
        if (!acc[label.product_id]) {
          acc[label.product_id] = label;
        }
        return acc;
      }, {});
      
      // Attach latest label to each product
      const productsWithLabels = productsWithAllergens.map(product => ({
        ...product,
        latestLabel: latestLabelsByProduct[product.id] || null
      }));
      
      setProducts(productsWithLabels);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Get user's organization_id first
      if (!user?.id) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
      
      if (!profile?.organization_id) return;

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get labels printed today - WITH ORG FILTER (BUG-004 FIX)
      const { count: todayCount, error: todayError } = await supabase
        .from("printed_labels")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
        .gte("created_at", today.toISOString())
        .lt("created_at", tomorrow.toISOString());

      if (todayError) throw todayError;
      setLabelsToday(todayCount || 0);

      // Get total labels - WITH ORG FILTER (BUG-004 FIX)
      const { count: totalCount, error: totalError } = await supabase
        .from("printed_labels")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id);

      if (totalError) throw totalError;
      setTotalLabels(totalCount || 0);

      // Get labels expiring in next 24 hours - WITH ORG FILTER (BUG-004 FIX)
      const now = new Date();
      const next24Hours = new Date();
      next24Hours.setHours(next24Hours.getHours() + 24);

      const { count: expiringCountData, error: expiringError } = await supabase
        .from("printed_labels")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
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
    setPendingQuickPrint(product);
    
    // T1.2: Only open dialog if no team member selected yet
    if (!selectedUser) {
      openUserDialog();
    } else {
      // Team member already selected, proceed directly
      if (product.shelf_life_days !== undefined) {
        setRecipePrintDialogOpen(true);
      } else {
        setQuickPrintDetailsOpen(true);
      }
    }
  };


  const handleCreateLabel = () => {
    setPendingQuickPrint(null);
    
    // T1.2: Only open dialog if no team member selected yet
    if (!selectedUser) {
      openUserDialog();
    } else {
      // Team member already selected, go straight to form
      setCurrentView('form');
    }
  };

  // T1.2: Wrapper for team member selection to handle post-selection actions
  const handleTeamMemberSelectedWrapper = (selectedUserData: TeamMember) => {
    // Save selection via hook
    handleUserSelected(selectedUserData);
    
    // Only proceed with actions if there was a pending action (quick print or new label)
    if (pendingQuickPrint) {
      // Check if it's a recipe (has shelf_life_days property from recipes table)
      if (pendingQuickPrint.shelf_life_days !== undefined) {
        // It's a recipe - open recipe print dialog
        setRecipePrintDialogOpen(true);
      } else {
        // It's a regular product - open quick print details dialog
        setQuickPrintDetailsOpen(true);
      }
    }
    // If no pending action, just close the dialog (user was selecting/changing their identity)
  };

  const handleQuickPrintDetailsConfirmed = (details: { quantity: string; unit: string; condition: string; customExpiryDate?: string }) => {
    if (pendingQuickPrint && selectedUser) {
      executeQuickPrint(pendingQuickPrint, selectedUser, details);
      setPendingQuickPrint(null);
      setQuickPrintDetailsOpen(false);
    }
  };

  const executeQuickPrint = async (
    product: any, 
    selectedUserData: TeamMember,
    details?: { quantity: string; unit: string; condition: string; customExpiryDate?: string }
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

    // Determine expiry date based on condition
    let expiryDate: string;
    if (details?.condition === 'custom' && details?.customExpiryDate) {
      expiryDate = details.customExpiryDate;
    } else if (details?.condition && details.condition !== 'custom') {
      expiryDate = calculateExpiryDate(prepDate, details.condition as StorageCondition);
    } else {
      // Fallback: +3 days
      const d = new Date(now);
      d.setDate(now.getDate() + 3);
      expiryDate = d.toISOString().split('T')[0];
    }

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
      condition: details?.condition || "refrigerated",
      quantity: details?.quantity || "1",
      unit: details?.unit || product.measuring_units?.abbreviation || "Unit",
      batchNumber: "",
      allergens: productAllergens,
      organizationId: organizationId, // Required for RLS
    };

    try {
      // Save to database first — capture labelId for QR code URL
      const savedLabelId = await saveLabelToDatabase(labelData);
      
      // Print using new printer system - pass complete label data with CORRECT field names
      const success = await print({
        productName: product.name,
        categoryName: product.label_categories?.name || "Quick Print",
        prepDate: prepDate,
        expiryDate: expiryDate,
        preparedByName: selectedUserData.display_name || "Unknown",
        allergens: productAllergens,
        condition: details?.condition || "refrigerated",
        quantity: details?.quantity || "1",
        unit: details?.unit || product.measuring_units?.abbreviation || "Unit",
        labelId: savedLabelId || undefined,
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
      description: "Your label has been saved successfully.",
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
          onOpenChange={closeUserDialog}
          onSelectUser={handleTeamMemberSelectedWrapper}
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
        onOpenChange={closeUserDialog}
        onSelectUser={handleTeamMemberSelectedWrapper}
        title="Who are you?"
        description="Select your name to continue"
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
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Labels</h1>
          </div>
          {/* T1.2: Team Member Indicator - Always visible */}
          <Button
            variant={selectedUser ? "outline" : "default"}
            size="sm"
            onClick={openUserDialog}
            className="flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            {selectedUser ? (
              <>
                <span className="font-medium">{selectedUser.display_name}</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {selectedUser.role_type}
                </Badge>
              </>
            ) : (
              <span className="text-sm">Select Team Member</span>
            )}
          </Button>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <>
              <Button 
                variant="outline"
                onClick={() => setCurrentView('admin')}
                className="flex items-center gap-2"
              >
                <GitMerge className="w-4 h-4" />
                Manage Duplicates
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCreateCategoryOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Category
              </Button>
            </>
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
          <Button variant="hero" onClick={handleCreateLabel} className="text-white">
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

      {/* SECTION 3: Recent Labels */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Recent Labels</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input 
                  placeholder="Search" 
                  className="pl-12 w-48 md:w-64"
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
              // Don't clear user selection when closing dialog - user stays logged in
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

      {/* Sprint 3 T13.1: Create Category Modal */}
      <CreateCategoryDialog
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        onSuccess={() => {
          // Categories will auto-refresh via useProducts hook
          toast({
            title: 'Success',
            description: 'Category list has been updated',
          });
        }}
      />
    </>
  );
}