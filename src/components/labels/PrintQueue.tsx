import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Printer, 
  Trash2, 
  GripVertical, 
  CheckCircle, 
  Clock, 
  XCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { usePrinter } from "@/hooks/usePrinter";
import { UserSelectionDialog } from "./UserSelectionDialog";
import type { TeamMember } from "@/types/teamMembers";

interface PrintQueueItem {
  id: string;
  product_id: string | null;
  category_id: string | null;
  template_id: string | null;
  user_id: string;
  prepared_by_name: string;
  prep_date: string;
  expiry_date: string;
  condition: string;
  quantity: string | null;
  unit: string | null;
  batch_number: string | null;
  notes: string | null;
  status: "pending" | "printing" | "completed" | "failed";
  priority: number;
  created_at: string;
  updated_at: string;
  product?: {
    name: string;
    category?: {
      name: string;
    };
  };
}

interface SortableRowProps {
  item: PrintQueueItem;
  onPrint: (id: string) => void;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
}

function SortableRow({ item, onPrint, onDelete, onRetry }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "printing":
        return <Badge variant="default"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Printing</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-8">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="font-medium">
        {item.product?.name || "Unknown Product"}
      </TableCell>
      <TableCell>{item.product?.category?.name || "N/A"}</TableCell>
      <TableCell>{item.quantity || "-"} {item.unit || ""}</TableCell>
      <TableCell className="capitalize">{item.condition}</TableCell>
      <TableCell>{format(new Date(item.expiry_date), "MMM dd, yyyy")}</TableCell>
      <TableCell>{getStatusBadge(item.status)}</TableCell>
      <TableCell className="text-right space-x-2">
        {item.status === "pending" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPrint(item.id)}
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        )}
        {item.status === "failed" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRetry(item.id)}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function PrintQueue() {
  const [queueItems, setQueueItems] = useState<PrintQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const { toast } = useToast();
  const { print } = usePrinter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchQueueItems();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel("print_queue_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "print_queue",
        },
        () => {
          fetchQueueItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchQueueItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("print_queue")
        .select(`
          *,
          product:products (
            name,
            category:label_categories (
              name
            )
          )
        `)
        .eq("user_id", user.id)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;

      setQueueItems((data || []) as PrintQueueItem[]);
    } catch (error) {
      console.error("Error fetching queue:", error);
      toast({
        title: "Error",
        description: "Failed to load print queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = queueItems.findIndex((item) => item.id === active.id);
    const newIndex = queueItems.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(queueItems, oldIndex, newIndex);
    
    // Update priorities based on new order
    const updates = newItems.map((item, index) => ({
      id: item.id,
      priority: newItems.length - index,
    }));

    setQueueItems(newItems);

    // Update database
    try {
      for (const update of updates) {
        await supabase
          .from("print_queue")
          .update({ priority: update.priority })
          .eq("id", update.id);
      }
    } catch (error) {
      console.error("Error updating priorities:", error);
      toast({
        title: "Error",
        description: "Failed to update queue order",
        variant: "destructive",
      });
      fetchQueueItems(); // Revert on error
    }
  };

  const handlePrintSingle = async (
    id: string,
    overridePreparedBy?: string,
    overridePreparedByName?: string
  ) => {
    const item = queueItems.find((i) => i.id === id);
    if (!item) return;

    try {
      // Update status to printing
      await supabase
        .from("print_queue")
        .update({ status: "printing" })
        .eq("id", id);

      // Use override values if provided, otherwise use item values
      const preparedBy = overridePreparedBy || item.user_id;
      const preparedByName = overridePreparedByName || item.prepared_by_name;

      // Print the label using the unified printer system
      const success = await print({
        productId: item.product_id || "",
        productName: item.product?.name || "Unknown Product",
        categoryId: item.category_id || "",
        categoryName: item.product?.category?.name || "",
        preparedDate: item.prep_date,
        useByDate: item.expiry_date,
        preparedBy,
        preparedByName,
        condition: item.condition,
        quantity: item.quantity || "",
        unit: item.unit || "",
        batchNumber: item.batch_number,
      });

      if (!success) {
        throw new Error('Print failed');
      }

      // Update status to completed
      await supabase
        .from("print_queue")
        .update({ status: "completed" })
        .eq("id", id);

      toast({
        title: "Success",
        description: "Label printed successfully",
      });

      // Remove completed items after 2 seconds
      setTimeout(() => {
        handleDelete(id);
      }, 2000);
    } catch (error) {
      console.error("Print error:", error);
      
      await supabase
        .from("print_queue")
        .update({ status: "failed" })
        .eq("id", id);

      toast({
        title: "Print Failed",
        description: "Failed to print label. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrintAll = async () => {
    const pendingItems = queueItems.filter((item) => item.status === "pending");
    
    if (pendingItems.length === 0) {
      toast({
        title: "No Items",
        description: "No pending items in queue",
      });
      return;
    }

    // ✅ FIXED: Open team member selection dialog before printing
    // This makes the workflow consistent with Quick Print and Full Form workflows
    setUserDialogOpen(true);
  };

  const handleUserSelected = (user: TeamMember) => {
    setSelectedUser(user);
    setUserDialogOpen(false);
    // Start printing after user is selected
    printAllWithUser(user);
  };

  const printAllWithUser = async (user: TeamMember) => {
    const pendingItems = queueItems.filter((item) => item.status === "pending");

    toast({
      title: "Printing Queue",
      description: `Printing ${pendingItems.length} labels as ${user.display_name}...`,
    });

    for (const item of pendingItems) {
      await handlePrintSingle(item.id, user.auth_role_id || "", user.display_name);
      // Small delay between prints
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const handleRetry = async (id: string) => {
    await supabase
      .from("print_queue")
      .update({ status: "pending" })
      .eq("id", id);
    
    toast({
      title: "Reset",
      description: "Item reset to pending. Ready to print.",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase
        .from("print_queue")
        .delete()
        .eq("id", id);

      toast({
        title: "Deleted",
        description: "Item removed from queue",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const handleClearQueue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("print_queue")
        .delete()
        .eq("user_id", user.id);

      toast({
        title: "Queue Cleared",
        description: "All items removed from queue",
      });
      
      setShowClearDialog(false);
    } catch (error) {
      console.error("Clear error:", error);
      toast({
        title: "Error",
        description: "Failed to clear queue",
        variant: "destructive",
      });
    }
  };

  const pendingCount = queueItems.filter((item) => item.status === "pending").length;
  const failedCount = queueItems.filter((item) => item.status === "failed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (queueItems.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/50">
        <Printer className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold mb-2">No Items in Queue</h3>
        <p className="text-sm text-muted-foreground">
          Add labels to the print queue to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Print Queue</h2>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {pendingCount} Pending
            </Badge>
            {failedCount > 0 && (
              <Badge variant="destructive">
                {failedCount} Failed
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <Button onClick={handlePrintAll}>
              <Printer className="h-4 w-4 mr-2" />
              Print All ({pendingCount})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowClearDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Queue
          </Button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="border rounded-lg">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={queueItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {queueItems.map((item) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    onPrint={handlePrintSingle}
                    onDelete={handleDelete}
                    onRetry={handleRetry}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Clear Queue Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Print Queue?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all items from the print queue. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearQueue}>
              Clear Queue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Selection Dialog for Batch Printing */}
      <UserSelectionDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        onUserSelected={handleUserSelected}
      />
    </div>
  );
}
