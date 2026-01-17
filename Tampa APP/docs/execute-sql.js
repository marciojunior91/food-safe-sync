// Execute SQL script directly on Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://imnecvcvhypnlvujajpn.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here';

// Read SQL file
const sqlFile = path.join(__dirname, 'supabase', 'migrations', '20260110_backfill_user_roles_from_profiles.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

async function executeSql() {
  console.log('============================================');
  console.log('Executando Backfill de User Roles');
  console.log('============================================\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      process.exit(1);
    }

    console.log('✅ SQL executado com sucesso!');
    console.log('Resultado:', data);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

executeSql();
