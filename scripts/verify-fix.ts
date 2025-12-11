import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { supabaseAdmin } from '../lib/supabase';

/**
 * Script to verify if the "General" subcategory fix was applied
 */

async function verifyFix() {
  console.log('🔍 Checking subcategory names...\n');

  try {
    // Get all categories with their subcategories
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select(`
        id,
        name,
        subcategories (
          id,
          name,
          description
        )
      `)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    if (!categories || categories.length === 0) {
      console.log('❌ No categories found in database');
      return;
    }

    console.log(`📊 Found ${categories.length} categories\n`);

    let generalCount = 0;
    let totalSubcategories = 0;

    for (const category of categories) {
      const subcategories = category.subcategories as any[];
      totalSubcategories += subcategories.length;

      console.log(`\n📁 Category: "${category.name}"`);

      if (subcategories.length === 0) {
        console.log('   ⚠️  No subcategories');
        continue;
      }

      console.log(`   Subcategories (${subcategories.length}):`);

      for (const sub of subcategories) {
        const isGeneral = sub.name.toLowerCase() === 'general';
        if (isGeneral) {
          generalCount++;
          console.log(`   ❌ "${sub.name}" (still named "General")`);
        } else {
          console.log(`   ✅ "${sub.name}"`);
        }
      }
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total categories: ${categories.length}`);
    console.log(`Total subcategories: ${totalSubcategories}`);
    console.log(`Subcategories still named "General": ${generalCount}`);

    if (generalCount === 0) {
      console.log('\n✨ SUCCESS! All "General" subcategories have been renamed.');
      console.log('The fix has been applied successfully.');
    } else {
      console.log(`\n⚠️  WARNING: ${generalCount} subcategory(ies) still named "General"`);
      console.log('Run: npm run fix-general');
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

verifyFix();
