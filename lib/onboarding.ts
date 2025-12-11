import { supabaseAdmin } from './supabase';
import type {
  OnboardingChecklistItem,
  InternChecklistProgress,
  OnboardingProgress,
  ChecklistItemWithProgress,
  InternProfileData,
  ManagerQASession,
} from './supabase';

/**
 * Get all active checklist template items for admins
 */
export async function getChecklistTemplates(): Promise<OnboardingChecklistItem[]> {
  const { data, error } = await supabaseAdmin
    .from('onboarding_checklist_items')
    .select('*')
    .eq('archived', false)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get a specific checklist item by ID
 */
export async function getChecklistItem(
  itemId: string
): Promise<OnboardingChecklistItem | null> {
  const { data, error } = await supabaseAdmin
    .from('onboarding_checklist_items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Get onboarding progress for a specific intern
 */
export async function getInternOnboardingProgress(
  userId: string
): Promise<{
  items: ChecklistItemWithProgress[];
  stats: OnboardingProgress;
}> {
  // Get checklist items with progress using the view
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('intern_checklist_detail')
    .select('*')
    .eq('user_id', userId)
    .order('display_order', { ascending: true });

  if (itemsError) throw itemsError;

  // Get progress statistics using the database function
  const { data: stats, error: statsError } = await supabaseAdmin.rpc(
    'calculate_onboarding_progress',
    { intern_user_id: userId }
  );

  if (statsError) throw statsError;

  return {
    items: items || [],
    stats: stats?.[0] || {
      total_items: 0,
      required_items: 0,
      completed_items: 0,
      completed_required_items: 0,
      completion_percentage: 0,
      is_complete: false,
    },
  };
}

/**
 * Initialize onboarding checklist for a new intern
 */
export async function initializeInternOnboarding(userId: string): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc('initialize_intern_checklist', {
    p_user_id: userId,
  });

  if (error) throw error;
  return data || 0;
}

/**
 * Update progress for a specific checklist item
 */
export async function updateChecklistItemProgress(
  userId: string,
  checklistItemId: string,
  updates: {
    status?: 'pending' | 'in_progress' | 'completed';
    progress_data?: Record<string, any>;
    intern_notes?: string;
  }
): Promise<InternChecklistProgress> {
  const { data, error } = await supabaseAdmin
    .from('intern_checklist_progress')
    .update(updates)
    .eq('user_id', userId)
    .eq('checklist_item_id', checklistItemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark a checklist item as completed
 */
export async function completeChecklistItem(
  userId: string,
  checklistItemId: string,
  progressData?: Record<string, any>
): Promise<InternChecklistProgress> {
  return updateChecklistItemProgress(userId, checklistItemId, {
    status: 'completed',
    progress_data: progressData,
  });
}

/**
 * Verify a checklist item (admin only)
 */
export async function verifyChecklistItem(
  userId: string,
  checklistItemId: string,
  verifiedBy: string,
  adminNotes?: string
): Promise<InternChecklistProgress> {
  const { data, error } = await supabaseAdmin
    .from('intern_checklist_progress')
    .update({
      verified: true,
      verified_by: verifiedBy,
      admin_notes: adminNotes,
    })
    .eq('user_id', userId)
    .eq('checklist_item_id', checklistItemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get or create intern profile data
 */
export async function getInternProfileData(userId: string): Promise<InternProfileData> {
  let { data, error } = await supabaseAdmin
    .from('intern_profile_data')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error?.code === 'PGRST116') {
    // No profile data exists, create it
    const { data: newData, error: createError } = await supabaseAdmin
      .from('intern_profile_data')
      .insert({ user_id: userId, start_date: new Date().toISOString().split('T')[0] })
      .select()
      .single();

    if (createError) throw createError;
    return newData;
  }

  if (error) throw error;
  return data;
}

/**
 * Update intern profile data
 */
export async function updateInternProfileData(
  userId: string,
  updates: Partial<InternProfileData>
): Promise<InternProfileData> {
  const { data, error } = await supabaseAdmin
    .from('intern_profile_data')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get manager Q&A session for intern
 */
export async function getManagerQASession(internId: string): Promise<ManagerQASession> {
  let { data, error } = await supabaseAdmin
    .from('manager_qa_sessions')
    .select('*')
    .eq('intern_id', internId)
    .single();

  if (error?.code === 'PGRST116') {
    // No session exists, create it
    const { data: newData, error: createError } = await supabaseAdmin
      .from('manager_qa_sessions')
      .insert({ intern_id: internId, status: 'not_scheduled' })
      .select()
      .single();

    if (createError) throw createError;
    return newData;
  }

  if (error) throw error;
  return data;
}

/**
 * Update manager Q&A session
 */
export async function updateManagerQASession(
  sessionId: string,
  updates: Partial<ManagerQASession>
): Promise<ManagerQASession> {
  const { data, error } = await supabaseAdmin
    .from('manager_qa_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Check if onboarding is complete
 */
export async function checkOnboardingComplete(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('calculate_onboarding_progress', {
    intern_user_id: userId,
  });

  if (error) throw error;
  return data?.[0]?.is_complete || false;
}

/**
 * Create a new checklist template item (admin only)
 */
export async function createChecklistItem(
  item: Omit<OnboardingChecklistItem, 'id' | 'created_at' | 'updated_at' | 'archived'>
): Promise<OnboardingChecklistItem> {
  const { data, error } = await supabaseAdmin
    .from('onboarding_checklist_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update checklist template item (admin only)
 */
export async function updateChecklistItem(
  itemId: string,
  updates: Partial<OnboardingChecklistItem>
): Promise<OnboardingChecklistItem> {
  const { data, error } = await supabaseAdmin
    .from('onboarding_checklist_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Archive (soft delete) a checklist item (admin only)
 */
export async function archiveChecklistItem(itemId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('onboarding_checklist_items')
    .update({ archived: true })
    .eq('id', itemId);

  if (error) throw error;
}

/**
 * Reorder checklist items (admin only)
 */
export async function reorderChecklistItems(
  items: Array<{ id: string; display_order: number }>
): Promise<void> {
  const updates = items.map((item) =>
    supabaseAdmin
      .from('onboarding_checklist_items')
      .update({ display_order: item.display_order })
      .eq('id', item.id)
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    throw errors[0].error;
  }
}

/**
 * Get all interns with their onboarding progress (admin view)
 */
export async function getAllInternsOnboardingProgress(): Promise<
  Array<{
    user_id: string;
    email: string;
    full_name: string;
    start_date?: string;
    onboarding_completed_at?: string;
    progress: OnboardingProgress;
    qa_status?: string;
    qa_scheduled_at?: string;
  }>
> {
  const { data, error } = await supabaseAdmin
    .from('intern_onboarding_overview')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
