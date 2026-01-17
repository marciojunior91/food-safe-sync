/**
 * Temporary Migration Page
 * Access at /migration-apply
 * Remove after applying migration
 */

import { ApplyRecipeSubcategoryMigration } from '@/components/migrations/ApplyRecipeSubcategoryMigration';

export default function MigrationApplyPage() {
  return (
    <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
      <ApplyRecipeSubcategoryMigration />
    </div>
  );
}
