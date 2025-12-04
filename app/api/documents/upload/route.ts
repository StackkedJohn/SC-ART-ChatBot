import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ALLOWED_FILE_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown'];
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'md'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const subcategoryId = formData.get('subcategoryId') as string;
    const title = formData.get('title') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid MIME type. Please upload a valid PDF, DOCX, or MD file' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // Validate subcategory exists if provided
    if (subcategoryId) {
      const { data: subcategory, error: subcategoryError } = await supabaseAdmin
        .from('subcategories')
        .select('id')
        .eq('id', subcategoryId)
        .single();

      if (subcategoryError || !subcategory) {
        return NextResponse.json({ error: 'Invalid subcategory' }, { status: 400 });
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const uniqueFilename = `${timestamp}-${randomString}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(uniqueFilename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage.from('documents').getPublicUrl(uploadData.path);

    // Create document record
    const { data: document, error: documentError } = await supabaseAdmin
      .from('uploaded_documents')
      .insert({
        filename: file.name,
        file_type: fileExtension,
        file_url: urlData.publicUrl,
        status: 'pending',
        target_subcategory_id: subcategoryId || null,
        metadata: {
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          title: title || file.name.replace(/\.[^/.]+$/, ''),
        },
      })
      .select()
      .single();

    if (documentError) {
      console.error('Database insert error:', documentError);
      // Clean up uploaded file
      await supabaseAdmin.storage.from('documents').remove([uploadData.path]);
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        file_type: document.file_type,
        status: document.status,
        created_at: document.created_at,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data: documents, error } = await supabaseAdmin
      .from('uploaded_documents')
      .select('id, filename, file_type, status, target_subcategory_id, created_at, processed_at, error_message')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
