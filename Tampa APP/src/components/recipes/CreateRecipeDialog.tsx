import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface CreateRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  recipeToEdit?: any | null;
}

const allergenOptions = [
  "Dairy", "Eggs", "Fish", "Shellfish", "Tree Nuts", "Peanuts", "Wheat", "Gluten", 
  "Soybeans", "Sesame", "Lupin", "Sulphites", "Mustard", "Celery"
];

const dietaryRequirements = [
  "Vegan", "Vegetarian", "Halal", "Kosher", "Gluten-Free", "Dairy-Free", "Nut-Free"
];

const recipeCategories = [
  "Entrees", "Mains", "Desserts", "Sides", "Sauces", "Beverages", "Bakery", "Other"
];

export function CreateRecipeDialog({ open, onOpenChange, onSuccess, recipeToEdit }: CreateRecipeDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    yieldAmount: "",
    yieldUnit: "servings",
    holdTimeDays: "3",
    category: "Mains",
    estimatedPrepMinutes: "30",
    serviceGapMinutes: "0",
  });
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [prepSteps, setPrepSteps] = useState<string[]>([]);
  const [newPrepStep, setNewPrepStep] = useState("");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [customAllergen, setCustomAllergen] = useState("");
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Update form when recipeToEdit changes
  useEffect(() => {
    if (recipeToEdit) {
      setFormData({
        name: recipeToEdit.name || "",
        yieldAmount: recipeToEdit.yield_amount?.toString() || "",
        yieldUnit: recipeToEdit.yield_unit || "servings",
        holdTimeDays: recipeToEdit.hold_time_days?.toString() || "3",
        category: recipeToEdit.category || "Mains",
        estimatedPrepMinutes: recipeToEdit.estimated_prep_minutes?.toString() || "30",
        serviceGapMinutes: recipeToEdit.service_gap_minutes?.toString() || "0",
      });
      setIngredients(recipeToEdit.ingredients || []);
      setPrepSteps(recipeToEdit.prep_steps || []);
      setSelectedAllergens(recipeToEdit.allergens || []);
      setSelectedDietary(recipeToEdit.dietary_requirements || []);
    } else {
      resetForm();
    }
  }, [recipeToEdit, open]);

  const resetForm = () => {
    setFormData({ 
      name: "", 
      yieldAmount: "", 
      yieldUnit: "servings", 
      holdTimeDays: "3",
      category: "Mains",
      estimatedPrepMinutes: "30",
      serviceGapMinutes: "0",
    });
    setIngredients([]);
    setNewIngredient("");
    setPrepSteps([]);
    setNewPrepStep("");
    setSelectedAllergens([]);
    setCustomAllergen("");
    setSelectedDietary([]);
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addPrepStep = () => {
    if (newPrepStep.trim()) {
      setPrepSteps([...prepSteps, newPrepStep.trim()]);
      setNewPrepStep("");
    }
  };

  const removePrepStep = (index: number) => {
    setPrepSteps(prepSteps.filter((_, i) => i !== index));
  };

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens(prev =>
      prev.includes(allergen)
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    );
  };

  const addCustomAllergen = () => {
    if (customAllergen.trim() && !selectedAllergens.includes(customAllergen.trim())) {
      setSelectedAllergens([...selectedAllergens, customAllergen.trim()]);
      setCustomAllergen("");
    }
  };

  const toggleDietary = (dietary: string) => {
    setSelectedDietary(prev =>
      prev.includes(dietary)
        ? prev.filter(d => d !== dietary)
        : [...prev, dietary]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim() || ingredients.length === 0 || prepSteps.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get user's organization_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      const recipeData = {
        name: formData.name.trim(),
        ingredients,
        prep_steps: prepSteps,
        allergens: selectedAllergens,
        dietary_requirements: selectedDietary,
        yield_amount: parseInt(formData.yieldAmount) || 1,
        yield_unit: formData.yieldUnit,
        hold_time_days: parseInt(formData.holdTimeDays) || 3,
        category: formData.category,
        estimated_prep_minutes: parseInt(formData.estimatedPrepMinutes) || 30,
        service_gap_minutes: parseInt(formData.serviceGapMinutes) || 0,
      };

      let error;
      
      if (recipeToEdit) {
        // Update existing recipe
        const result = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', recipeToEdit.id);
        error = result.error;
      } else {
        // Create new recipe
        const result = await supabase
          .from('recipes')
          .insert({
            ...recipeData,
            created_by: user.id,
            organization_id: profile?.organization_id,
          });
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: recipeToEdit ? "Recipe updated successfully" : "Recipe created successfully",
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating recipe:', error);
      toast({
        title: "Error",
        description: "Failed to create recipe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipeToEdit ? "Edit Recipe" : "Create New Recipe"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Recipe Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter recipe name"
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background opacity-100">
                  {recipeCategories.map((category) => (
                    <SelectItem key={category} value={category} className="bg-background opacity-100">{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="holdTime">Hold Time (days) *</Label>
              <Input
                id="holdTime"
                type="number"
                value={formData.holdTimeDays}
                onChange={(e) => setFormData({ ...formData, holdTimeDays: e.target.value })}
                placeholder="3"
                min="1"
                required
              />
            </div>
          </div>

          {/* Yield and Timing */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="yield">Yield *</Label>
              <div className="flex gap-2">
                <Input
                  id="yield"
                  type="number"
                  value={formData.yieldAmount}
                  onChange={(e) => setFormData({ ...formData, yieldAmount: e.target.value })}
                  placeholder="Amount"
                  min="1"
                  required
                />
                <Select value={formData.yieldUnit} onValueChange={(value) => setFormData({ ...formData, yieldUnit: value })}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background opacity-100">
                    <SelectItem value="servings" className="bg-background opacity-100">servings</SelectItem>
                    <SelectItem value="portions" className="bg-background opacity-100">portions</SelectItem>
                    <SelectItem value="litres" className="bg-background opacity-100">litres</SelectItem>
                    <SelectItem value="kg" className="bg-background opacity-100">kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="prepTime">Est. Prep Time (minutes)</Label>
              <Input
                id="prepTime"
                type="number"
                value={formData.estimatedPrepMinutes}
                onChange={(e) => setFormData({ ...formData, estimatedPrepMinutes: e.target.value })}
                placeholder="30"
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="serviceGap">Service Gap (minutes)</Label>
              <Input
                id="serviceGap"
                type="number"
                value={formData.serviceGapMinutes}
                onChange={(e) => setFormData({ ...formData, serviceGapMinutes: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <Label>Ingredients *</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="Add ingredient"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
              />
              <Button type="button" onClick={addIngredient} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ingredient, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {ingredient}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeIngredient(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Preparation Steps */}
          <div>
            <Label>Preparation Steps *</Label>
            <div className="flex gap-2 mb-2">
              <Textarea
                value={newPrepStep}
                onChange={(e) => setNewPrepStep(e.target.value)}
                placeholder="Add preparation step"
                className="min-h-[60px]"
              />
              <Button type="button" onClick={addPrepStep} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {prepSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                  <span className="font-medium text-sm text-muted-foreground">
                    {index + 1}.
                  </span>
                  <span className="flex-1 text-sm">{step}</span>
                  <X
                    className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-destructive"
                    onClick={() => removePrepStep(index)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Allergens */}
          <div>
            <Label>Allergens</Label>
            <div className="flex flex-wrap gap-2 mt-2 mb-4">
              {allergenOptions.map((allergen) => (
                <Button
                  key={allergen}
                  type="button"
                  variant={selectedAllergens.includes(allergen) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleAllergen(allergen)}
                >
                  {allergen}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customAllergen}
                onChange={(e) => setCustomAllergen(e.target.value)}
                placeholder="Add custom allergen"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAllergen())}
              />
              <Button type="button" onClick={addCustomAllergen} size="sm" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Dietary Requirements */}
          <div>
            <Label>Dietary Requirements</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {dietaryRequirements.map((dietary) => (
                <div key={dietary} className="flex items-center space-x-2">
                  <Checkbox
                    id={dietary}
                    checked={selectedDietary.includes(dietary)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDietary([...selectedDietary, dietary]);
                      } else {
                        setSelectedDietary(selectedDietary.filter(d => d !== dietary));
                      }
                    }}
                  />
                  <Label htmlFor={dietary} className="text-sm font-normal">{dietary}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (recipeToEdit ? "Updating..." : "Creating...") : (recipeToEdit ? "Update Recipe" : "Create Recipe")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}