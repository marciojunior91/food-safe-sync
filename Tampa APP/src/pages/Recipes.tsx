import { useState, useEffect } from "react";
import { Plus, Search, Clock, Users, AlertTriangle, ChefHat, Filter, Edit, Trash2, MessageSquare, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { CreateRecipeDialog } from "@/components/recipes/CreateRecipeDialog";
import { PrepareRecipeDialog } from "@/components/recipes/PrepareRecipeDialog";
import { format } from "date-fns";
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
  creator?: {
    display_name: string;
  } | null;
  updater?: {
    display_name: string;
  } | null;
}

const recipeCategories = [
  "All Categories", "Entrees", "Mains", "Desserts", "Sides", "Sauces", "Beverages", "Bakery", "Other"
];

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPrepareDialogOpen, setIsPrepareDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { hasRole, roles, loading: rolesLoading } = useUserRole();
  const { toast } = useToast();
  
  // Check if user can manage recipes (admin or leader_chef)
  const canManageRecipes = hasRole('admin') || hasRole('leader_chef');

  // Debug logging
  useEffect(() => {
    console.log('🔍 Recipe Permissions Debug:', {
      userId: user?.id,
      roles: roles,
      rolesLoading: rolesLoading,
      hasAdminRole: hasRole('admin'),
      hasLeaderChefRole: hasRole('leader_chef'),
      canManageRecipes: canManageRecipes
    });
  }, [user, roles, rolesLoading, canManageRecipes]);

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

  const handlePrepareRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsPrepareDialogOpen(true);
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipe.allergens || []).some(allergen => 
        allergen.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      (recipe.dietary_requirements || []).some(dietary => 
        dietary.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesCategory = selectedCategory === "All Categories" || recipe.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
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
      {/* Debug Info - Remove after testing */}
      <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
        <CardContent className="pt-4">
          <p className="text-sm font-mono">
            <strong>Debug Info:</strong> User ID: {user?.id?.slice(0, 8)}... | 
            Roles: [{roles.join(', ') || 'none'}] | 
            Can Manage: {canManageRecipes ? '✅ YES' : '❌ NO'} | 
            Loading: {rolesLoading ? 'Yes' : 'No'}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground">
            {canManageRecipes ? "Manage your recipe collection" : "Browse available recipes"}
          </p>
        </div>
        {canManageRecipes && (
          <Button onClick={() => {
            setRecipeToEdit(null);
            setIsCreateDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Recipe
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search recipes, allergens, or dietary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {recipeCategories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">No recipes found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms" : 
                   canManageRecipes ? "Get started by creating your first recipe" : 
                   "No recipes available yet"}
                </p>
              </div>
              {!searchTerm && canManageRecipes && (
                <Button onClick={() => {
                  setRecipeToEdit(null);
                  setIsCreateDialogOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Recipe
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <Card key={recipe.id} className="hover:shadow-card transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="line-clamp-2">{recipe.name}</span>
                  {(recipe.allergens || []).length > 0 && (
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 ml-2" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {recipe.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{(recipe.estimated_prep_minutes || 0) + (recipe.service_gap_minutes || 0)}min</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{recipe.yield_amount} {recipe.yield_unit}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{(recipe.prep_steps as string[])?.length || 0} steps</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.hold_time_days}d hold</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Ingredients ({(recipe.ingredients as string[])?.length || 0})</h4>
                  <div className="text-sm text-muted-foreground">
                    {(recipe.ingredients as string[])?.slice(0, 3)?.join(", ")}
                    {(recipe.ingredients as string[])?.length > 3 && (
                      <span> + {(recipe.ingredients as string[]).length - 3} more</span>
                    )}
                  </div>
                </div>

                {(recipe.allergens || []).length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-red-600">Allergens</h4>
                    <div className="flex flex-wrap gap-1">
                      {(recipe.allergens || []).map((allergen) => (
                        <Badge key={allergen} variant="destructive" className="text-xs font-bold">
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(recipe.dietary_requirements || []).length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-green-600">Dietary</h4>
                    <div className="flex flex-wrap gap-1">
                      {(recipe.dietary_requirements || []).map((dietary) => (
                        <Badge key={dietary} variant="secondary" className="text-xs">
                          {dietary}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recipe Metadata */}
                <div className="pt-2 border-t space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span className="font-medium">Created at:</span>
                    <span>{format(new Date(recipe.created_at), "MMM dd, yyyy 'at' HH:mm")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    <span className="font-medium">Created by:</span>
                    <span>{recipe.creator?.display_name || 'Unknown'}</span>
                  </div>
                  {recipe.updated_by && recipe.updated_at !== recipe.created_at && (
                    <>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span className="font-medium">Last Updated:</span>
                        <span>{format(new Date(recipe.updated_at), "MMM dd, yyyy 'at' HH:mm")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        <span className="font-medium">Last Updated by:</span>
                        <span>{recipe.updater?.display_name || 'Unknown'}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-2 space-y-2">
                  <Button 
                    size="sm" 
                    onClick={() => handlePrepareRecipe(recipe)}
                    className="w-full"
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    Prepare Recipe
                  </Button>
                  
                  <div className="flex gap-2">
                    {/* Comments button - available to all users */}
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // TODO: Implement comments dialog
                        toast({
                          title: "Coming Soon",
                          description: "Recipe comments feature will be available soon",
                        });
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Notes
                    </Button>
                    
                    {/* Edit/Delete buttons - only for admins and leader_chef */}
                    {canManageRecipes && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRecipe(recipe);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecipeToDelete(recipe);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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

      <PrepareRecipeDialog
        open={isPrepareDialogOpen}
        onOpenChange={setIsPrepareDialogOpen}
        recipe={selectedRecipe}
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
    </div>
  );
}