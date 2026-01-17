#!/usr/bin/env node
/**
 * Iteration 10: Apply Duplicate Product Detection Migration
 * 
 * This script applies the duplicate product detection functions to the database:
 * - find_similar_products() - Find products with similar names
 * - is_duplicate_product() - Check if a name is likely a duplicate
 * - get_duplicate_stats() - Get duplicate statistics for organization
 * - merge_products() - Merge two products together
 * 
 * Features:
 * - Fuzzy text matching using PostgreSQL pg_trgm extension
 * - Trigram similarity scoring (0.0 to 1.0)
 * - Configurable similarity threshold (default 0.3 for suggestions, 0.85 for duplicates)
 * - Safe merge with migration of labels and allergens
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://imnecvcvhypnlvujajpn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5Mjg3MywiZXhwIjoyMDcxMjY4ODczfQ.yFgAcczt8EIV7DSdayOVJK9U0hhcqM5KYflEfQYGBQk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyMigration() {
  console.log('🔧 Applying Duplicate Product Detection Migration...\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, '../../supabase/migrations/20251216000000_duplicate_product_detection.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log('📏 SQL size:', migrationSQL.length, 'characters\n');

    // Execute migration
    console.log('⚙️  Executing migration...');
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try direct execution via REST API if rpc fails
      console.log('⚠️  RPC failed, trying direct execution...');
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: migrationSQL })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    }

    console.log('✅ Migration executed successfully!\n');

    // Test the functions
    console.log('🧪 Testing duplicate detection functions...\n');

    // Test 1: Check if pg_trgm is enabled
    const { data: extensions } = await supabase
      .rpc('exec_sql', { 
        sql: "SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';" 
      });
    
    console.log('✅ pg_trgm extension:', extensions ? 'enabled' : 'checking...');

    // Test 2: Try finding similar products (should work even with no matches)
    console.log('\n📊 Testing find_similar_products function...');
    const { data: similar, error: similarError } = await supabase
      .rpc('find_similar_products', {
        search_name: 'Test Product',
        org_id: '4808e8a5-547b-4601-ab90-a8388ee748fa',
        min_similarity: 0.3
      });

    if (similarError) {
      console.log('⚠️  Error testing function:', similarError.message);
    } else {
      console.log(`✅ Function working! Found ${similar?.length || 0} similar products`);
    }

    // Test 3: Check duplicate detection
    console.log('\n🔍 Testing is_duplicate_product function...');
    const { data: isDup, error: dupError } = await supabase
      .rpc('is_duplicate_product', {
        check_name: 'Caesar Salad Mix',
        org_id: '4808e8a5-547b-4601-ab90-a8388ee748fa'
      });

    if (dupError) {
      console.log('⚠️  Error testing function:', dupError.message);
    } else {
      console.log(`✅ Function working! Is duplicate:`, isDup);
    }

    console.log('\n🎉 Migration complete!\n');
    console.log('📚 Available functions:');
    console.log('   • find_similar_products(name, org_id, min_similarity)');
    console.log('   • is_duplicate_product(name, org_id, exclude_id)');
    console.log('   • get_duplicate_stats(org_id)');
    console.log('   • merge_products(source_id, target_id, org_id)');
    console.log('\n💡 Next: Integrate into React components\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Manual steps:');
    console.log('1. Open Supabase SQL Editor');
    console.log('2. Copy contents of: supabase/migrations/20251216000000_duplicate_product_detection.sql');
    console.log('3. Execute the SQL manually');
    process.exit(1);
  }
}

applyMigration();
