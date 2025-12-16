import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SimilarProduct {
  product_id: string;
  product_name: string;
  category_name: string;
  subcategory_name: string;
  similarity_score: number;
  allergen_count: number;
  last_printed: string | null;
}

interface UseDuplicateDetectionProps {
  productName: string;
  organizationId: string;
  minSimilarity?: number;
  debounceMs?: number;
  excludeProductId?: string;
}

interface UseDuplicateDetectionReturn {
  similarProducts: SimilarProduct[];
  isLoading: boolean;
  isDuplicate: boolean;
  error: string | null;
  checkDuplicate: () => Promise<boolean>;
  refreshSimilarProducts: () => Promise<void>;
}

/**
 * Hook to detect duplicate products using fuzzy text matching
 * 
 * Features:
 * - Real-time similarity search as user types
 * - Debounced API calls to reduce load
 * - Boolean duplicate check (85%+ similarity)
 * - Returns top 10 similar products
 * 
 * @param productName - Name to search for duplicates
 * @param organizationId - Current organization ID
 * @param minSimilarity - Minimum similarity threshold (default: 0.3 = 30%)
 * @param debounceMs - Debounce delay in milliseconds (default: 500)
 * @param excludeProductId - Product ID to exclude from results (for editing)
 */
export function useDuplicateDetection({
  productName,
  organizationId,
  minSimilarity = 0.3,
  debounceMs = 500,
  excludeProductId,
}: UseDuplicateDetectionProps): UseDuplicateDetectionReturn {
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch similar products with debouncing
  useEffect(() => {
    // Don't search if name is too short or no organization ID
    if (!productName || productName.trim().length < 3 || !organizationId) {
      setSimilarProducts([]);
      setIsDuplicate(false);
      return;
    }

    const timer = setTimeout(async () => {
      await fetchSimilarProducts();
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [productName, organizationId, minSimilarity, excludeProductId]);

  /**
   * Fetch similar products from database
   */
  const fetchSimilarProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "find_similar_products" as any,
        {
          search_name: productName.trim(),
          org_id: organizationId,
          min_similarity: minSimilarity,
        }
      );

      if (rpcError) {
        throw new Error(`Failed to fetch similar products: ${rpcError.message}`);
      }

      // Filter out excluded product if editing
      let filteredData = (data || []) as SimilarProduct[];
      if (excludeProductId) {
        filteredData = filteredData.filter(
          (p: SimilarProduct) => p.product_id !== excludeProductId
        );
      }

      setSimilarProducts(filteredData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching similar products:", err);
      setSimilarProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if product name is a likely duplicate (85%+ similarity)
   * Returns true if duplicate found
   */
  const checkDuplicate = async (): Promise<boolean> => {
    if (!productName || productName.trim().length < 3 || !organizationId) {
      setIsDuplicate(false);
      return false;
    }

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "is_duplicate_product" as any,
        {
          check_name: productName.trim(),
          org_id: organizationId,
          exclude_id: excludeProductId || null,
        }
      );

      if (rpcError) {
        throw new Error(`Failed to check duplicate: ${rpcError.message}`);
      }

      const isDupe = data === true;
      setIsDuplicate(isDupe);
      return isDupe;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error checking duplicate:", err);
      return false;
    }
  };

  /**
   * Manually refresh similar products (for external triggers)
   */
  const refreshSimilarProducts = async () => {
    await fetchSimilarProducts();
  };

  return {
    similarProducts,
    isLoading,
    isDuplicate,
    error,
    checkDuplicate,
    refreshSimilarProducts,
  };
}
