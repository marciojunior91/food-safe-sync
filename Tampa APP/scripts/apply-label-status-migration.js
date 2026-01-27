import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = "https://imnecvcvhypnlvujajpn.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required');
  console.log('Please set the service role key from your Supabase dashboard');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
  }
});

async function applyLabelStatusMigration() {
  try {
    console.log('📁 Reading label status migration file...');
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260127000000_add_label_status.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('🚀 Applying label status migration...');
    
    // Execute the migration as a single statement since it's wrapped in DO block
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }

    console.log('✅ Label status migration applied successfully!');
    
    // Test the migration by checking if the column exists
    console.log('🔍 Verifying migration...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'printed_labels')
      .eq('column_name', 'status');

    if (columnsError) {
      console.warn('⚠️  Could not verify column:', columnsError);
    } else {
      const hasStatus = columns && columns.length > 0;
      console.log(`📊 Status column ${hasStatus ? 'exists' : 'not found'}`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyLabelStatusMigration();