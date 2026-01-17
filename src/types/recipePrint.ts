/**
 * Recipe Printing Types
 * Extended types for recipe-to-label conversion
 */

export interface RecipePrintData {
  recipeId: string;
  recipeName: string;
  shelfLifeDays: number;
  batchMultiplier: number; // 1x, 2x, 3x etc.
  preparedBy: string;
  preparedById: string;
  manufacturingDate: Date;
  allergens?: Array<{ id: string; name: string }>;
  storageCondition?: 'ambient' | 'refrigerated' | 'frozen';
  quantity?: string;
  unit?: string;
  batchNumber?: string;
}

export interface RecipePrintFormData {
  batchMultiplier: number;
  preparedBy?: string;
  manufacturingDate: Date;
  storageCondition?: 'ambient' | 'refrigerated' | 'frozen';
  quantity?: string;
  unit?: string;
  batchNumber?: string;
}