import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSubcategories } from "@/hooks/useSubcategories";
import { Loader2 } from "lucide-react";

interface SubcategorySelectorSimpleProps {
  categoryId: string;
  value: string;
  onChange: (subcategoryId: string, subcategoryName: string) => void;
  disabled?: boolean;
}

export function SubcategorySelectorSimple({
  categoryId,
  value,
  onChange,
  disabled = false,
}: SubcategorySelectorSimpleProps) {
  const { subcategories, loading } = useSubcategories(categoryId);

  if (!categoryId) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Subcategory (Optional)</Label>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading subcategories...
        </div>
      </div>
    );
  }

  if (subcategories.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-muted-foreground">Subcategory (Optional)</Label>
        <p className="text-xs text-muted-foreground">
          No subcategories available for this category
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="subcategory">Subcategory (Optional)</Label>
      <Select
        value={value}
        onValueChange={(val) => {
          const subcategory = subcategories.find(s => s.id === val);
          if (subcategory) {
            onChange(subcategory.id, subcategory.name);
          } else {
            onChange("", "");
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger id="subcategory">
          <SelectValue placeholder="Select a subcategory..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">None</SelectItem>
          {subcategories.map((subcategory) => (
            <SelectItem key={subcategory.id} value={subcategory.id}>
              {subcategory.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {subcategories.length} subcategor{subcategories.length === 1 ? 'y' : 'ies'} available
      </p>
    </div>
  );
}
