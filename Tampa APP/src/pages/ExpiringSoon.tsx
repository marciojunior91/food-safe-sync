import { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  CheckCircle2,
  CalendarClock,
  Trash2,
  FileText,
  ChefHat,
  MapPin,
  Loader2,
  QrCode,
  MoreHorizontal,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, parseISO } from "date-fns";
import { 
  calculateUrgency, 
  getUrgencyLabel, 
  getUrgencyColorClasses, 
  calculateDaysUntilExpiry,
  type UrgencyLevel 
} from "@/utils/dateCalculations";
import { useNavigate } from "react-router-dom";
import { QRScanner } from "@/components/QRScanner";
import { Grid3x3, List as ListIcon } from "lucide-react";

type ItemType = 'product' | 'label' | 'recipe';
type ActionType = 'consume' | 'extend' | 'discard';
type LabelStatus = 'active' | 'near_expiry' | 'expired' | 'wasted' | 'used';

interface ExpiringItem {
  id: string;
  name: string;
  type: ItemType;
  expiryDate: Date;
  location?: string;
  quantity?: number;
  unit?: string;
  urgency: UrgencyLevel;
  daysUntilExpiry: number;
  status?: LabelStatus; // For labels
  qrCode?: string; // For QR code scanning
}

interface ActionDialogData {
  open: boolean;
  action: ActionType | null;
  item: ExpiringItem | null;
}

export default function ExpiringSoon() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Data state
  const [labels, setLabels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Multi-selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ItemType | "all">("all");
  // null = nothing selected (default empty state); set by clicking counter cards
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Action Dialog
  const [actionDialog, setActionDialog] = useState<ActionDialogData>({
    open: false,
    action: null,
    item: null,
  });
  const [actionReason, setActionReason] = useState("");
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QR Scanner state
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Get organization_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.organization_id) return;

      // Fetch labels with status (exclude used/wasted labels)
      const { data: labelsData } = await supabase
        .from('printed_labels')
        .select('*, status')
        .eq('organization_id', profile.organization_id)
        .not('expiry_date', 'is', null)
        .not('status', 'in', '("wasted","used")'); // BUGFIX EXPIRING-6: Exclude discarded labels

      setLabels(labelsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load expiring items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Urgency calculation now uses centralized utility

  // Get urgency color classes using centralized utility
  const getUrgencyColor = getUrgencyColorClasses;

  // Get urgency label using centralized utility (imported above)

  // Transform labels (and future recipes) into expiring items
  const expiringItems = useMemo(() => {
    const items: ExpiringItem[] = [];
    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);

    // Add labels with lifecycle status
    labels?.forEach(label => {
      if (label.expiry_date) {
        const expiryDate = parseISO(label.expiry_date);
        if (expiryDate <= sevenDaysFromNow) {
          const daysUntil = calculateDaysUntilExpiry(label.expiry_date, now);
          
          // BUGFIX EXPIRING-9: Always recalculate status based on current expiry date
          // Don't rely on stored status for urgency calculation
          let labelStatus: LabelStatus = label.status || 'active';
          
          // Recalculate status based on actual days until expiry
          if (daysUntil <= 0) {
            labelStatus = 'expired';
          } else if (daysUntil <= 1) {
            labelStatus = 'near_expiry';
          } else if (labelStatus === 'expired' || labelStatus === 'near_expiry') {
            // If label was previously expired/near_expiry but now has more days, mark as active
            labelStatus = 'active';
          }
          
          items.push({
            id: label.id,
            name: label.product_name,
            type: 'label',
            expiryDate,
            location: label.storage_location,
            urgency: calculateUrgency(daysUntil),
            daysUntilExpiry: daysUntil,
            status: labelStatus,
            qrCode: `label-${label.id}`, // Generate QR code identifier
          });
        }
      }
    });

    // Sort by urgency (critical first) and then by expiry date
    return items.sort((a, b) => {
      const urgencyOrder = { critical: 0, warning: 1, upcoming: 2 };
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return a.expiryDate.getTime() - b.expiryDate.getTime();
    });
  }, [labels]);

  // Apply filters — default empty: list only appears after selecting a counter card or typing a search
  const filteredItems = useMemo(() => {
    if (!urgencyFilter && !searchQuery) return [];
    return expiringItems.filter(item => {
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }
      if (urgencyFilter && item.urgency !== urgencyFilter) {
        return false;
      }
      return true;
    });
  }, [expiringItems, searchQuery, typeFilter, urgencyFilter]);

  // Count by urgency
  const urgencyCounts = useMemo(() => {
    return {
      critical: expiringItems.filter(i => i.urgency === 'critical').length,
      warning: expiringItems.filter(i => i.urgency === 'warning').length,
      upcoming: expiringItems.filter(i => i.urgency === 'upcoming').length,
    };
  }, [expiringItems]);

  // Handle action
  const handleAction = (action: ActionType, item: ExpiringItem) => {
    setActionDialog({ open: true, action, item });
    setActionReason("");
    if (action === 'extend') {
      setNewExpiryDate(format(addDays(item.expiryDate, 7), 'yyyy-MM-dd'));
    }
  };

  // Multi-selection handlers
  const toggleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedItems(new Set(filteredItems.map(item => `${item.type}-${item.id}`)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Bulk actions
  const handleBulkAction = async (action: ActionType) => {
    if (selectedItems.size === 0) return;
    
    try {
      // Group by type for different update strategies
      const labelIds = Array.from(selectedItems)
        .filter(id => id.startsWith('label-'))
        .map(id => id.replace('label-', ''));

      if (labelIds.length > 0) {
        let updateData: any = {};
        
        switch (action) {
          case 'consume':
            updateData = { status: 'used' };
            break;
          case 'discard':
            updateData = { status: 'wasted' };
            break;
          // extend would require individual handling
        }

        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from('printed_labels')
            .update(updateData)
            .in('id', labelIds);

          if (error) throw error;
        }
      }

      toast({
        title: "Bulk Action Completed",
        description: `${action} applied to ${selectedItems.size} items`,
      });

      clearSelection();
      fetchData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete bulk action",
        variant: "destructive",
      });
    }
  };

  // Submit action
  const handleSubmitAction = async () => {
    if (!actionDialog.item || !actionDialog.action) return;

    setIsSubmitting(true);
    try {
      const item = actionDialog.item;
      
      // Handle label lifecycle updates
      if (item.type === 'label') {
        let updateData: any = {};
        
        switch (actionDialog.action) {
          case 'consume':
            updateData = { status: 'used' };
            break;
          case 'discard':
            updateData = { status: 'wasted' };
            break;
          case 'extend':
            if (newExpiryDate) {
              updateData = { expiry_date: newExpiryDate };
            }
            break;
        }

        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from('printed_labels')
            .update(updateData)
            .eq('id', item.id);

          if (error) throw error;
        }
      }
      
      const actionMessages = {
        consume: `Marked "${actionDialog.item.name}" as consumed`,
        extend: `Extended expiry date for "${actionDialog.item.name}"`,
        discard: `Discarded "${actionDialog.item.name}"`,
      };

      toast({
        title: "Action Completed",
        description: actionMessages[actionDialog.action],
      });

      setActionDialog({ open: false, action: null, item: null });
      fetchData(); // Refresh data to show updated status
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // QR Code handling
  const handleQRScan = (qrData: string) => {
    // Handle full URL format: https://app.com/labels/{id}/preview
    const urlMatch = qrData.match(/\/labels\/([^/]+)\/preview/);
    if (urlMatch) {
      navigate(`/labels/${urlMatch[1]}/preview`);
      return;
    }
    // Handle label-{id} prefix format
    if (qrData.startsWith('label-')) {
      const labelId = qrData.replace('label-', '');
      navigate(`/labels/${labelId}/preview`);
      return;
    }
    // Try JSON format (QR codes that contain productId etc.)
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.labelId) {
        navigate(`/labels/${parsed.labelId}/preview`);
        return;
      }
    } catch {}
    // Fallback: treat as raw label ID
    navigate(`/labels/${qrData}/preview`);
  };

  // Navigate to QR Label Action page
  const handleOpenQRPage = (labelId: string) => {
    navigate(`/qr-label-action/${labelId}`);
  };

  // Open QR Scanner (for future implementation with camera)
  const handleOpenQRScanner = () => {
    setQrScannerOpen(true);
  };

  // Get item icon
  const getItemIcon = (type: ItemType) => {
    switch (type) {
      case 'label':
        return <FileText className="w-4 h-4" />;
      case 'recipe':
        return <ChefHat className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Expiring Alerts</h1>
        <p className="text-muted-foreground mt-2">
          Monitor items approaching expiry and take action to reduce waste
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats Cards — click to filter by urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          onClick={() => setUrgencyFilter(urgencyFilter === 'critical' ? null : 'critical')}
          className={`cursor-pointer transition-all ${
            urgencyFilter === 'critical'
              ? `${getUrgencyColor('critical').bg} ${getUrgencyColor('critical').border} ring-2 ring-red-500`
              : `${getUrgencyColor('critical').bg} ${getUrgencyColor('critical').border} hover:opacity-80`
          }`}
        >
          <CardHeader className="pb-3">
            <CardDescription className={getUrgencyColor('critical').text}>
              🔴 Expired
            </CardDescription>
            <CardTitle className="text-3xl">
              {urgencyCounts.critical}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Past expiry date
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setUrgencyFilter(urgencyFilter === 'warning' ? null : 'warning')}
          className={`cursor-pointer transition-all ${
            urgencyFilter === 'warning'
              ? `${getUrgencyColor('warning').bg} ${getUrgencyColor('warning').border} ring-2 ring-yellow-500`
              : `${getUrgencyColor('warning').bg} ${getUrgencyColor('warning').border} hover:opacity-80`
          }`}
        >
          <CardHeader className="pb-3">
            <CardDescription className={getUrgencyColor('warning').text}>
              🟡 Expires Tomorrow
            </CardDescription>
            <CardTitle className="text-3xl">
              {urgencyCounts.warning}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setUrgencyFilter(urgencyFilter === 'upcoming' ? null : 'upcoming')}
          className={`cursor-pointer transition-all ${
            urgencyFilter === 'upcoming'
              ? `${getUrgencyColor('upcoming').bg} ${getUrgencyColor('upcoming').border} ring-2 ring-green-500`
              : `${getUrgencyColor('upcoming').bg} ${getUrgencyColor('upcoming').border} hover:opacity-80`
          }`}
        >
          <CardHeader className="pb-3">
            <CardDescription className={getUrgencyColor('upcoming').text}>
              🟢 Upcoming
            </CardDescription>
            <CardTitle className="text-3xl">
              {urgencyCounts.upcoming}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Plan ahead items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ItemType | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="label">Labels</SelectItem>
                <SelectItem value="recipe">Recipes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

          {/* Bulk Actions, View Toggle, and QR Scanner */}
          <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {/* Grid/List View Toggle */}
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <ListIcon className="w-4 h-4" />
                </Button>
              </div>
              
              {selectedItems.size > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.size} selected
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="w-4 h-4 mr-2" />
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkAction('consume')}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark as Consumed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('discard')}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Mark as Discarded
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllVisible}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenQRScanner}>
                <QrCode className="w-4 h-4 mr-2" />
                QR Scanner
              </Button>
            </div>
          </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {!urgencyFilter && !searchQuery
                    ? "Select a category above to view items"
                    : "No Items Found"}
                </h3>
                <p className="text-muted-foreground">
                  {!urgencyFilter && !searchQuery
                    ? "Click on Expired, Expires Tomorrow or Upcoming to filter."
                    : "No items match your current filters."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          // Grid View (current/default)
          filteredItems.map(item => {
            const colors = getUrgencyColor(item.urgency);
            const itemKey = `${item.type}-${item.id}`;
            const isSelected = selectedItems.has(itemKey);
            
            return (
              <Card key={itemKey} className={`${colors.bg} ${colors.border} ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="py-4 px-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectItem(itemKey)}
                      className="mt-1 flex-shrink-0"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Name row */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`p-1.5 rounded-lg ${colors.badge} flex-shrink-0`}>
                          {getItemIcon(item.type)}
                        </div>
                        <h3 className="font-semibold text-base leading-tight truncate">{item.name}</h3>
                      </div>

                      {/* Badges row */}
                      <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                        <Badge variant="outline" className="capitalize text-xs">
                          {item.type}
                        </Badge>
                        {item.status && item.type === 'label' && (
                          <Badge className="text-xs" variant={
                            item.status === 'used' ? 'default' :
                            item.status === 'wasted' ? 'destructive' :
                            item.status === 'expired' ? 'destructive' :
                            item.status === 'near_expiry' ? 'secondary' : 'outline'
                          }>
                            {item.status.replace('_', ' ')}
                          </Badge>
                        )}
                        {item.location && (
                          <span className="flex items-center gap-1 text-xs">
                            <MapPin className="w-3 h-3" />
                            {item.location}
                          </span>
                        )}
                        {item.quantity && (
                          <span className="text-xs">{item.quantity} {item.unit}</span>
                        )}
                      </div>

                      {/* Urgency + Date row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`} />
                        <span className={`text-sm font-medium ${colors.text}`}>
                          {getUrgencyLabel(item.urgency, item.daysUntilExpiry)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · {item.daysUntilExpiry < 0 ? 'Expired' : 'Expires'} {format(item.expiryDate, 'MMM dd, yyyy')}
                        </span>
                      </div>

                      {/* Actions row — wraps naturally on all screen sizes */}
                      <div className="flex gap-1.5 flex-wrap pt-1">
                        {item.type === 'label' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/labels/${item.id}/preview`)}
                            className="h-7 gap-1.5 text-xs px-2"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Preview
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction('consume', item)}
                          className="h-7 gap-1.5 text-xs px-2"
                          disabled={item.type === 'label' && (item.status === 'used' || item.status === 'wasted')}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Consumed
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction('extend', item)}
                          className="h-7 gap-1.5 text-xs px-2"
                          disabled={item.type === 'label' && (item.status === 'used' || item.status === 'wasted')}
                        >
                          <CalendarClock className="w-3.5 h-3.5" />
                          Extend
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction('discard', item)}
                          className="h-7 gap-1.5 text-xs px-2 text-destructive hover:text-destructive"
                          disabled={item.type === 'label' && (item.status === 'used' || item.status === 'wasted')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Discard
                        </Button>
                      </div>{/* end actions row */}
                    </div>{/* end content */}
                  </div>{/* end outer flex */}
                </CardContent>
              </Card>
            );
          })
        ) : (
          // List View (condensed)
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-1">
                {filteredItems.map(item => {
                  const colors = getUrgencyColor(item.urgency);
                  const itemKey = `${item.type}-${item.id}`;
                  const isSelected = selectedItems.has(itemKey);
                  
                  return (
                    <div 
                      key={itemKey} 
                      className={`flex items-center gap-3 py-2 px-3 rounded-md border ${colors.border} ${colors.bg} ${isSelected ? 'ring-2 ring-primary' : ''} hover:bg-muted/50 transition-colors`}
                    >
                      {/* Checkbox */}
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectItem(itemKey)}
                      />
                      
                      {/* Urgency Indicator */}
                      <div className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`} />
                      
                      {/* Item Name */}
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="font-medium truncate">{item.name}</span>
                        <Badge variant="outline" className="capitalize text-xs flex-shrink-0">
                          {item.type}
                        </Badge>
                      </div>
                      
                      {/* Expiry Info */}
                      <div className="flex items-center gap-2 text-sm flex-shrink-0">
                        <span className={`font-medium ${colors.text}`}>
                          {item.daysUntilExpiry === 0 
                            ? "Today" 
                            : item.daysUntilExpiry < 0 
                              ? `${Math.abs(item.daysUntilExpiry)}d ago`
                              : `${item.daysUntilExpiry}d`
                          }
                        </span>
                        <span className="text-muted-foreground hidden sm:inline">
                          {format(item.expiryDate, 'MMM dd')}
                        </span>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        {/* Preview button - only for labels */}
                        {item.type === 'label' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/labels/${item.id}/preview`)}
                            className="h-8 w-8 p-0"
                            title="Preview Label"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction('consume', item)}
                          className="h-8 w-8 p-0"
                          disabled={item.type === 'label' && (item.status === 'used' || item.status === 'wasted')}
                          title="Mark as Consumed"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction('extend', item)}
                          className="h-8 w-8 p-0"
                          disabled={item.type === 'label' && (item.status === 'used' || item.status === 'wasted')}
                          title="Extend Expiry"
                        >
                          <CalendarClock className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction('discard', item)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          disabled={item.type === 'label' && (item.status === 'used' || item.status === 'wasted')}
                          title="Discard"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !isSubmitting && setActionDialog({ ...actionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'consume' && 'Mark as Consumed'}
              {actionDialog.action === 'extend' && 'Extend Expiry Date'}
              {actionDialog.action === 'discard' && 'Discard Item'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'consume' && 'Confirm that this item has been used or consumed.'}
              {actionDialog.action === 'extend' && 'Set a new expiry date and provide a reason for the extension.'}
              {actionDialog.action === 'discard' && 'Confirm discarding this item and provide a reason.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Item Info */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold">{actionDialog.item?.name}</p>
              <p className="text-sm text-muted-foreground">
                Current expiry: {actionDialog.item && format(actionDialog.item.expiryDate, 'MMM dd, yyyy')}
              </p>
            </div>

            {/* New Expiry Date (for extend action) */}
            {actionDialog.action === 'extend' && (
              <div className="space-y-2">
                <Label htmlFor="newExpiryDate">New Expiry Date</Label>
                <Input
                  id="newExpiryDate"
                  type="date"
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason (Optional)
              </Label>
              <Textarea
                id="reason"
                placeholder={
                  actionDialog.action === 'consume'
                    ? 'Add any notes about consumption...'
                    : actionDialog.action === 'extend'
                    ? 'Why is the expiry date being extended?'
                    : 'Why is this item being discarded?'
                }
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, action: null, item: null })}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAction}
              disabled={
                isSubmitting ||
                (actionDialog.action === 'extend' && !newExpiryDate)
              }
              variant={actionDialog.action === 'discard' ? 'destructive' : 'default'}
            >
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Scanner Dialog */}
      <QRScanner
        open={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onScan={handleQRScan}
      />
        </>
      )}
    </div>
  );
}
