import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with service role (for admin operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Database types
export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  subcategory_id: string;
  title: string;
  content: string;
  is_active: boolean;
  last_embedded_at?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  content_item_id: string;
  chunk_text: string;
  chunk_index: number;
  embedding?: number[];
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  subcategory_id?: string;
  time_limit_minutes?: number;
  passing_score: number;
  is_published: boolean;
  total_attempts: number;
  average_score?: number;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  correct_answer: string;
  options?: string[];
  explanation?: string;
  points: number;
  sort_order: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_name: string;
  user_email?: string;
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, string>;
  time_taken_seconds?: number;
  started_at: string;
  completed_at: string;
}

export interface UploadedDocument {
  id: string;
  filename: string;
  file_type: string;
  file_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  target_subcategory_id?: string;
  error_message?: string;
  created_at: string;
  processed_at?: string;
}
