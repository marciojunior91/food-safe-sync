import { useState, useEffect } from "react";
import { Plus, Search, Clock, Users, AlertTriangle, ChefHat, Filter, Edit, Trash2, Grid3X3, List, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { usePlanEnforcement } from "@/hooks/usePlanEnforcement";
import { CreateRecipeDialog } from "@/components/recipes/CreateRecipeDialog";
import { RecipePrintButton } from "@/components/recipes/RecipePrintButton";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { RecipeDetailDialog } from "@/components/recipes/RecipeDetailDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const CATEGORY_EMOJIS: Record<string, string> = {
  Entrees: '🥗',
  Mains: '🍽️',
  Desserts: '🍰',
  Sides: '🥕',
  Sauces: '\uD83E\uDD63',
  Beverages: '🥤',
  Bakery: '🥖',
  Other: '📂',
};

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [pageView, setPageView] = useState<'categories' | 'recipes'>('categories');
  const [selectedCategoryView, setSelectedCategoryView] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<Recipe | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { role, isAdmin, isLeaderChef, loading: rolesLoading } = useUserRole();
  const { checkRecipeLimit, upgradeModalProps } = usePlanEnforcement();
  const { toast } = useToast();
  
  // Check if user can manage recipes (admin or leader_chef)
  const canManageRecipes = isAdmin || isLeaderChef;



  // Handle create recipe button click with limit check
  const handleCreateRecipeClick = () => {
    const currentCount = recipes.length;
    if (!checkRecipeLimit(currentCount)) {
      return; // Modal will show automatically
    }
    setRecipeToEdit(null);
    setIsCreateDialogOpen(true);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      // Fetch recipes first
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (recipesError) throw recipesError;

      // Fetch all unique user IDs
      const userIds = new Set<string>();
      recipesData?.forEach(recipe => {
        if (recipe.created_by) userIds.add(recipe.created_by);
        if (recipe.updated_by) userIds.add(recipe.updated_by);
      });

      // Fetch profiles for these users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', Array.from(userIds));

      // Create a map of user_id to display_name
      const profileMap = new Map(
        profilesData?.map(p => [p.user_id, p.display_name]) || []
      );

      // Combine the data
      const enrichedRecipes = recipesData?.map(recipe => ({
        ...recipe,
        creator: recipe.created_by ? { display_name: profileMap.get(recipe.created_by) || 'Unknown' } : null,
        updater: recipe.updated_by ? { display_name: profileMap.get(recipe.updated_by) || 'Unknown' } : null,
      }));

      setRecipes(enrichedRecipes || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch recipes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecipe = async () => {
    if (!recipeToDelete) return;

    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recipe deleted successfully",
      });
      
      fetchRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast({
        title: "Error",
        description: "Failed to delete recipe",
        variant: "destructive",
      });
    } finally {
      setRecipeToDelete(null);
    }
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setIsCreateDialogOpen(true);
  };

  const handleDuplicateRecipe = async (recipe: Recipe) => {
    // ENHANCEMENT 8: Recipe duplicate feature
    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert([{
          name: `${recipe.name} (Copy)`,
          category: recipe.category,
          ingredients: recipe.ingredients,
          prep_steps: recipe.prep_steps,
          yield_amount: recipe.yield_amount,
          yield_unit: recipe.yield_unit,
          estimated_prep_minutes: recipe.estimated_prep_minutes,
          service_gap_minutes: recipe.service_gap_minutes,
          hold_time_days: recipe.hold_time_days,
          allergens: recipe.allergens,
          dietary_requirements: recipe.dietary_requirements,
          created_by: user?.id,
          updated_by: user?.id,
          organization_id: recipe.organization_id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Recipe duplicated successfully",
      });

      fetchRecipes();
      
      // Open the detail dialog for the new recipe
      if (data) {
        setSelectedRecipeDetail(data);
      }
    } catch (error) {
      console.error('Error duplicating recipe:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate recipe",
        variant: "destructive",
      });
    }
  };

  const filteredRecipes = recipes
    .filter(recipe => {
      const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (recipe.allergens || []).some(allergen => 
          allergen.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        (recipe.dietary_requirements || []).some(dietary => 
          dietary.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // BUGFIX RECIPES-5: Case-insensitive + trimmed category comparison
      const matchesCategory = selectedCategory === "All Categories" || 
        recipe.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
      
      // Also apply category view filter
      const matchesCategoryView = !selectedCategoryView ||
        recipe.category?.trim().toLowerCase() === selectedCategoryView.trim().toLowerCase();
      
      return matchesSearch && matchesCategory && matchesCategoryView;
    })
    .sort((a, b) => {
      // BUG-017: Add sorting logic
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "created-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "created-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "prep-asc":
          return (a.estimated_prep_minutes || 0) - (b.estimated_prep_minutes || 0);
        case "prep-desc":
          return (b.estimated_prep_minutes || 0) - (a.estimated_prep_minutes || 0);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
            <p className="text-muted-foreground">Manage your recipe collection</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground">
            {canManageRecipes ? "Manage your recipe collection" : "Browse available recipes"}
          </p>
        </div>
        {canManageRecipes && (
          <Button onClick={handleCreateRecipeClick}>
            <Plus className="w-4 h-4 mr-2" />
            Create Recipe
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
          <Input
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent className="bg-background opacity-100">
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="created-desc">Newest First</SelectItem>
            <SelectItem value="created-asc">Oldest First</SelectItem>
            <SelectItem value="prep-asc">Prep Time ↑</SelectItem>
            <SelectItem value="prep-desc">Prep Time ↓</SelectItem>
          </SelectContent>
        </Select>
        {/* View toggle */}
        <div className="flex border rounded-md overflow-hidden">
          <Button
            size="sm"
            variant={pageView === 'categories' ? 'default' : 'ghost'}
            className="rounded-none px-3"
            onClick={() => { setPageView('categories'); setSelectedCategoryView(null); }}
          >
            <Grid3X3 className="w-4 h-4 mr-1" />
            Categories
          </Button>
          <Button
            size="sm"
            variant={pageView === 'recipes' ? 'default' : 'ghost'}
            className="rounded-none px-3"
            onClick={() => setPageView('recipes')}
          >
            <List className="w-4 h-4 mr-1" />
            All Recipes
          </Button>
        </div>
      </div>

      {/* ── CATEGORIES VIEW ── */}
      {pageView === 'categories' && !selectedCategoryView && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Object.entries(CATEGORY_EMOJIS).map(([cat, emoji]) => {
            const count = recipes.filter(r => r.category?.trim().toLowerCase() === cat.toLowerCase()).length;
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCategoryView(cat); setPageView('recipes'); }}
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border bg-card hover:bg-accent hover:shadow-md transition-all text-center"
              >
                <span className="text-5xl">{emoji}</span>
                <span className="font-semibold text-sm">{cat}</span>
                <Badge variant="secondary" className="text-xs">{count} recipe{count !== 1 ? 's' : ''}</Badge>
              </button>
            );
          })}
          {/* All Recipes tile */}
          <button
            onClick={() => { setSelectedCategoryView(null); setPageView('recipes'); }}
            className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border bg-card hover:bg-accent hover:shadow-md transition-all text-center"
          >
            <span className="text-5xl">📋</span>
            <span className="font-semibold text-sm">All Recipes</span>
            <Badge variant="outline" className="text-xs">{recipes.length} total</Badge>
          </button>
        </div>
      )}

      {/* ── RECIPES LIST VIEW ── */}
      {pageView === 'recipes' && (
        <>
          {/* Back breadcrumb when viewing a category */}
          {selectedCategoryView && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setSelectedCategoryView(null); setPageView('categories'); }}>
                ← Categories
              </Button>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{CATEGORY_EMOJIS[selectedCategoryView] || '📂'} {selectedCategoryView}</span>
            </div>
          )}

          {filteredRecipes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <ChefHat className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">No recipes found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || selectedCategoryView
                        ? "No recipes match your current filters"
                        : canManageRecipes
                          ? "Get started by creating your first recipe"
                          : "No recipes available yet"}
                    </p>
                  </div>
                  {(searchTerm || selectedCategoryView) ? (
                    <Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedCategoryView(null); }}>
                      Clear Filters
                    </Button>
                  ) : canManageRecipes && (
                    <Button onClick={() => { setRecipeToEdit(null); setIsCreateDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Recipe
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRecipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                  onClick={() => setSelectedRecipeDetail(recipe)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-lg">{CATEGORY_EMOJIS[recipe.category] || '📂'}</p>
                        <CardTitle className="text-sm font-semibold leading-tight line-clamp-2 mt-1">
                          {recipe.name}
                        </CardTitle>
                      </div>
                      {(recipe.allergens || []).length > 0 && (
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{recipe.category}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />{recipe.estimated_prep_minutes || 0}m
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />{recipe.yield_amount} {recipe.yield_unit}
                      </span>
                    </div>
                    {(recipe.allergens || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(recipe.allergens || []).slice(0, 3).map(a => (
                          <Badge key={a} variant="destructive" className="text-xs">⚠️ {a}</Badge>
                        ))}
                        {(recipe.allergens || []).length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{(recipe.allergens || []).length - 3}</Badge>
                        )}
                      </div>
                    )}
                    {/* Actions */}
                    <div className="mt-auto pt-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 whitespace-nowrap"
                        onClick={() => setSelectedRecipeDetail(recipe)}
                      >
                        <ChefHat className="w-3 h-3 shrink-0 mr-1" />
                        View
                      </Button>
                      <RecipePrintButton
                        recipe={{
                          id: recipe.id,
                          name: recipe.name,
                          shelf_life_days: recipe.hold_time_days,
                          allergens: recipe.allergens?.map((name, index) => ({
                            id: `allergen-${index}`,
                            name
                          }))
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1 whitespace-nowrap"
                      />
                      {canManageRecipes && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="px-2 shrink-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditRecipe(recipe)}>
                              <Edit className="w-3 h-3 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setRecipeToDelete(recipe)}
                            >
                              <Trash2 className="w-3 h-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <CreateRecipeDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setRecipeToEdit(null);
        }}
        onSuccess={() => {
          fetchRecipes();
          setRecipeToEdit(null);
        }}
        recipeToEdit={recipeToEdit}
      />

      {/* Recipe Detail Dialog */}
      <RecipeDetailDialog
        recipe={selectedRecipeDetail}
        open={!!selectedRecipeDetail}
        onOpenChange={(open) => {
          if (!open) setSelectedRecipeDetail(null);
        }}
        onEdit={(recipe) => {
          setSelectedRecipeDetail(null);
          handleEditRecipe(recipe);
        }}
        onDelete={(recipe) => {
          setSelectedRecipeDetail(null);
          setRecipeToDelete(recipe);
        }}
        onPrint={(recipe) => {
          // Print handled by RecipePrintButton in the dialog
          toast({
            title: "Print Label",
            description: "Opening print dialog...",
          });
        }}
        onDuplicate={(recipe) => {
          setSelectedRecipeDetail(null);
          handleDuplicateRecipe(recipe);
        }}
        canManageRecipes={canManageRecipes}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!recipeToDelete} onOpenChange={() => setRecipeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the recipe "{recipeToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecipe} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Recipe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Modal for Plan Limits */}
      <UpgradeModal {...upgradeModalProps} />
    </div>
  );
}