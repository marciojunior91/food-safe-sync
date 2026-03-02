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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Tag } from 'lucide-react';

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateCategoryDialog({ open, onOpenChange, onSuccess }: CreateCategoryDialogProps) {
  const [categoryName, setCategoryName] = useState('');
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
    }
  }, [user?.id, open]);

  const handleCreate = async () => {
    if (!categoryName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Category name is required',
      });
      return;
    }

    if (!organizationId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Organization not found',
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('label_categories')
        .insert({
          name: categoryName.trim(),
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Category "${data.name}" created successfully`,
      });

      setCategoryName('');
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating) {
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Create New Category
          </DialogTitle>
          <DialogDescription>
            Add a new category for organizing your food labels.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="category-name">Category Name</Label>
            <Input
              id="category-name"
              placeholder="e.g., Dairy, Meat, Vegetables..."
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isCreating}
              autoFocus
            />
          </div>
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
