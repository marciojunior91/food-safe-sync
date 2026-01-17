# Recipe Metadata Update

## Overview
Added tracking fields to recipes to display creation and update information:
- **Created at**: Timestamp when recipe was created (already existed)
- **Created by**: User who created the recipe (already existed)
- **Last Updated**: Timestamp when recipe was last updated (already existed)
- **Last Updated by**: User who last updated the recipe (NEW)

## Database Changes

### Migration File
`supabase/migrations/20251027_add_updated_by_to_recipes.sql`

This migration:
1. Adds `updated_by` UUID field to the `recipes` table
2. Sets initial values for existing records (uses `created_by`)
3. Creates proper foreign key constraints for relationship queries
4. Creates/updates trigger to automatically set `updated_at` and `updated_by` on recipe updates

### How to Apply Migration

**Option 1: Using Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn
2. Navigate to SQL Editor
3. Copy the entire contents of `supabase/migrations/20251027_add_updated_by_to_recipes.sql`
4. Paste into the SQL Editor
5. Click "Run"

**Option 2: Using Supabase CLI**
```bash
# Make sure you're logged in
supabase login

# Link to your project
supabase link --project-ref imnecvcvhypnlvujajpn

# Apply the migration
supabase db push
```

## Frontend Changes

### Files Modified

1. **src/integrations/supabase/types.ts**
   - Added `updated_by: string | null` to Recipe Row, Insert, and Update types

2. **src/pages/Recipes.tsx**
   - Updated Recipe interface to include `created_by`, `updated_at`, `updated_by`
   - Added creator and updater profile objects with `display_name`
   - Updated `fetchRecipes()` to:
     - Fetch all recipes
     - Collect unique user IDs (created_by and updated_by)
     - Fetch profiles for these users
     - Create a map and enrich recipes with creator/updater information
   - Added Calendar and User icons from lucide-react
   - Imported `format` from date-fns
   - Added metadata display section showing:
     - Created at (formatted timestamp)
     - Created by (user display_name from profiles)
     - Last Updated (formatted timestamp) - only shown if different from created_at
     - Last Updated by (user display_name from profiles) - only shown if recipe was updated

### Display Logic
- "Created at" and "Created by" always shown
- "Last Updated" and "Last Updated by" only shown when:
  - `updated_by` is not null
  - `updated_at` is different from `created_at`
  
This prevents showing redundant update information for recipes that haven't been modified.

## Automatic Behavior

Once the migration is applied, the trigger will automatically:
- Set `updated_at` to current timestamp whenever a recipe is updated
- Set `updated_by` to the ID of the user making the update

**No code changes needed in CreateRecipeDialog** - the trigger handles everything automatically!

## Testing

After applying the migration:
1. Create a new recipe → Should show "Created at" and "Created by" only
2. Edit an existing recipe → Should now also show "Last Updated" and "Last Updated by"
3. Verify the timestamps are formatted correctly (e.g., "Oct 27, 2025 at 14:30")
4. Verify the user names are displayed correctly

## Notes

- The `updated_by` field references `auth.users(id)`, not `profiles(user_id)`
- The query joins through profiles to get the `full_name` for display
- Foreign key constraint names are explicitly set for better relationship querying:
  - `recipes_created_by_fkey` → for creator relationship
  - `recipes_updated_by_fkey` → for updater relationship
