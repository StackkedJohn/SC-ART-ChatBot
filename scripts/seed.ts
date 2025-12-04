import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { supabaseAdmin } from '../lib/supabase';
import { generateContentEmbeddings } from '../lib/embeddings';

async function seed() {
  console.log('🌱 Starting seed process...');

  try {
    // 1. Create Categories
    console.log('\n📁 Creating categories...');
    const categories = [
      {
        name: 'Discharge Printing',
        icon: '🎨',
        description: 'Everything about discharge printing techniques',
        sort_order: 1,
      },
      {
        name: 'Templates',
        icon: '📐',
        description: 'Template creation and standards',
        sort_order: 2,
      },
      {
        name: 'Job Descriptions',
        icon: '👤',
        description: 'Role responsibilities and expectations',
        sort_order: 3,
      },
      {
        name: 'Onboarding',
        icon: '🚀',
        description: 'New employee training materials',
        sort_order: 4,
      },
      {
        name: 'SOPs',
        icon: '📋',
        description: 'Standard Operating Procedures',
        sort_order: 5,
      },
    ];

    const { data: createdCategories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .insert(categories)
      .select();

    if (categoriesError) throw categoriesError;
    console.log(`✅ Created ${createdCategories.length} categories`);

    // 2. Create Subcategories
    console.log('\n📂 Creating subcategories...');
    const dischargePrintingId = createdCategories.find((c) => c.name === 'Discharge Printing')?.id;
    const templatesId = createdCategories.find((c) => c.name === 'Templates')?.id;
    const jobDescriptionsId = createdCategories.find((c) => c.name === 'Job Descriptions')?.id;
    const onboardingId = createdCategories.find((c) => c.name === 'Onboarding')?.id;
    const sopsId = createdCategories.find((c) => c.name === 'SOPs')?.id;

    const subcategories = [
      // Discharge Printing
      {
        category_id: dischargePrintingId,
        name: 'Heather Materials',
        description: 'Working with heather fabrics',
        sort_order: 1,
      },
      {
        category_id: dischargePrintingId,
        name: 'Tri-Blends',
        description: 'Tri-blend material specifications',
        sort_order: 2,
      },
      {
        category_id: dischargePrintingId,
        name: 'Color Matching',
        description: 'Achieving accurate colors',
        sort_order: 3,
      },
      // Templates
      {
        category_id: templatesId,
        name: 'Building Templates',
        description: 'How to create templates',
        sort_order: 1,
      },
      {
        category_id: templatesId,
        name: 'Template Library',
        description: 'Available templates',
        sort_order: 2,
      },
      // Job Descriptions
      {
        category_id: jobDescriptionsId,
        name: 'Intern',
        description: 'Internship role details',
        sort_order: 1,
      },
      {
        category_id: jobDescriptionsId,
        name: 'Staff Artist',
        description: 'Staff Artist role details',
        sort_order: 2,
      },
      {
        category_id: jobDescriptionsId,
        name: 'Junior Designer',
        description: 'Junior Designer role details',
        sort_order: 3,
      },
      {
        category_id: jobDescriptionsId,
        name: 'Senior Designer',
        description: 'Senior Designer role details',
        sort_order: 4,
      },
      // Onboarding
      {
        category_id: onboardingId,
        name: 'Week 1',
        description: 'First week activities',
        sort_order: 1,
      },
      {
        category_id: onboardingId,
        name: 'Training Modules',
        description: 'Core training content',
        sort_order: 2,
      },
      // SOPs
      {
        category_id: sopsId,
        name: 'Art Request Forms',
        description: 'ARF guidelines',
        sort_order: 1,
      },
      {
        category_id: sopsId,
        name: 'Quality Control',
        description: 'QC processes',
        sort_order: 2,
      },
    ];

    const { data: createdSubcategories, error: subcategoriesError } = await supabaseAdmin
      .from('subcategories')
      .insert(subcategories)
      .select();

    if (subcategoriesError) throw subcategoriesError;
    console.log(`✅ Created ${createdSubcategories.length} subcategories`);

    // 3. Create Content Items
    console.log('\n📄 Creating content items...');
    const heatherMaterialsId = createdSubcategories.find(
      (s) => s.name === 'Heather Materials'
    )?.id;

    const contentItems = [
      {
        subcategory_id: heatherMaterialsId,
        title: 'Discharge Rates for Heather Royal',
        content: `# Discharge Rates for Heather Royal

## Overview
Heather Royal is one of our most common materials. Proper discharge rates are critical for quality output.

## Recommended Settings
- **Discharge Rate:** 85-90%
- **Mesh Count:** 110
- **Squeegee Pressure:** Medium
- **Flash Time:** 3-4 seconds

## Common Issues

### 1. Underdischarge
Results in dull colors. To fix:
- Increase discharge rate by 5%
- Extend flash time by 0.5-1 second
- Check squeegee pressure

### 2. Overdischarge
Can damage fabric. To fix:
- Reduce discharge rate by 5%
- Shorten flash time
- Verify mesh count is correct

### 3. Uneven Discharge
Check these factors:
- Squeegee angle (should be 45 degrees)
- Pressure consistency across stroke
- Screen tension
- Environmental humidity

## Pro Tips
- Always test on scrap fabric first
- Heather materials require slightly higher discharge rates than solid colors
- Environmental humidity affects results - adjust accordingly
- Keep detailed notes of settings that work
- Consistency is key - measure everything

## Troubleshooting Guide

**Problem:** Color too light
- **Solution:** Increase discharge rate or flash time

**Problem:** Fabric pilling
- **Solution:** Reduce discharge rate

**Problem:** Inconsistent results
- **Solution:** Check environmental conditions (temperature and humidity)

## Safety Notes
- Always wear protective equipment
- Ensure proper ventilation
- Follow chemical handling guidelines
- Dispose of materials according to regulations`,
        sort_order: 1,
      },
    ];

    const { data: createdContentItems, error: contentError } = await supabaseAdmin
      .from('content_items')
      .insert(contentItems)
      .select();

    if (contentError) throw contentError;
    console.log(`✅ Created ${createdContentItems.length} content items`);

    // 4. Generate Embeddings
    console.log('\n🔢 Generating embeddings for content...');
    for (const item of createdContentItems) {
      console.log(`  Processing: ${item.title}`);
      const chunksCreated = await generateContentEmbeddings(item.id);
      console.log(`  ✅ Created ${chunksCreated} chunks with embeddings`);
    }

    // 5. Create Sample Quiz
    console.log('\n📝 Creating sample quiz...');
    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        title: 'Discharge Printing Basics',
        description: 'Test your knowledge of discharge printing techniques',
        subcategory_id: heatherMaterialsId,
        time_limit_minutes: 10,
        passing_score: 70,
        is_published: true,
      })
      .select()
      .single();

    if (quizError) throw quizError;
    console.log(`✅ Created quiz: ${quiz.title}`);

    const questions = [
      {
        quiz_id: quiz.id,
        question_text: 'What is the recommended discharge rate for Heather Royal?',
        question_type: 'multiple_choice',
        correct_answer: '85-90%',
        options: ['75-80%', '85-90%', '90-95%', '95-100%'],
        explanation:
          'The recommended discharge rate for Heather Royal is 85-90% for optimal results.',
        points: 1,
        sort_order: 1,
      },
      {
        quiz_id: quiz.id,
        question_text: 'What mesh count should be used for Heather Royal discharge printing?',
        question_type: 'multiple_choice',
        correct_answer: '110',
        options: ['85', '110', '156', '200'],
        explanation: 'A 110 mesh count is recommended for Heather Royal discharge printing.',
        points: 1,
        sort_order: 2,
      },
      {
        quiz_id: quiz.id,
        question_text: 'Heather materials require higher discharge rates than solid colors.',
        question_type: 'true_false',
        correct_answer: 'true',
        explanation:
          'True. Heather materials require slightly higher discharge rates compared to solid colors.',
        points: 1,
        sort_order: 3,
      },
      {
        quiz_id: quiz.id,
        question_text: 'What should you always do before discharge printing on production runs?',
        question_type: 'short_answer',
        correct_answer: 'test on scrap fabric',
        explanation:
          'Always test on scrap fabric first to ensure settings are correct before production runs.',
        points: 1,
        sort_order: 4,
      },
    ];

    const { error: questionsError } = await supabaseAdmin
      .from('quiz_questions')
      .insert(questions);

    if (questionsError) throw questionsError;
    console.log(`✅ Created ${questions.length} quiz questions`);

    console.log('\n✨ Seed process completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - ${createdCategories.length} categories`);
    console.log(`  - ${createdSubcategories.length} subcategories`);
    console.log(`  - ${createdContentItems.length} content items`);
    console.log(`  - 1 quiz with ${questions.length} questions`);
    console.log('\n🎉 Your knowledge base is ready to use!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
