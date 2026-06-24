// Backbone Step: Label Categories & Subcategories
// New users are offered a recommended default layout (pre-applied) and can
// customise, add, remove or clear everything before continuing.

import { useState } from "react";
import { Plus, Trash2, SmilePlus, Sparkles, Eraser, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { CategoriesData, CategoryEntry, DEFAULT_TAXONOMY } from "@/types/onboarding";
import { useToast } from "@/hooks/use-toast";

interface CategoriesStepProps {
  data: Partial<CategoriesData>;
  onChange: (data: Partial<CategoriesData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Deep clone so edits never mutate the shared DEFAULT_TAXONOMY constant.
const cloneTaxonomy = (taxonomy: CategoryEntry[]): CategoryEntry[] =>
  taxonomy.map((c) => ({ ...c, subcategories: c.subcategories.map((s) => ({ ...s })) }));

const isDefaultLayout = (categories: CategoryEntry[]): boolean =>
  JSON.stringify(categories) === JSON.stringify(DEFAULT_TAXONOMY);

// Small emoji-picker button reused for both categories and subcategories.
function IconPicker({ value, onPick }: { value: string; onPick: (emoji: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="h-10 w-10 text-xl p-0 shrink-0">
          {value || <SmilePlus className="w-4 h-4 text-muted-foreground" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <EmojiPicker
          onEmojiClick={(e: EmojiClickData) => onPick(e.emoji)}
          theme={Theme.AUTO}
          height={350}
          width={300}
          searchPlaceholder="Search emoji..."
          previewConfig={{ showPreview: false }}
        />
      </PopoverContent>
    </Popover>
  );
}

export default function CategoriesStep({ data, onChange, onNext, onBack }: CategoriesStepProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryEntry[]>(
    data.categories && data.categories.length > 0
      ? cloneTaxonomy(data.categories)
      : cloneTaxonomy(DEFAULT_TAXONOMY)
  );

  // Push local edits up to the parent, tracking whether the recommended
  // default layout is still intact (so the page can report "used default").
  const update = (next: CategoryEntry[]) => {
    setCategories(next);
    onChange({ categories: next, usedDefault: isDefaultLayout(next) });
  };

  const applyDefault = () => update(cloneTaxonomy(DEFAULT_TAXONOMY));
  const clearAll = () => update([]);

  const addCategory = () =>
    update([...categories, { name: "", icon: "", subcategories: [] }]);

  const updateCategory = (index: number, patch: Partial<CategoryEntry>) => {
    const next = categories.map((c, i) => (i === index ? { ...c, ...patch } : c));
    update(next);
  };

  const removeCategory = (index: number) =>
    update(categories.filter((_, i) => i !== index));

  const addSubcategory = (catIndex: number) => {
    const next = categories.map((c, i) =>
      i === catIndex ? { ...c, subcategories: [...c.subcategories, { name: "", icon: "" }] } : c
    );
    update(next);
  };

  const updateSubcategory = (
    catIndex: number,
    subIndex: number,
    patch: Partial<{ name: string; icon: string }>
  ) => {
    const next = categories.map((c, i) => {
      if (i !== catIndex) return c;
      return {
        ...c,
        subcategories: c.subcategories.map((s, j) => (j === subIndex ? { ...s, ...patch } : s)),
      };
    });
    update(next);
  };

  const removeSubcategory = (catIndex: number, subIndex: number) => {
    const next = categories.map((c, i) =>
      i === catIndex
        ? { ...c, subcategories: c.subcategories.filter((_, j) => j !== subIndex) }
        : c
    );
    update(next);
  };

  const handleNext = () => {
    // Categories are the system's backbone — require at least one named category.
    const named = categories.filter((c) => c.name.trim());
    if (named.length === 0) {
      toast({
        title: "Add at least one category",
        description: "Use the recommended layout or create your own to continue.",
        variant: "destructive",
      });
      return;
    }
    // Persist only fully-named entries (drop blank rows / blank subcategories).
    const cleaned: CategoryEntry[] = named.map((c) => ({
      name: c.name.trim(),
      icon: c.icon,
      subcategories: c.subcategories
        .filter((s) => s.name.trim())
        .map((s) => ({ name: s.name.trim(), icon: s.icon })),
    }));
    onChange({ categories: cleaned, usedDefault: isDefaultLayout(categories) });
    onNext();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Recommended-default offer */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Recommended layout applied</p>
              <p className="text-sm text-muted-foreground">
                We've pre-filled a complete food-safety category set. Keep it as-is and just
                continue, or customise it below.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={applyDefault}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Use recommended
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
              <Eraser className="w-4 h-4 mr-1.5" />
              Clear all
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category editor */}
      <div className="space-y-4">
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No categories yet. Add one below or apply the recommended layout.
          </p>
        )}

        {categories.map((category, catIndex) => (
          <Card key={catIndex}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <IconPicker
                  value={category.icon}
                  onPick={(emoji) => updateCategory(catIndex, { icon: emoji })}
                />
                <Input
                  value={category.name}
                  onChange={(e) => updateCategory(catIndex, { name: e.target.value })}
                  placeholder="Category name (e.g. Proteins)"
                  className="font-medium"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeCategory(catIndex)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Subcategories */}
              <div className="pl-4 border-l-2 border-border space-y-2">
                {category.subcategories.map((sub, subIndex) => (
                  <div key={subIndex} className="flex items-center gap-2">
                    <IconPicker
                      value={sub.icon}
                      onPick={(emoji) => updateSubcategory(catIndex, subIndex, { icon: emoji })}
                    />
                    <Input
                      value={sub.name}
                      onChange={(e) =>
                        updateSubcategory(catIndex, subIndex, { name: e.target.value })
                      }
                      placeholder="Subcategory name (e.g. Beef)"
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeSubcategory(catIndex, subIndex)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => addSubcategory(catIndex)}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add subcategory
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button type="button" variant="outline" className="w-full" onClick={addCategory}>
          <Plus className="w-4 h-4 mr-2" />
          Add category
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="button" onClick={handleNext} className="flex-1" size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
}
