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

  // Safety check: don't render if no categoryId
  if (!categoryId || categoryId === "all") {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading subcategories...
      </div>
    );
  }

  if (subcategories.length === 0) {
    return (
      <div>
        <p className="text-xs text-muted-foreground">
          No subcategories available for this category
        </p>
        <Select disabled>
          <SelectTrigger id="subcategory">
            <SelectValue placeholder="No subcategories available" />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <>
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
    </>
  );
}
