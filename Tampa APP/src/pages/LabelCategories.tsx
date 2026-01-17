/**
 * Label Categories Management Page
 * Admin/Manager interface for CRUD operations on label categories & subcategories
 */

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

interface Category {
  id: string;
  name: string;
  icon: string | null;
  subcategories?: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  icon: string | null;
  category_id: string;
  display_order: number | null;
}

export default function LabelCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'category' | 'subcategory'; data: any } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: 'category' | 'subcategory'; id: string; name: string } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('label_categories')
        .select(`
          id,
          name,
          icon,
          label_subcategories (
            id,
            name,
            icon,
            category_id,
            display_order
          )
        `)
        .order('name');

      if (error) throw error;

      setCategories(data as Category[]);
    } catch (error: any) {
      toast({
        title: 'Load Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type: 'category' | 'subcategory', data: any) => {
    setEditingItem({ type, data });
    setName(data.name);
    setIcon(data.icon || '');
    setEditDialogOpen(true);
  };

  const handleAdd = (type: 'category' | 'subcategory', categoryId?: string) => {
    setEditingItem({ type, data: categoryId ? { category_id: categoryId } : null });
    setName('');
    setIcon('');
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingItem?.type === 'category') {
        if (editingItem.data?.id) {
          // Update category
          const { error } = await supabase
            .from('label_categories')
            .update({ name, icon: icon || null })
            .eq('id', editingItem.data.id);

          if (error) throw error;
        } else {
          // Create category
          const { error } = await supabase
            .from('label_categories')
            .insert({ name, icon: icon || null });

          if (error) throw error;
        }
      } else {
        // Subcategory
        if (editingItem?.data?.id) {
          // Update subcategory
          const { error } = await supabase
            .from('label_subcategories')
            .update({ name, icon: icon || null })
            .eq('id', editingItem.data.id);

          if (error) throw error;
        } else {
          // Create subcategory
          const { error } = await supabase
            .from('label_subcategories')
            .insert({
              category_id: editingItem?.data?.category_id,
              name,
              icon: icon || null,
            });

          if (error) throw error;
        }
      }

      toast({
        title: 'Success',
        description: `${editingItem?.type === 'category' ? 'Category' : 'Subcategory'} ${editingItem?.data?.id ? 'updated' : 'created'}`,
      });

      setEditDialogOpen(false);
      loadCategories();
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      if (deleteItem.type === 'category') {
        const { error } = await supabase
          .from('label_categories')
          .delete()
          .eq('id', deleteItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('label_subcategories')
          .delete()
          .eq('id', deleteItem.id);

        if (error) throw error;
      }

      toast({
        title: 'Deleted',
        description: `${deleteItem.type === 'category' ? 'Category' : 'Subcategory'} "${deleteItem.name}" deleted`,
      });

      setDeleteDialogOpen(false);
      setDeleteItem(null);
      loadCategories();
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Label Categories</h1>
          <p className="text-muted-foreground">Manage categories and subcategories for label organization</p>
        </div>
        <Button onClick={() => handleAdd('category')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {category.icon && <span className="text-2xl">{category.icon}</span>}
                  <span>{category.name}</span>
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAdd('subcategory', category.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subcategory
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit('category', category)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeleteItem({ type: 'category', id: category.id, name: category.name });
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {category.subcategories && category.subcategories.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  {category.subcategories.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        {sub.icon && <span className="text-xl">{sub.icon}</span>}
                        <span>{sub.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit('subcategory', sub)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteItem({ type: 'subcategory', id: sub.id, name: sub.name });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem?.data?.id ? 'Edit' : 'Create'}{' '}
              {editingItem?.type === 'category' ? 'Category' : 'Subcategory'}
            </DialogTitle>
            <DialogDescription>
              {editingItem?.type === 'category'
                ? 'Categories group related products together'
                : 'Subcategories provide more specific classification'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g., ${editingItem?.type === 'category' ? 'Dairy Products' : 'Cheese'}`}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon (Emoji)</Label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g., 🧀"
                maxLength={2}
              />
              <p className="text-xs text-muted-foreground">
                Use a single emoji character (optional)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteItem?.type} "{deleteItem?.name}".
              {deleteItem?.type === 'category' && ' All subcategories will also be deleted.'}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
