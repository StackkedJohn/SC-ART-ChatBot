import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { supabaseAdmin } from '../lib/supabase';

/**
 * Script to fix "General" subcategory naming issue
 *
 * Problem: Each category has a generic "General" subcategory which is confusing
 * Solution: Rename "General" subcategories to be more descriptive based on parent category
 */

async function fixGeneralSubcategories() {
  console.log('🔧 Starting to fix "General" subcategories...\n');

  try {
    // 1. Find all categories with their subcategories
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select(`
        id,
        name,
        subcategories (
          id,
          name,
          description,
          category_id
        )
      `)
      .order('sort_order', { ascending: true });

    if (categoriesError) throw categoriesError;

    if (!categories || categories.length === 0) {
      console.log('No categories found.');
      return;
    }

    console.log(`📊 Found ${categories.length} categories\n`);

    // 2. Process each category
    for (const category of categories) {
      const subcategories = category.subcategories as any[];

      console.log(`\n📁 Category: "${category.name}"`);
      console.log(`   Subcategories: ${subcategories.length}`);

      // Find "General" subcategories
      const generalSubcategories = subcategories.filter(
        (sub) => sub.name.toLowerCase() === 'general'
      );

      if (generalSubcategories.length === 0) {
        console.log('   ✅ No "General" subcategories found');
        continue;
      }

      console.log(`   ⚠️  Found ${generalSubcategories.length} "General" subcategory(ies)`);

      // Strategy:
      // - If there's only ONE subcategory and it's "General", rename it to category name
      // - If there are MULTIPLE subcategories including "General", rename "General" to something specific

      for (const generalSub of generalSubcategories) {
        let newName: string;
        let newDescription: string;

        if (subcategories.length === 1) {
          // Only subcategory is "General" - use category name
          newName = `${category.name} Resources`;
          newDescription = generalSub.description || `General resources for ${category.name}`;
        } else {
          // Multiple subcategories - make "General" more specific
          newName = `${category.name} - General Information`;
          newDescription = generalSub.description || `General information and overview for ${category.name}`;
        }

        console.log(`   📝 Renaming "${generalSub.name}" to "${newName}"`);

        // Update the subcategory
        const { error: updateError } = await supabaseAdmin
          .from('subcategories')
          .update({
            name: newName,
            description: newDescription,
          })
          .eq('id', generalSub.id);

        if (updateError) {
          console.error(`   ❌ Error updating subcategory: ${updateError.message}`);
        } else {
          console.log(`   ✅ Successfully updated`);
        }
      }
    }

    console.log('\n\n✨ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - All "General" subcategories have been renamed to be more descriptive');
    console.log('   - Navigation should now show meaningful subcategory names');
    console.log('   - Users will see the actual category content structure\n');

  } catch (error) {
    console.error('❌ Error fixing subcategories:', error);
    process.exit(1);
  }
}

// Run the script
fixGeneralSubcategories();
