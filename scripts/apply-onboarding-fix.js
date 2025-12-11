#!/usr/bin/env node
/**
 * Apply the onboarding function fix migration
 * Fixes the "column reference required_completed is ambiguous" error
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Read the migration SQL
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'fix_calculate_onboarding_progress.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Extract just the CREATE FUNCTION statement (remove comments)
const functionSQL = migrationSQL
  .split('\n')
  .filter(line => !line.trim().startsWith('--'))
  .join('\n')
  .trim();

async function applyMigration() {
  console.log('📦 Applying onboarding function fix migration...\n');
  console.log('🔧 Fixing: calculate_onboarding_progress function\n');

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Use Supabase's query builder to execute raw SQL
    const { data, error } = await supabase.rpc('exec', { sql: functionSQL });

    if (error && error.code === 'PGRST202') {
      console.log('⚠️  Direct SQL execution not available via RPC\n');
      console.log('📋 Please run this SQL manually in Supabase SQL Editor:\n');
      console.log('─'.repeat(60));
      console.log(migrationSQL);
      console.log('─'.repeat(60));
      console.log('\n💡 Instructions:');
      console.log('   1. Go to https://supabase.com/dashboard/project/vgwpacvlmxfiypgcmczm/sql');
      console.log('   2. Copy the SQL above');
      console.log('   3. Paste and click "Run"');
      console.log('\nOr copy from file:');
      console.log(`   ${migrationPath}`);
      process.exit(0);
    }

    if (error) {
      throw error;
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n📝 Function updated: calculate_onboarding_progress(intern_user_id)');
    console.log('🔧 Fixed: Ambiguous column reference issue');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:\n');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    console.log('\n💡 Instructions:');
    console.log('   1. Go to https://supabase.com/dashboard/project/vgwpacvlmxfiypgcmczm/sql');
    console.log('   2. Copy the SQL above');
    console.log('   3. Paste and click "Run"');
    process.exit(0);
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('\n✨ Next steps:');
    console.log('   1. Restart your dev server: npm run dev');
    console.log('   2. Test login as intern: intern@testing.test');
    console.log('   3. Should redirect to /dashboard/onboarding without errors');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
