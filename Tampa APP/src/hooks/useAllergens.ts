import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface Allergen {
  id: string;
  name: string;
  icon: string | null;
  severity: string;
  is_common: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductAllergen {
  id: string;
  product_id: string;
  allergen_id: string;
  created_at: string;
  allergen?: Allergen;
}

export function useAllergens() {
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllergens();
  }, []);

  const fetchAllergens = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching allergens from database...");
      
      const { data, error } = await supabase
        .from("allergens")
        .select("*")
        .order("is_common", { ascending: false })
        .order("severity")
        .order("name");

      console.log("🔍 Allergens query result:", { data, error, count: data?.length });

      if (error) {
        console.error("❌ Allergens query error:", error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.warn("⚠️ No allergens found in database! Table might be empty.");
      }
      
      setAllergens(data || []);
    } catch (error) {
      console.error("❌ Error fetching allergens:", error);
      toast({
        title: "Error",
        description: "Failed to load allergens. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getProductAllergens = async (productId: string): Promise<Allergen[]> => {
    try {
      const { data, error } = await supabase
        .from("product_allergens")
        .select(`
          allergen_id,
          allergens (*)
        `)
        .eq("product_id", productId);

      if (error) throw error;
      
      return (data || [])
        .map((pa: any) => pa.allergens)
        .filter(Boolean) as Allergen[];
    } catch (error) {
      console.error("Error fetching product allergens:", error);
      return [];
    }
  };

  const addProductAllergen = async (productId: string, allergenId: string) => {
    try {
      const { error } = await supabase
        .from("product_allergens")
        .insert({ product_id: productId, allergen_id: allergenId });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Allergen added to product",
      });
      
      return true;
    } catch (error: any) {
      console.error("Error adding product allergen:", error);
      
      // Check if it's a duplicate
      if (error.code === '23505') {
        toast({
          title: "Info",
          description: "This allergen is already added to the product",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add allergen",
          variant: "destructive",
        });
      }
      
      return false;
    }
  };

  const removeProductAllergen = async (productId: string, allergenId: string) => {
    try {
      const { error } = await supabase
        .from("product_allergens")
        .delete()
        .eq("product_id", productId)
        .eq("allergen_id", allergenId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Allergen removed from product",
      });
      
      return true;
    } catch (error) {
      console.error("Error removing product allergen:", error);
      toast({
        title: "Error",
        description: "Failed to remove allergen",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const updateProductAllergens = async (
    productId: string, 
    allergenIds: string[]
  ) => {
    try {
      // First, get current allergens
      const current = await getProductAllergens(productId);
      const currentIds = current.map(a => a.id);

      // Find allergens to add and remove
      const toAdd = allergenIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !allergenIds.includes(id));

      // Remove old allergens
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("product_allergens")
          .delete()
          .eq("product_id", productId)
          .in("allergen_id", toRemove);

        if (deleteError) throw deleteError;
      }

      // Add new allergens
      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from("product_allergens")
          .insert(toAdd.map(allergenId => ({
            product_id: productId,
            allergen_id: allergenId,
          })));

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: "Product allergens updated",
      });
      
      return true;
    } catch (error) {
      console.error("Error updating product allergens:", error);
      toast({
        title: "Error",
        description: "Failed to update allergens",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const getCommonAllergens = () => {
    return allergens.filter(a => a.is_common);
  };

  const getCriticalAllergens = () => {
    return allergens.filter(a => a.severity === 'critical');
  };

  return {
    allergens,
    loading,
    getProductAllergens,
    addProductAllergen,
    removeProductAllergen,
    updateProductAllergens,
    getCommonAllergens,
    getCriticalAllergens,
    refetch: fetchAllergens,
  };
}
