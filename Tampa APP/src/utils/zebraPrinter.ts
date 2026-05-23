// Label data types + DB persistence helper.
//
// Historically this module also contained the print pipeline (ZPL generation
// + network transports). All printing is now handled by the driver-specific
// classes in src/lib/printers/ (BluetoothUniversalPrinter / WebUsbPrinter)
// using the shared ZPL generator at src/utils/labelZpl.ts. This file is now
// just the data contract + the saveLabelToDatabase helper.

import { supabase } from "@/integrations/supabase/client";

export interface OrganizationDetails {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  /** SIF in Brazil, Food Business Registration in Australia */
  foodSafetyRegistration?: string;
}

export interface LabelPrintData {
  /** UUID from printed_labels table — for lifecycle tracking */
  labelId?: string;
  /** UUID or null for quick print without a product */
  productId: string | null;
  productName: string;
  categoryId: string | null;
  categoryName: string;
  subcategoryId?: string | null;
  subcategoryName?: string;
  preparedBy: string;
  preparedByName: string;
  prepDate: string;
  expiryDate: string;
  condition: string;
  /** Required for Row Level Security */
  organizationId: string;
  organizationDetails?: OrganizationDetails;
  quantity?: string;
  unit?: string;
  qrCodeData?: string;
  batchNumber: string;
  allergens?: Array<{
    id: string;
    name: string;
    icon: string | null;
    severity: string;
  }>;
}

/**
 * Persist a printed label to the database history.
 * Returns the new row's UUID (the `labelId`), or null on failure.
 *
 * Required: `preparedBy` (audit trail) and `organizationId` (RLS).
 */
export async function saveLabelToDatabase(data: LabelPrintData): Promise<string | null> {
  try {
    if (!data.preparedBy || data.preparedBy.trim() === '') {
      throw new Error('VALIDATION ERROR: prepared_by is required for every label (food safety audit trail).');
    }
    if (!data.organizationId || data.organizationId.trim() === '') {
      throw new Error('VALIDATION ERROR: organizationId is required for Row Level Security.');
    }

    const allergenNames = data.allergens?.map(a => a.name) || [];

    const productId = data.productId && data.productId.trim() !== '' ? data.productId : null;
    const categoryId = data.categoryId && data.categoryId.trim() !== '' ? data.categoryId : null;
    const subcategoryId = data.subcategoryId && data.subcategoryId.trim() !== '' ? data.subcategoryId : null;

    const { data: inserted, error } = await supabase
      .from('printed_labels')
      .insert({
        product_id: productId,
        product_name: data.productName,
        category_id: categoryId,
        category_name: data.categoryName,
        subcategory_id: subcategoryId,
        prepared_by: data.preparedBy,
        prepared_by_name: data.preparedByName,
        prep_date: data.prepDate,
        expiry_date: data.expiryDate,
        condition: data.condition,
        quantity: data.quantity || null,
        unit: data.unit || null,
        organization_id: data.organizationId,
        allergens: allergenNames.length > 0 ? allergenNames : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving label to database:', error);
      throw error;
    }
    return inserted?.id || null;
  } catch (error) {
    console.error('Failed to save label:', error);
    throw error;
  }
}
