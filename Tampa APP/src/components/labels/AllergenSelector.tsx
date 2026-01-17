import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, X } from "lucide-react";

export interface Allergen {
  id: string;
  name: string;
  icon: string;
  category: "major" | "other";
}

// Australian Food Standards Code - major allergens
export const COMMON_ALLERGENS: Allergen[] = [
  { id: "gluten", name: "Gluten (Wheat)", icon: "🌾", category: "major" },
  { id: "crustaceans", name: "Crustaceans", icon: "🦞", category: "major" },
  { id: "eggs", name: "Eggs", icon: "🥚", category: "major" },
  { id: "fish", name: "Fish", icon: "🐟", category: "major" },
  { id: "milk", name: "Milk", icon: "🥛", category: "major" },
  { id: "peanuts", name: "Peanuts", icon: "🥜", category: "major" },
  { id: "tree_nuts", name: "Tree Nuts", icon: "🌰", category: "major" },
  { id: "sesame", name: "Sesame Seeds", icon: "🌱", category: "major" },
  { id: "soy", name: "Soy/Soybean", icon: "🫘", category: "major" },
  { id: "lupin", name: "Lupin", icon: "🌸", category: "major" },
  { id: "shellfish", name: "Molluscs", icon: "🦐", category: "other" },
  { id: "sulphites", name: "Sulphites", icon: "⚗️", category: "other" },
  { id: "celery", name: "Celery", icon: "🥬", category: "other" },
  { id: "mustard", name: "Mustard", icon: "🌭", category: "other" },
];

export interface AllergenSelectorProps {
  selected: string[];
  onChange: (allergens: string[]) => void;
  disabled?: boolean;
  showCategories?: boolean;
  className?: string;
}

export function AllergenSelector({
  selected = [],
  onChange,
  disabled = false,
  showCategories = true,
  className = "",
}: AllergenSelectorProps) {
  const [showAll, setShowAll] = useState(false);

  const toggleAllergen = (allergenId: string) => {
    if (disabled) return;

    if (selected.includes(allergenId)) {
      onChange(selected.filter((id) => id !== allergenId));
    } else {
      onChange([...selected, allergenId]);
    }
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const majorAllergens = COMMON_ALLERGENS.filter((a) => a.category === "major");
  const otherAllergens = COMMON_ALLERGENS.filter((a) => a.category === "other");
  const displayAllergens = showAll ? COMMON_ALLERGENS : majorAllergens;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-orange-500" />
          Allergens
        </Label>
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={disabled}
            className="h-8 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {selected.length > 0 && (
        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-orange-800 dark:text-orange-300 mb-2">
              Selected Allergens ({selected.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.map((allergenId) => {
                const allergen = COMMON_ALLERGENS.find((a) => a.id === allergenId);
                if (!allergen) return null;
                return (
                  <Badge
                    key={allergenId}
                    variant="default"
                    className="bg-orange-500 hover:bg-orange-600 text-white text-sm py-1 px-3 cursor-pointer"
                    onClick={() => toggleAllergen(allergenId)}
                  >
                    <span className="mr-2">{allergen.icon}</span>
                    {allergen.name}
                    <X className="w-3 h-3 ml-2" />
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {showCategories && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Major Allergens (Australian Standards)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {majorAllergens.map((allergen) => {
                const isSelected = selected.includes(allergen.id);
                return (
                  <Button
                    key={allergen.id}
                    variant={isSelected ? "default" : "outline"}
                    size="lg"
                    className={`h-auto py-3 px-3 flex flex-col items-center gap-2 touch-target transition-all ${
                      isSelected
                        ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                        : "hover:bg-accent hover:scale-105"
                    }`}
                    onClick={() => toggleAllergen(allergen.id)}
                    disabled={disabled}
                  >
                    <span className="text-2xl">{allergen.icon}</span>
                    <span className="text-xs text-center leading-tight">
                      {allergen.name}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {showAll && otherAllergens.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Other Allergens
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {otherAllergens.map((allergen) => {
                  const isSelected = selected.includes(allergen.id);
                  return (
                    <Button
                      key={allergen.id}
                      variant={isSelected ? "default" : "outline"}
                      size="lg"
                      className={`h-auto py-3 px-3 flex flex-col items-center gap-2 touch-target transition-all ${
                        isSelected
                          ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                          : "hover:bg-accent hover:scale-105"
                      }`}
                      onClick={() => toggleAllergen(allergen.id)}
                      disabled={disabled}
                    >
                      <span className="text-2xl">{allergen.icon}</span>
                      <span className="text-xs text-center leading-tight">
                        {allergen.name}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            disabled={disabled}
            className="w-full"
          >
            {showAll ? "Show Less" : `Show All Allergens (${otherAllergens.length} more)`}
          </Button>
        </div>
      )}

      {!showCategories && (
        <div className="flex flex-wrap gap-2">
          {displayAllergens.map((allergen) => {
            const isSelected = selected.includes(allergen.id);
            return (
              <Button
                key={allergen.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={`touch-target transition-all ${
                  isSelected
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "hover:scale-105"
                }`}
                onClick={() => toggleAllergen(allergen.id)}
                disabled={disabled}
              >
                <span className="mr-2">{allergen.icon}</span>
                {allergen.name}
              </Button>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        Select all allergens present in this product. This information will be displayed on the label.
      </p>
    </div>
  );
}
