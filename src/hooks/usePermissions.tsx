import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "owner" | "manager" | "leader_chef" | "chef" | "staff" | null;

export interface PermissionsState {
  userRole: UserRole;
  isLoading: boolean;
  canManageCategories: () => boolean;
  canManageTemplates: () => boolean;
  canManageUsers: () => boolean;
  canDeleteProducts: () => boolean;
  canViewAnalytics: () => boolean;
  canManageRecipes: () => boolean;
  canPrintLabels: () => boolean;
  isOwner: () => boolean;
  isManager: () => boolean;
  isLeaderChef: () => boolean;
  isChef: () => boolean;
}

/**
 * Hook for managing user permissions based on their role
 * Roles hierarchy: owner > manager > leader_chef > chef > staff
 */
export function usePermissions(): PermissionsState {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserRole();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        setUserRole(null);
      } else {
        setUserRole((data?.role as UserRole) || null);
      }
    } catch (error) {
      console.error("Error in fetchUserRole:", error);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Permission checker functions
  const canManageCategories = () => {
    return ["owner", "manager", "leader_chef"].includes(userRole || "");
  };

  const canManageTemplates = () => {
    return ["owner", "manager", "leader_chef"].includes(userRole || "");
  };

  const canManageUsers = () => {
    return ["owner", "manager"].includes(userRole || "");
  };

  const canDeleteProducts = () => {
    return ["owner", "manager"].includes(userRole || "");
  };

  const canViewAnalytics = () => {
    return ["owner", "manager", "leader_chef"].includes(userRole || "");
  };

  const canManageRecipes = () => {
    return ["owner", "manager", "leader_chef", "chef"].includes(userRole || "");
  };

  const canPrintLabels = () => {
    // All authenticated users can print labels
    return userRole !== null;
  };

  // Role checker functions
  const isOwner = () => userRole === "owner";
  const isManager = () => userRole === "manager";
  const isLeaderChef = () => userRole === "leader_chef";
  const isChef = () => userRole === "chef";

  return {
    userRole,
    isLoading,
    canManageCategories,
    canManageTemplates,
    canManageUsers,
    canDeleteProducts,
    canViewAnalytics,
    canManageRecipes,
    canPrintLabels,
    isOwner,
    isManager,
    isLeaderChef,
    isChef,
  };
}
