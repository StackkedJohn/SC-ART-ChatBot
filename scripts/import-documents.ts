import { config } from 'dotenv';
import { resolve } from 'path';
import { readdir, readFile } from 'fs/promises';
import { join, basename, extname } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

import { supabaseAdmin } from '../lib/supabase';
import { parsePDF, parseDOCX, parseMarkdown } from '../lib/document-parser';
import { generateContentEmbeddings } from '../lib/embeddings';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

async function clearDatabase() {
  console.log('🗑️  Clearing existing database content...');

  // Delete in correct order due to foreign key constraints
  await supabaseAdmin.from('document_chunks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('quiz_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('quiz_questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('quizzes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('uploaded_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('content_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('subcategories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('✅ Database cleared');
}

async function createCategories(): Promise<Map<string, Category>> {
  console.log('\n📁 Creating categories...');

  const categoryMap = new Map<string, Category>();

  const categories = [
    { name: 'Policies & Procedures', icon: '📋', sort_order: 1 },
    { name: 'Job Descriptions', icon: '👤', sort_order: 2 },
    { name: 'Consults', icon: '💬', sort_order: 3 },
  ];

  for (const cat of categories) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert(cat)
      .select()
      .single();

    if (error) throw error;
    categoryMap.set(cat.name, data);
    console.log(`  ✅ ${cat.icon} ${cat.name}`);
  }

  return categoryMap;
}

async function createSubcategories(categoryMap: Map<string, Category>): Promise<Map<string, Subcategory>> {
  console.log('\n📂 Creating subcategories...');

  const subcategoryMap = new Map<string, Subcategory>();

  // Each category gets a "General" subcategory for now
  for (const [catName, category] of categoryMap) {
    const { data, error } = await supabaseAdmin
      .from('subcategories')
      .insert({
        category_id: category.id,
        name: 'General',
        description: `General ${catName} documents`,
        sort_order: 1,
      })
      .select()
      .single();

    if (error) throw error;
    subcategoryMap.set(catName, data);
    console.log(`  ✅ ${catName} > General`);
  }

  return subcategoryMap;
}

async function processDocument(
  filePath: string,
  fileName: string,
  subcategoryId: string
): Promise<string | null> {
  try {
    const ext = extname(fileName).toLowerCase();
    const title = basename(fileName, ext);

    console.log(`\n📄 Processing: ${fileName}`);

    // Read file
    const buffer = await readFile(filePath);

    // Parse based on file type
    let content: string;

    if (ext === '.pdf') {
      content = await parsePDF(buffer);
    } else if (ext === '.docx') {
      content = await parseDOCX(buffer);
    } else if (ext === '.md') {
      const text = buffer.toString('utf-8');
      const parsed = parseMarkdown(text);
      content = parsed.content;
    } else {
      console.log(`  ⚠️  Skipping unsupported file type: ${ext}`);
      return null;
    }

    // Clean up content
    content = content
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!content || content.length < 50) {
      console.log(`  ⚠️  Content too short or empty, skipping`);
      return null;
    }

    console.log(`  📊 Extracted ${content.length} characters`);

    // Create content item
    const { data: contentItem, error } = await supabaseAdmin
      .from('content_items')
      .insert({
        subcategory_id: subcategoryId,
        title,
        content,
        is_active: true,
        sort_order: 0,
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`  ✅ Created content item: ${contentItem.id}`);

    // Generate embeddings
    console.log(`  🔢 Generating embeddings...`);
    const chunkCount = await generateContentEmbeddings(contentItem.id);
    console.log(`  ✅ Created ${chunkCount} chunks with embeddings`);

    return contentItem.id;
  } catch (error) {
    console.error(`  ❌ Error processing ${fileName}:`, error);
    return null;
  }
}

async function importDocuments() {
  const documentsPath = '/Users/austinwarren/SC-ART-ChatBot/documents';

  try {
    console.log('🚀 Starting document import...\n');
    console.log('=' .repeat(50));

    // Step 1: Clear database
    await clearDatabase();

    // Step 2: Create categories
    const categoryMap = await createCategories();

    // Step 3: Create subcategories
    const subcategoryMap = await createSubcategories(categoryMap);

    // Step 4: Process documents
    console.log('\n📚 Processing documents...');
    console.log('=' .repeat(50));

    const folders = [
      { path: '1. Policies & Procedures', category: 'Policies & Procedures' },
      { path: '2. Job Descriptions', category: 'Job Descriptions' },
      { path: '3. Consults', category: 'Consults' },
    ];

    let totalProcessed = 0;
    let totalSkipped = 0;

    for (const folder of folders) {
      const folderPath = join(documentsPath, folder.path);
      const subcategory = subcategoryMap.get(folder.category);

      if (!subcategory) {
        console.log(`⚠️  No subcategory found for ${folder.category}`);
        continue;
      }

      console.log(`\n📁 ${folder.category}`);
      console.log('-'.repeat(50));

      const files = await readdir(folderPath);
      const supportedFiles = files.filter(f =>
        f.endsWith('.pdf') || f.endsWith('.docx') || f.endsWith('.md')
      );

      console.log(`Found ${supportedFiles.length} supported files (${files.length} total)`);

      if (files.length > supportedFiles.length) {
        const unsupported = files.filter(f =>
          !f.endsWith('.pdf') && !f.endsWith('.docx') && !f.endsWith('.md')
        );
        console.log(`⚠️  Skipping ${unsupported.length} unsupported files: ${unsupported.join(', ')}`);
      }

      for (const file of supportedFiles) {
        const filePath = join(folderPath, file);
        const result = await processDocument(filePath, file, subcategory.id);

        if (result) {
          totalProcessed++;
        } else {
          totalSkipped++;
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully processed: ${totalProcessed} documents`);
    console.log(`⚠️  Skipped: ${totalSkipped} documents`);
    console.log(`📁 Categories created: ${categoryMap.size}`);
    console.log(`📂 Subcategories created: ${subcategoryMap.size}`);
    console.log('\n🎉 Import complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Visit http://localhost:3002/browse to see your content');
    console.log('   2. Try the chat at http://localhost:3002');
    console.log('   3. Create quizzes from your content in /admin/quizzes');

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Run import
importDocuments();
