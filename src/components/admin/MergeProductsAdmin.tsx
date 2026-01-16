import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
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
import { AlertCircle, ArrowRight, Loader2, AlertTriangle, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

interface DuplicatePair {
  product1: {
    id: string;
    name: string;
  };
  product2: {
    id: string;
    name: string;
  };
  similarity: number;
}

interface DuplicateStats {
  total_products: number;
  potential_duplicates: number;
  duplicate_groups: DuplicatePair[] | null;
}

interface MergeResult {
  success: boolean;
  error?: string;
  source_product?: { id: string; name: string };
  target_product?: { id: string; name: string };
  labels_migrated?: number;
  allergens_migrated?: number;
}

interface MergeProductsAdminProps {
  organizationId: string;
}

/**
 * Admin component for managing duplicate products
 * 
 * Features:
 * - View organization-wide duplicate statistics
 * - See all duplicate product pairs with similarity scores
 * - Merge duplicate products (migrate labels & allergens)
 * - Confirm before destructive operations
 */
export function MergeProductsAdmin({ organizationId }: MergeProductsAdminProps) {
  const { toast } = useToast();
  const { isAdmin, isManager, roles, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<DuplicateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  
  // Merge confirmation dialog
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [selectedPair, setSelectedPair] = useState<DuplicatePair | null>(null);
  const [mergeDirection, setMergeDirection] = useState<"1to2" | "2to1">("1to2");

  // Permission check: Only admins and managers can merge
  const canMerge = isAdmin || isManager;

  useEffect(() => {
    fetchDuplicateStats();
  }, [organizationId]);

  /**
   * Fetch duplicate statistics from database
   */
  const fetchDuplicateStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "get_duplicate_stats" as any,
        { org_id: organizationId }
      );

      if (rpcError) {
        throw new Error(`Failed to fetch stats: ${rpcError.message}`);
      }

      if (data && Array.isArray(data) && data.length > 0) {
        setStats(data[0] as DuplicateStats);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching duplicate stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Open merge confirmation dialog
   */
  const handleOpenMergeDialog = (pair: DuplicatePair, direction: "1to2" | "2to1") => {
    if (!canMerge) {
      toast({
        title: "Permission Denied",
        description: "You need admin or manager permissions to merge products.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedPair(pair);
    setMergeDirection(direction);
    setShowMergeDialog(true);
  };

  /**
   * Merge two products
   */
  const handleMergeProducts = async () => {
    if (!selectedPair) return;

    const sourceId = mergeDirection === "1to2" ? selectedPair.product1.id : selectedPair.product2.id;
    const targetId = mergeDirection === "1to2" ? selectedPair.product2.id : selectedPair.product1.id;
    const sourceName = mergeDirection === "1to2" ? selectedPair.product1.name : selectedPair.product2.name;
    const targetName = mergeDirection === "1to2" ? selectedPair.product2.name : selectedPair.product1.name;

    setIsMerging(true);

    try {
      const { data, error: rpcError } = await supabase.rpc("merge_products" as any, {
        source_product_id: sourceId,
        target_product_id: targetId,
        org_id: organizationId,
      });

      if (rpcError) {
        throw new Error(`Merge failed: ${rpcError.message}`);
      }

      const result = data as MergeResult;
      
      if (result && !result.success) {
        throw new Error(result.error || "Merge failed");
      }

      toast({
        title: "Products Merged Successfully",
        description: (
          <div className="space-y-1">
            <p className="font-medium">{sourceName} → {targetName}</p>
            <p className="text-sm text-gray-600">
              {result?.labels_migrated || 0} label{result?.labels_migrated !== 1 ? "s" : ""} migrated
            </p>
            <p className="text-sm text-gray-600">
              {result?.allergens_migrated || 0} allergen{result?.allergens_migrated !== 1 ? "s" : ""} migrated
            </p>
          </div>
        ),
      });

      // Refresh stats
      await fetchDuplicateStats();
      setShowMergeDialog(false);
      setSelectedPair(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error merging products:", err);
      toast({
        title: "Merge Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsMerging(false);
    }
  };

  // Loading state
  if (isLoading || roleLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Duplicate Data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // No stats
  if (!stats) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>Unable to load duplicate statistics.</AlertDescription>
      </Alert>
    );
  }

  const duplicateGroups = stats.duplicate_groups || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Duplicate Product Management</CardTitle>
              <CardDescription>
                Identify and merge duplicate products to maintain data quality
              </CardDescription>
            </div>
            {/* Role Badge */}
            <Badge 
              variant={isAdmin ? "default" : isManager ? "secondary" : "outline"}
              className="flex items-center gap-1"
            >
              <Shield className="h-3 w-3" />
              {isAdmin ? "Admin" : isManager ? "Manager" : "View Only"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Permission Warning for Non-Admin/Manager */}
          {!canMerge && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>View Only Mode</AlertTitle>
              <AlertDescription>
                You can view duplicate statistics, but only administrators and managers can merge products.
              </AlertDescription>
            </Alert>
          )}

          {/* Statistics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-700">
                  {stats.total_products}
                </div>
                <div className="text-sm text-blue-600 mt-1">Total Products</div>
              </CardContent>
            </Card>

            <Card className={duplicateGroups.length > 0 ? "border-yellow-200 bg-yellow-50" : "border-gray-200"}>
              <CardContent className="pt-6">
                <div className={`text-3xl font-bold ${duplicateGroups.length > 0 ? "text-yellow-700" : "text-gray-700"}`}>
                  {stats.potential_duplicates}
                </div>
                <div className={`text-sm mt-1 ${duplicateGroups.length > 0 ? "text-yellow-600" : "text-gray-600"}`}>
                  Potential Duplicates
                </div>
              </CardContent>
            </Card>

            <Card className={duplicateGroups.length > 0 ? "border-orange-200 bg-orange-50" : "border-gray-200"}>
              <CardContent className="pt-6">
                <div className={`text-3xl font-bold ${duplicateGroups.length > 0 ? "text-orange-700" : "text-gray-700"}`}>
                  {duplicateGroups.length}
                </div>
                <div className={`text-sm mt-1 ${duplicateGroups.length > 0 ? "text-orange-600" : "text-gray-600"}`}>
                  Duplicate Pairs
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Duplicate Pairs List */}
          {duplicateGroups.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Duplicate Product Pairs (70%+ similarity)
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {duplicateGroups.map((pair, index) => (
                  <Card key={index} className="border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 flex items-center gap-3">
                          {/* Product 1 */}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{pair.product1.name}</div>
                            <div className="text-xs text-gray-500">ID: {pair.product1.id.slice(0, 8)}...</div>
                          </div>

                          {/* Similarity Badge */}
                          <Badge
                            variant={
                              pair.similarity >= 0.9
                                ? "destructive"
                                : pair.similarity >= 0.8
                                ? "default"
                                : "secondary"
                            }
                            className="shrink-0"
                          >
                            {Math.round(pair.similarity * 100)}% match
                          </Badge>

                          {/* Product 2 */}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{pair.product2.name}</div>
                            <div className="text-xs text-gray-500">ID: {pair.product2.id.slice(0, 8)}...</div>
                          </div>
                        </div>

                        {/* Merge Buttons */}
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenMergeDialog(pair, "1to2")}
                            disabled={!canMerge}
                            title={canMerge ? "Merge right" : "Admin/Manager permission required"}
                            className="text-xs"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenMergeDialog(pair, "2to1")}
                            disabled={!canMerge}
                            title={canMerge ? "Merge left" : "Admin/Manager permission required"}
                            className="text-xs"
                          >
                            <ArrowRight className="h-3 w-3 rotate-180" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Duplicates Found</AlertTitle>
              <AlertDescription>
                Great! Your product database is clean. No potential duplicates detected.
              </AlertDescription>
            </Alert>
          )}

          {/* Refresh Button */}
          <Button onClick={fetchDuplicateStats} variant="outline" className="w-full">
            Refresh Statistics
          </Button>
        </CardContent>
      </Card>

      {/* Merge Confirmation Dialog */}
      <AlertDialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Confirm Product Merge
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {selectedPair && (
                <>
                  <p>This action will merge the following products:</p>
                  <div className="bg-gray-50 p-3 rounded-md space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">Source</Badge>
                      <span className="font-medium">
                        {mergeDirection === "1to2" ? selectedPair.product1.name : selectedPair.product2.name}
                      </span>
                    </div>
                    <div className="text-center">
                      <ArrowRight className="h-4 w-4 inline" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">Target</Badge>
                      <span className="font-medium">
                        {mergeDirection === "1to2" ? selectedPair.product2.name : selectedPair.product1.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">What will happen:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>All printed labels will be updated to reference the target product</li>
                      <li>All allergens will be migrated to the target product</li>
                      <li>The source product will be permanently deleted</li>
                    </ul>
                  </div>
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Warning:</strong> This action cannot be undone. Make sure you're merging the correct products.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMerging}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMergeProducts}
              disabled={isMerging}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isMerging ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Merging...
                </>
              ) : (
                "Confirm Merge"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
