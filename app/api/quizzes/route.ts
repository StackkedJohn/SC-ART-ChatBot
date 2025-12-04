import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');

    let query = supabaseAdmin.from('quizzes').select('*').order('created_at', { ascending: false });

    if (published === 'true') {
      query = query.eq('is_published', true);
    }

    const { data: quizzes, error } = await query;

    if (error) throw error;

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, subcategory_id, time_limit_minutes, passing_score, is_published } = body;

    if (!title || typeof passing_score !== 'number') {
      return NextResponse.json({ error: 'Title and passing score are required' }, { status: 400 });
    }

    const { data: quiz, error } = await supabaseAdmin
      .from('quizzes')
      .insert({
        title,
        description: description || null,
        subcategory_id: subcategory_id || null,
        time_limit_minutes: time_limit_minutes || null,
        passing_score,
        is_published: is_published || false,
        total_attempts: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}
