import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with service role (for admin operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Auth types
export type UserRole = 'admin' | 'artist' | 'intern';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  invited_by?: string;
  is_active: boolean;
  has_seen_welcome?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

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

export type QuizCategory = 'artist_standard' | 'intern_standard' | 'custom';

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
  quiz_category: QuizCategory;
  target_role?: string;
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
  user_id?: string;
  user_name: string;
  user_email?: string;
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, string>;
  time_taken_seconds?: number;
  xp_earned?: number;
  speed_bonus_percent?: number;
  perfect_streak_multiplier?: number;
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

// Onboarding types
export type OnboardingItemType =
  | 'profile_update'
  | 'handbook_review'
  | 'task_completion'
  | 'quiz'
  | 'manager_qa'
  | 'verification';

export type ChecklistItemStatus = 'pending' | 'in_progress' | 'completed';

export type QASessionStatus = 'not_scheduled' | 'scheduled' | 'completed' | 'cancelled';

export interface OnboardingChecklistItem {
  id: string;
  title: string;
  description: string;
  item_type: OnboardingItemType;
  display_order: number;
  is_required: boolean;
  archived: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface InternChecklistProgress {
  id: string;
  user_id: string;
  checklist_item_id: string;
  status: ChecklistItemStatus;
  started_at?: string;
  completed_at?: string;
  progress_data: Record<string, any>;
  requires_verification: boolean;
  verified: boolean;
  verified_by?: string;
  verified_at?: string;
  intern_notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InternProfileData {
  user_id: string;
  profile_picture_url?: string;
  bio?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  start_date?: string;
  onboarding_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ManagerQASession {
  id: string;
  intern_id: string;
  manager_id?: string;
  status: QASessionStatus;
  scheduled_at?: string;
  duration_minutes?: number;
  agenda?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface OnboardingProgress {
  total_items: number;
  required_items: number;
  completed_items: number;
  completed_required_items: number;
  completion_percentage: number;
  is_complete: boolean;
}

export interface ChecklistItemWithProgress extends OnboardingChecklistItem {
  progress?: InternChecklistProgress;
  quiz_passed?: boolean;
}
