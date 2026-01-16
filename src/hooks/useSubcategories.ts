import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface Subcategory {
  id: string;
  name: string;
  category_id: string;
  organization_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubcategoryWithCategory extends Subcategory {
  category?: {
    id: string;
    name: string;
  };
}

export function useSubcategories(categoryId?: string) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (categoryId) {
      fetchSubcategories(categoryId);
    } else {
      setSubcategories([]);
    }
  }, [categoryId]);

  const fetchSubcategories = async (catId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("label_subcategories")
        .select("*")
        .eq("category_id", catId)
        .order("display_order")
        .order("name");

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      toast({
        title: "Error",
        description: "Failed to load subcategories",
        variant: "destructive",
      });
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSubcategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("label_subcategories")
        .select(`
          *,
          label_categories:category_id (
            id,
            name
          )
        `)
        .order("category_id")
        .order("display_order")
        .order("name");

      if (error) throw error;
      return (data || []) as SubcategoryWithCategory[];
    } catch (error) {
      console.error("Error fetching all subcategories:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createSubcategory = async (
    name: string,
    categoryId: string,
    displayOrder?: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      const { data, error } = await supabase
        .from("label_subcategories")
        .insert({
          name,
          category_id: categoryId,
          organization_id: profile?.organization_id,
          display_order: displayOrder || 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Subcategory "${name}" created successfully`,
      });

      // Refresh list if we're viewing this category
      if (categoryId === categoryId) {
        await fetchSubcategories(categoryId);
      }

      return data;
    } catch (error: any) {
      console.error("Error creating subcategory:", error);
      
      if (error.code === '23505') {
        toast({
          title: "Error",
          description: "A subcategory with this name already exists in this category",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create subcategory",
          variant: "destructive",
        });
      }
      
      return null;
    }
  };

  const updateSubcategory = async (
    id: string,
    updates: Partial<Omit<Subcategory, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      const { error } = await supabase
        .from("label_subcategories")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subcategory updated successfully",
      });

      // Refresh list
      if (categoryId) {
        await fetchSubcategories(categoryId);
      }

      return true;
    } catch (error) {
      console.error("Error updating subcategory:", error);
      toast({
        title: "Error",
        description: "Failed to update subcategory",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteSubcategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from("label_subcategories")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subcategory deleted successfully",
      });

      // Refresh list
      if (categoryId) {
        await fetchSubcategories(categoryId);
      }

      return true;
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast({
        title: "Error",
        description: "Failed to delete subcategory. It may be in use.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    subcategories,
    loading,
    fetchSubcategories,
    fetchAllSubcategories,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    refetch: () => categoryId && fetchSubcategories(categoryId),
  };
}
