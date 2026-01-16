import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Trash2,
  Eye,
  Printer,
  Search,
  Calendar,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { usePrinter } from '@/hooks/usePrinter';
import { saveLabelToDatabase } from '@/utils/zebraPrinter';

interface DraftFormData {
  productId?: string;
  productName?: string;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  prepDate?: string;
  expiryDate?: string;
  condition?: string;
  batchNumber?: string;
  selectedAllergens?: Array<{ id: string; name: string; icon: string; severity: string }>;
}

interface Draft {
  id: string;
  user_id: string;
  draft_name: string;
  form_data: DraftFormData;
  created_at: string;
  updated_at: string;
}

export default function DraftManagement() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [filteredDrafts, setFilteredDrafts] = useState<Draft[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { print, isLoading: isPrinting } = usePrinter();

  useEffect(() => {
    fetchDrafts();
  }, []);

  useEffect(() => {
    filterDrafts();
  }, [searchQuery, drafts]);

  const fetchDrafts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('label_drafts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setDrafts((data as Draft[]) || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load saved drafts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterDrafts = () => {
    if (!searchQuery.trim()) {
      setFilteredDrafts(drafts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = drafts.filter(
      (draft) =>
        draft.draft_name.toLowerCase().includes(query) ||
        draft.form_data.productName?.toLowerCase().includes(query) ||
        draft.form_data.categoryName?.toLowerCase().includes(query) ||
        draft.form_data.subcategoryName?.toLowerCase().includes(query) ||
        draft.form_data.batchNumber?.toLowerCase().includes(query)
    );
    setFilteredDrafts(filtered);
  };

  const handleDeleteDraft = async (id: string) => {
    try {
      const { error } = await supabase
        .from('label_drafts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Draft Deleted',
        description: 'Draft has been removed successfully',
      });

      fetchDrafts();
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete draft',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDraftToDelete(null);
    }
  };

  const handlePrintDraft = async (draft: Draft) => {
    try {
      const formData = draft.form_data;
      
      // Transform allergens to match the expected format
      const allergens = formData.selectedAllergens?.map(a => ({
        id: a.id,
        name: a.name,
        icon: a.icon || null,
        severity: a.severity
      })) || [];
      
      // Save to database first
      await saveLabelToDatabase({
        productId: formData.productId || '',
        productName: formData.productName || draft.draft_name,
        categoryId: formData.categoryId || null,
        categoryName: formData.categoryName || '',
        preparedBy: '',
        preparedByName: '',
        prepDate: formData.prepDate || '',
        expiryDate: formData.expiryDate || '',
        allergens,
        condition: formData.condition || 'Refrigerated',
        batchNumber: formData.batchNumber || '',
      });

      // Print using printer system
      const success = await print({
        productName: formData.productName || draft.draft_name,
        categoryName: formData.categoryName || '',
        subcategoryName: formData.subcategoryName || '',
        preparedDate: formData.prepDate || '',
        useByDate: formData.expiryDate || '',
        allergens: allergens.map(a => a.name),
        storageInstructions: formData.condition ? `Condition: ${formData.condition}` : '',
        barcode: formData.batchNumber,
      });

      if (success) {
        toast({
          title: 'Label Printed',
          description: 'Draft has been sent to printer',
        });
      }
    } catch (error) {
      console.error('Error printing draft:', error);
      toast({
        title: 'Print Error',
        description: 'Failed to print draft',
        variant: 'destructive',
      });
    }
  };

  const openDeleteDialog = (id: string) => {
    setDraftToDelete(id);
    setDeleteDialogOpen(true);
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const getConditionBadge = (condition?: string) => {
    if (!condition) return null;
    
    const variants: Record<string, string> = {
      Refrigerated: 'bg-blue-100 text-blue-800',
      Frozen: 'bg-cyan-100 text-cyan-800',
      'Room Temperature': 'bg-green-100 text-green-800',
    };

    return (
      <Badge className={variants[condition] || 'bg-gray-100 text-gray-800'}>
        {condition}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Draft Management</h1>
          <p className="text-muted-foreground">
            Manage, view, and print your saved label drafts
          </p>
        </div>
        <Button onClick={fetchDrafts} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drafts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drafts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Updated Today
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                drafts.filter(
                  (d) =>
                    new Date(d.updated_at).toDateString() ===
                    new Date().toDateString()
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Filtered Results
            </CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDrafts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search drafts by product name, category, batch number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Drafts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Drafts</CardTitle>
          <CardDescription>
            {filteredDrafts.length} draft{filteredDrafts.length !== 1 ? 's' : ''}{' '}
            {searchQuery && 'matching your search'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Drafts Found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Start creating labels to save drafts'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrafts.map((draft) => {
                    const formData = draft.form_data;
                    return (
                    <TableRow key={draft.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {formData.productName || draft.draft_name}
                          </div>
                          {formData.batchNumber && (
                            <div className="text-xs text-muted-foreground">
                              Batch: {formData.batchNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formData.categoryName || '-'}</div>
                          {formData.subcategoryName && (
                            <div className="text-xs text-muted-foreground">
                              {formData.subcategoryName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Prep: {formData.prepDate || '-'}</div>
                          <div className="text-red-600 font-medium">
                            Exp: {formData.expiryDate || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getConditionBadge(formData.condition)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(draft.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDraft(draft)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintDraft(draft)}
                            disabled={isPrinting}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(draft.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => draftToDelete && handleDeleteDraft(draftToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Draft Detail Dialog */}
      {selectedDraft && (
        <AlertDialog open={!!selectedDraft} onOpenChange={() => setSelectedDraft(null)}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Draft Details: {selectedDraft.draft_name}</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Product Name
                  </label>
                  <p className="text-lg font-semibold">
                    {selectedDraft.form_data.productName || selectedDraft.draft_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Condition
                  </label>
                  <p>{getConditionBadge(selectedDraft.form_data.condition)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Category
                  </label>
                  <p>{selectedDraft.form_data.categoryName || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Subcategory
                  </label>
                  <p>{selectedDraft.form_data.subcategoryName || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Prepared Date
                  </label>
                  <p>{selectedDraft.form_data.prepDate || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Expiry Date
                  </label>
                  <p className="text-red-600 font-medium">
                    {selectedDraft.form_data.expiryDate || '-'}
                  </p>
                </div>
                {selectedDraft.form_data.batchNumber && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Batch Number
                    </label>
                    <p className="font-mono">{selectedDraft.form_data.batchNumber}</p>
                  </div>
                )}
                {selectedDraft.form_data.selectedAllergens && 
                 selectedDraft.form_data.selectedAllergens.length > 0 && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Allergens
                    </label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedDraft.form_data.selectedAllergens.map((allergen) => (
                        <Badge key={allergen.id} variant="destructive">
                          {allergen.icon} {allergen.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground pt-4 border-t">
                Created: {formatDateTime(selectedDraft.created_at)} • Updated:{' '}
                {formatDateTime(selectedDraft.updated_at)}
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction onClick={() => handlePrintDraft(selectedDraft)}>
                <Printer className="w-4 h-4 mr-2" />
                Print Draft
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
