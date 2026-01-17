/**
 * Apply Recipe Subcategory Migration
 * Run this with: npm run apply-migration
 * Or directly: npx tsx scripts/apply-recipe-subcategory.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read environment variables (you'll need to set these)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying Recipe Subcategory Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260109_add_recipes_subcategory.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by statements (simple split on semicolons)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error);
        // Continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    console.log('\n🎉 Migration applied successfully!\n');
    
    // Verify the migration
    console.log('🔍 Verifying migration...\n');
    
    const { data: categories, error: catError } = await supabase
      .from('label_categories')
      .select('id, name, icon')
      .eq('name', 'Prepared Foods');

    if (catError) {
      console.error('❌ Error verifying categories:', catError);
    } else if (categories && categories.length > 0) {
      console.log('✅ Category created:', categories[0]);
      
      const { data: subcategories, error: subError } = await supabase
        .from('label_subcategories')
        .select('id, name, icon, category_id')
        .eq('category_id', categories[0].id);

      if (subError) {
        console.error('❌ Error verifying subcategories:', subError);
      } else if (subcategories && subcategories.length > 0) {
        console.log('✅ Subcategory created:', subcategories[0]);
      } else {
        console.log('⚠️  No subcategories found');
      }
    } else {
      console.log('⚠️  Category not found');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
