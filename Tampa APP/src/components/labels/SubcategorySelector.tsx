import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, ChevronDown, FolderTree, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export interface Subcategory {
  id: string;
  name: string;
  description: string | null;
  parent_subcategory_id: string | null;
  display_order: number;
  children?: Subcategory[];
}

export interface SubcategorySelectorProps {
  categoryId: string;
  value: string | null;
  onChange: (subcategoryId: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function SubcategorySelector({
  categoryId,
  value,
  onChange,
  disabled = false,
  className = "",
}: SubcategorySelectorProps) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);

  useEffect(() => {
    if (categoryId) {
      fetchSubcategories();
    } else {
      setSubcategories([]);
      setSelectedSubcategory(null);
    }
  }, [categoryId]);

  useEffect(() => {
    // Update selected subcategory when value changes
    if (value && subcategories.length > 0) {
      const found = findSubcategoryById(subcategories, value);
      setSelectedSubcategory(found);
    } else {
      setSelectedSubcategory(null);
    }
  }, [value, subcategories]);

  const fetchSubcategories = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("product_subcategories")
        .select("*")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;

      // Build hierarchical tree
      const tree = buildSubcategoryTree(data || []);
      setSubcategories(tree);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubcategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const buildSubcategoryTree = (flatList: any[]): Subcategory[] => {
    const map = new Map<string, Subcategory>();
    const roots: Subcategory[] = [];

    // First pass: create all nodes
    flatList.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    // Second pass: build tree structure
    flatList.forEach((item) => {
      const node = map.get(item.id)!;
      if (item.parent_subcategory_id) {
        const parent = map.get(item.parent_subcategory_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          // Parent not found, treat as root
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const findSubcategoryById = (items: Subcategory[], id: string): Subcategory | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children && item.children.length > 0) {
        const found = findSubcategoryById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleExpanded = (subcategoryId: string) => {
    const newExpanded = new Set(expanded);
    if (expanded.has(subcategoryId)) {
      newExpanded.delete(subcategoryId);
    } else {
      newExpanded.add(subcategoryId);
    }
    setExpanded(newExpanded);
  };

  const handleSelect = (subcategory: Subcategory) => {
    if (disabled) return;
    
    if (value === subcategory.id) {
      // Deselect if clicking the same one
      onChange(null);
      setSelectedSubcategory(null);
    } else {
      onChange(subcategory.id);
      setSelectedSubcategory(subcategory);
    }
  };

  const handleClear = () => {
    if (disabled) return;
    onChange(null);
    setSelectedSubcategory(null);
  };

  const renderSubcategoryTree = (items: Subcategory[], level = 0): JSX.Element[] => {
    return items.map((subcategory) => {
      const isSelected = value === subcategory.id;
      const hasChildren = subcategory.children && subcategory.children.length > 0;
      const isExpanded = expanded.has(subcategory.id);

      return (
        <div key={subcategory.id} className="w-full">
          <div
            className={cn(
              "flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-all",
              "hover:bg-accent group",
              isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
            onClick={() => handleSelect(subcategory)}
          >
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-5 w-5 p-0 hover:bg-transparent",
                  isSelected && "text-primary-foreground"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(subcategory.id);
                }}
                disabled={disabled}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-5" />
            )}
            
            <FolderTree className="h-4 w-4 shrink-0" />
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{subcategory.name}</p>
              {subcategory.description && (
                <p
                  className={cn(
                    "text-xs truncate",
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {subcategory.description}
                </p>
              )}
            </div>
          </div>

          {isExpanded && hasChildren && (
            <div className="mt-1">
              {renderSubcategoryTree(subcategory.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (!categoryId) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium flex items-center gap-2">
          <FolderTree className="w-4 h-4" />
          Subcategory
          <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
        </Label>
        {selectedSubcategory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="h-8 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {selectedSubcategory && (
        <div className="bg-primary/10 border border-primary/20 rounded-md p-3">
          <p className="text-xs font-medium text-primary mb-1">Selected:</p>
          <p className="text-sm font-medium">{selectedSubcategory.name}</p>
          {selectedSubcategory.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {selectedSubcategory.description}
            </p>
          )}
        </div>
      )}

      <ScrollArea className="h-[300px] w-full rounded-md border p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Loading subcategories...</p>
          </div>
        ) : subcategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <FolderTree className="w-12 h-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No subcategories available for this category
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You can continue without selecting a subcategory
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {renderSubcategoryTree(subcategories)}
          </div>
        )}
      </ScrollArea>

      <p className="text-xs text-muted-foreground">
        Subcategories help organize products within a category. Click to expand/collapse nested levels.
      </p>
    </div>
  );
}
