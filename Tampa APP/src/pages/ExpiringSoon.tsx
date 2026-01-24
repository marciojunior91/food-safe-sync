import { useState, useMemo, useEffect } from "react";
import { 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter,
  CheckCircle2,
  CalendarClock,
  Trash2,
  Package,
  FileText,
  ChefHat,
  MapPin,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { format, differenceInDays, addDays, parseISO } from "date-fns";

type ItemType = 'product' | 'label' | 'recipe';
type UrgencyLevel = 'critical' | 'urgent' | 'warning' | 'normal';
type ActionType = 'consume' | 'extend' | 'discard';

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
}

interface ActionDialogData {
  open: boolean;
  action: ActionType | null;
  item: ExpiringItem | null;
}

export default function ExpiringSoon() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Data state
  const [products, setProducts] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ItemType | "all">("all");
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | "all">("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Action Dialog
  const [actionDialog, setActionDialog] = useState<ActionDialogData>({
    open: false,
    action: null,
    item: null,
  });
  const [actionReason, setActionReason] = useState("");
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .not('expiry_date', 'is', null);

      // Fetch labels  
      const { data: labelsData } = await supabase
        .from('printed_labels')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .not('expiry_date', 'is', null);

      setProducts(productsData || []);
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

  // Calculate urgency level based on days until expiry
  const calculateUrgency = (daysUntil: number): UrgencyLevel => {
    if (daysUntil <= 0) return 'critical'; // Expired or today
    if (daysUntil === 1) return 'urgent'; // Tomorrow
    if (daysUntil <= 3) return 'warning'; // 2-3 days
    return 'normal'; // 4-7 days
  };

  // Get urgency color classes
  const getUrgencyColor = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-950',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-300',
          badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          dot: 'bg-red-500',
        };
      case 'urgent':
        return {
          bg: 'bg-orange-50 dark:bg-orange-950',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-700 dark:text-orange-300',
          badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
          dot: 'bg-orange-500',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-700 dark:text-yellow-300',
          badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          dot: 'bg-yellow-500',
        };
      default:
        return {
          bg: 'bg-green-50 dark:bg-green-950',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-700 dark:text-green-300',
          badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          dot: 'bg-green-500',
        };
    }
  };

  // Get urgency label
  const getUrgencyLabel = (urgency: UrgencyLevel, daysUntil: number) => {
    switch (urgency) {
      case 'critical':
        return daysUntil < 0 ? `Expired ${Math.abs(daysUntil)} days ago` : 'Expires today';
      case 'urgent':
        return 'Expires tomorrow';
      case 'warning':
        return `${daysUntil} days left`;
      default:
        return `${daysUntil} days left`;
    }
  };

  // Transform products and labels into expiring items
  const expiringItems = useMemo(() => {
    const items: ExpiringItem[] = [];
    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);

    // Add products
    products?.forEach(product => {
      if (product.expiry_date) {
        const expiryDate = parseISO(product.expiry_date);
        if (expiryDate <= sevenDaysFromNow) {
          const daysUntil = differenceInDays(expiryDate, now);
          items.push({
            id: product.id,
            name: product.name,
            type: 'product',
            expiryDate,
            location: product.storage_location,
            quantity: product.quantity,
            unit: product.unit,
            urgency: calculateUrgency(daysUntil),
            daysUntilExpiry: daysUntil,
          });
        }
      }
    });

    // Add labels
    labels?.forEach(label => {
      if (label.expiry_date) {
        const expiryDate = parseISO(label.expiry_date);
        if (expiryDate <= sevenDaysFromNow) {
          const daysUntil = differenceInDays(expiryDate, now);
          items.push({
            id: label.id,
            name: label.product_name,
            type: 'label',
            expiryDate,
            location: label.storage_location,
            urgency: calculateUrgency(daysUntil),
            daysUntilExpiry: daysUntil,
          });
        }
      }
    });

    // Sort by urgency (critical first) and then by expiry date
    return items.sort((a, b) => {
      const urgencyOrder = { critical: 0, urgent: 1, warning: 2, normal: 3 };
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return a.expiryDate.getTime() - b.expiryDate.getTime();
    });
  }, [products, labels]);

  // Apply filters
  const filteredItems = useMemo(() => {
    return expiringItems.filter(item => {
      // Search filter
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }
      // Urgency filter
      if (urgencyFilter !== 'all' && item.urgency !== urgencyFilter) {
        return false;
      }
      // Location filter
      if (locationFilter !== 'all' && item.location !== locationFilter) {
        return false;
      }
      return true;
    });
  }, [expiringItems, searchQuery, typeFilter, urgencyFilter, locationFilter]);

  // Get unique locations
  const locations = useMemo(() => {
    const locs = new Set<string>();
    expiringItems.forEach(item => {
      if (item.location) locs.add(item.location);
    });
    return Array.from(locs).sort();
  }, [expiringItems]);

  // Count by urgency
  const urgencyCounts = useMemo(() => {
    return {
      critical: expiringItems.filter(i => i.urgency === 'critical').length,
      urgent: expiringItems.filter(i => i.urgency === 'urgent').length,
      warning: expiringItems.filter(i => i.urgency === 'warning').length,
      normal: expiringItems.filter(i => i.urgency === 'normal').length,
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

  // Submit action
  const handleSubmitAction = async () => {
    if (!actionDialog.item || !actionDialog.action) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement actual database updates
      // For now, just show success message
      
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

  // Get item icon
  const getItemIcon = (type: ItemType) => {
    switch (type) {
      case 'product':
        return <Package className="w-4 h-4" />;
      case 'label':
        return <FileText className="w-4 h-4" />;
      case 'recipe':
        return <ChefHat className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Expiring Soon</h1>
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`${getUrgencyColor('critical').bg} ${getUrgencyColor('critical').border}`}>
          <CardHeader className="pb-3">
            <CardDescription className={getUrgencyColor('critical').text}>
              Critical
            </CardDescription>
            <CardTitle className="text-3xl">
              {urgencyCounts.critical}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Expired or expires today
            </p>
          </CardContent>
        </Card>

        <Card className={`${getUrgencyColor('urgent').bg} ${getUrgencyColor('urgent').border}`}>
          <CardHeader className="pb-3">
            <CardDescription className={getUrgencyColor('urgent').text}>
              Urgent
            </CardDescription>
            <CardTitle className="text-3xl">
              {urgencyCounts.urgent}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Expires tomorrow
            </p>
          </CardContent>
        </Card>

        <Card className={`${getUrgencyColor('warning').bg} ${getUrgencyColor('warning').border}`}>
          <CardHeader className="pb-3">
            <CardDescription className={getUrgencyColor('warning').text}>
              Warning
            </CardDescription>
            <CardTitle className="text-3xl">
              {urgencyCounts.warning}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              2-3 days left
            </p>
          </CardContent>
        </Card>

        <Card className={`${getUrgencyColor('normal').bg} ${getUrgencyColor('normal').border}`}>
          <CardHeader className="pb-3">
            <CardDescription className={getUrgencyColor('normal').text}>
              Upcoming
            </CardDescription>
            <CardTitle className="text-3xl">
              {urgencyCounts.normal}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              4-7 days left
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ItemType | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="label">Labels</SelectItem>
                <SelectItem value="recipe">Recipes</SelectItem>
              </SelectContent>
            </Select>

            {/* Urgency Filter */}
            <Select value={urgencyFilter} onValueChange={(value) => setUrgencyFilter(value as UrgencyLevel | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="All urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Items Expiring Soon</h3>
                <p className="text-muted-foreground">
                  {expiringItems.length === 0
                    ? "All items are fresh with plenty of time before expiry!"
                    : "No items match your current filters."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map(item => {
            const colors = getUrgencyColor(item.urgency);
            return (
              <Card key={`${item.type}-${item.id}`} className={`${colors.bg} ${colors.border}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${colors.badge}`}>
                          {getItemIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                            <Badge variant="outline" className="capitalize">
                              {item.type}
                            </Badge>
                            {item.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {item.location}
                              </span>
                            )}
                            {item.quantity && (
                              <span>
                                {item.quantity} {item.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Urgency Badge */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                        <span className={`text-sm font-medium ${colors.text}`}>
                          {getUrgencyLabel(item.urgency, item.daysUntilExpiry)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          • Expires {format(item.expiryDate, 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('consume', item)}
                        className="gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Consumed</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('extend', item)}
                        className="gap-2"
                      >
                        <CalendarClock className="w-4 h-4" />
                        <span className="hidden sm:inline">Extend</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction('discard', item)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Discard</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
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
                Reason {actionDialog.action === 'consume' ? '(Optional)' : '(Required)'}
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
                (actionDialog.action === 'extend' && (!newExpiryDate || !actionReason)) ||
                (actionDialog.action === 'discard' && !actionReason)
              }
              variant={actionDialog.action === 'discard' ? 'destructive' : 'default'}
            >
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}
