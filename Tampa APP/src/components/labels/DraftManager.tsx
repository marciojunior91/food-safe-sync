import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { FileText, Trash2, Upload, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { LabelData } from "./LabelForm";

interface Draft {
  id: string;
  draft_name: string;
  form_data: LabelData;
  created_at: string;
  updated_at: string;
}

interface DraftManagerProps {
  onLoadDraft: (data: LabelData) => void;
}

export function DraftManager({ onLoadDraft }: DraftManagerProps) {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("label_drafts")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error("Error fetching drafts:", error);
      toast({
        title: "Error",
        description: "Failed to load drafts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDraft = (draft: Draft) => {
    onLoadDraft(draft.form_data);
    toast({
      title: "Draft Loaded",
      description: `"${draft.draft_name}" has been loaded into the form.`
    });
  };

  const openDeleteDialog = (draft: Draft) => {
    setSelectedDraft(draft);
    setShowDeleteDialog(true);
  };

  const handleDeleteDraft = async () => {
    if (!selectedDraft) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from("label_drafts")
        .delete()
        .eq("id", selectedDraft.id);

      if (error) throw error;

      toast({
        title: "Draft Deleted",
        description: `"${selectedDraft.draft_name}" has been deleted.`
      });

      setShowDeleteDialog(false);
      setSelectedDraft(null);
      fetchDrafts();

    } catch (error) {
      console.error("Error deleting draft:", error);
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Saved Drafts ({drafts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading drafts...
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No saved drafts yet.</p>
              <p className="text-sm mt-2">
                Click "Save Draft" on the label form to save your progress.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Draft Name</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => (
                  <TableRow key={draft.id}>
                    <TableCell className="font-medium">
                      {draft.draft_name}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {draft.form_data.productName || "No product"}
                        </div>
                        {draft.form_data.categoryName && (
                          <div className="text-xs text-muted-foreground">
                            {draft.form_data.categoryName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {format(new Date(draft.updated_at), "MMM dd, yyyy HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoadDraft(draft)}
                          className="flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Load
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(draft)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDraft?.draft_name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDraft} 
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
