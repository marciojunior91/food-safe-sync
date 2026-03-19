import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Tag, X } from 'lucide-react';

interface Subcategory {
  id: string;
  name: string;
  icon: string;
}

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateCategoryDialog({ open, onOpenChange, onSuccess }: CreateCategoryDialogProps) {
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('');
  const [hasSubcategories, setHasSubcategories] = useState(false);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [organizationId, setOrganizationId] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch organization ID
  useEffect(() => {
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

    if (open) {
      fetchOrganizationId();
      // Reset form on open
      setCategoryName('');
      setCategoryIcon('');
      setHasSubcategories(false);
      setSubcategories([]);
    }
  }, [user?.id, open]);

  const addSubcategory = () => {
    setSubcategories(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: '', icon: '' },
    ]);
  };

  const removeSubcategory = (id: string) => {
    setSubcategories(prev => prev.filter(s => s.id !== id));
  };

  const updateSubcategory = (id: string, field: 'name' | 'icon', value: string) => {
    setSubcategories(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleCreate = async () => {
    if (!categoryName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Category name is required' });
      return;
    }
    if (!organizationId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Organization not found' });
      return;
    }
    // Validate subcategories
    if (hasSubcategories && subcategories.some(s => !s.name.trim())) {
      toast({ variant: 'destructive', title: 'Error', description: 'All subcategory names are required' });
      return;
    }

    setIsCreating(true);
    try {
      // 1. Create category
      const { data: newCategory, error: catError } = await supabase
        .from('label_categories')
        .insert({
          name: categoryName.trim(),
          icon: categoryIcon.trim() || null,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (catError) throw catError;

      // 2. Create subcategories (if any)
      if (hasSubcategories && subcategories.length > 0) {
        const subcategoryRows = subcategories
          .filter(s => s.name.trim())
          .map((s, idx) => ({
            category_id: newCategory.id,
            name: s.name.trim(),
            icon: s.icon.trim() || null,
            display_order: idx,
            organization_id: organizationId,
          }));

        if (subcategoryRows.length > 0) {
          const { error: subError } = await supabase
            .from('label_subcategories')
            .insert(subcategoryRows);

          if (subError) throw subError;
        }
      }

      toast({
        title: 'Success',
        description: `Category "${newCategory.name}" created${hasSubcategories && subcategories.length > 0 ? ` with ${subcategories.length} subcategorie${subcategories.length > 1 ? 's' : ''}` : ''}`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create category',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Create New Category
          </DialogTitle>
          <DialogDescription>
            Add a new category for organizing your food labels.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Category Name + Icon */}
          <div className="flex gap-3">
            <div className="flex-1 grid gap-1.5">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                placeholder="e.g., Dairy, Meat, Vegetables..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                disabled={isCreating}
                autoFocus
              />
            </div>
            <div className="w-24 grid gap-1.5">
              <Label htmlFor="category-icon">Icon / Emoji</Label>
              <Input
                id="category-icon"
                placeholder="🥛"
                value={categoryIcon}
                onChange={(e) => setCategoryIcon(e.target.value)}
                disabled={isCreating}
                className="text-center text-xl"
                maxLength={4}
              />
            </div>
          </div>

          {/* Has subcategories checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="has-subcategories"
              checked={hasSubcategories}
              onCheckedChange={(checked) => {
                setHasSubcategories(!!checked);
                if (checked && subcategories.length === 0) addSubcategory();
              }}
              disabled={isCreating}
            />
            <Label htmlFor="has-subcategories" className="cursor-pointer font-normal">
              This category has subcategories
            </Label>
          </div>

          {/* Subcategories list */}
          {hasSubcategories && (
            <div className="space-y-2">
              <Label>Subcategories</Label>

              {subcategories.map((sub, idx) => (
                <div key={sub.id} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
                  <Input
                    placeholder="Subcategory name"
                    value={sub.name}
                    onChange={(e) => updateSubcategory(sub.id, 'name', e.target.value)}
                    disabled={isCreating}
                    className="flex-1"
                  />
                  <Input
                    placeholder="🥩"
                    value={sub.icon}
                    onChange={(e) => updateSubcategory(sub.id, 'icon', e.target.value)}
                    disabled={isCreating}
                    className="w-16 text-center text-xl"
                    maxLength={4}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeSubcategory(sub.id)}
                    disabled={isCreating}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubcategory}
                disabled={isCreating}
                className="w-full gap-1.5 mt-1"
              >
                <Plus className="w-4 h-4" />
                Add Subcategory
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !categoryName.trim()}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Category
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
