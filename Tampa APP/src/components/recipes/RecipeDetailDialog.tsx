import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Users,
  Calendar,
  User,
  Edit,
  Trash2,
  Printer,
  Copy,
  ChefHat,
} from "lucide-react";
import { format } from "date-fns";

interface Recipe {
  id: string;
  name: string;
  ingredients: any;
  prep_steps: any;
  allergens: string[];
  dietary_requirements: string[];
  yield_amount: number;
  yield_unit: string;
  hold_time_days: number;
  category: string;
  estimated_prep_minutes: number;
  service_gap_minutes: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string | null;
  organization_id: string;
  creator?: {
    display_name: string;
  } | null;
  updater?: {
    display_name: string;
  } | null;
}

interface RecipeDetailDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipe: Recipe) => void;
  onPrint?: (recipe: Recipe) => void;
  onDuplicate?: (recipe: Recipe) => void;
  canManageRecipes?: boolean;
}

export function RecipeDetailDialog({
  recipe,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onPrint,
  onDuplicate,
  canManageRecipes = false,
}: RecipeDetailDialogProps) {
  if (!recipe) return null;

  // Get ingredients as array (handle both string[] and structured format)
  const getIngredients = (): string[] => {
    if (!recipe.ingredients) return [];
    if (Array.isArray(recipe.ingredients)) {
      return recipe.ingredients.map((ing: any) => {
        if (typeof ing === 'string') return ing;
        // Structured format: { quantity, unit, name, notes? }
        return `${ing.quantity} ${ing.unit} ${ing.name}${ing.notes ? ` ${ing.notes}` : ''}`;
      });
    }
    return [];
  };

  const getPrepSteps = (): string[] => {
    if (!recipe.prep_steps) return [];
    if (Array.isArray(recipe.prep_steps)) return recipe.prep_steps;
    return [];
  };

  const ingredients = getIngredients();
  const prepSteps = getPrepSteps();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-2xl font-bold leading-tight">
                {recipe.name}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-medium">
                  {recipe.category}
                </Badge>
                {recipe.allergens && recipe.allergens.length > 0 && (
                  <>
                    {recipe.allergens.map((allergen) => (
                      <Badge
                        key={allergen}
                        variant="destructive"
                        className="font-bold"
                      >
                        ⚠️ {allergen}
                      </Badge>
                    ))}
                  </>
                )}
                {recipe.dietary_requirements &&
                  recipe.dietary_requirements.length > 0 && (
                    <>
                      {recipe.dietary_requirements.map((dietary) => (
                        <Badge
                          key={dietary}
                          variant="outline"
                          className="border-green-500 text-green-700"
                        >
                          {dietary}
                        </Badge>
                      ))}
                    </>
                  )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Yield</p>
                  <p className="font-semibold">
                    {recipe.yield_amount} {recipe.yield_unit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Prep Time</p>
                  <p className="font-semibold">{recipe.estimated_prep_minutes} min</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Hold Time</p>
                  <p className="font-semibold">{recipe.hold_time_days} days</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <ChefHat className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Steps</p>
                  <p className="font-semibold">{prepSteps.length}</p>
                </div>
              </div>
            </div>

            {/* Ingredients Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span>Ingredients</span>
                <Badge variant="secondary">{ingredients.length}</Badge>
              </h3>
              <div className="space-y-2">
                {ingredients.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No ingredients listed
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {ingredients.map((ingredient, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <span className="flex-1">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <Separator />

            {/* Prep Steps Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span>Preparation Steps</span>
                <Badge variant="secondary">{prepSteps.length}</Badge>
              </h3>
              <div className="space-y-3">
                {prepSteps.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No preparation steps listed
                  </p>
                ) : (
                  <ol className="space-y-3">
                    {prepSteps.map((step, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-md bg-muted/30"
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="flex-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>

            <Separator />

            {/* Recipe Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Created by</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">
                    {recipe.creator?.display_name || 'Unknown'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(recipe.created_at), 'PPp')}
                </p>
              </div>

              {recipe.updated_at &&
                recipe.updated_at !== recipe.created_at && (
                  <div>
                    <p className="text-muted-foreground mb-1">Last updated by</p>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">
                        {recipe.updater?.display_name || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(recipe.updated_at), 'PPp')}
                    </p>
                  </div>
                )}
            </div>
          </div>
        </ScrollArea>

        <Separator />

        {/* Actions Footer */}
        <div className="p-4 flex flex-wrap gap-2">
          {onPrint && (
            <Button variant="outline" size="sm" onClick={() => onPrint(recipe)}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          )}
          
          {onDuplicate && canManageRecipes && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDuplicate(recipe)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>
          )}
          
          {onEdit && canManageRecipes && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onEdit(recipe);
                onOpenChange(false);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          
          {onDelete && canManageRecipes && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 ml-auto"
              onClick={() => {
                onDelete(recipe);
                onOpenChange(false);
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
