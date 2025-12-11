import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase';
import type { UserProfile, UserRole } from './supabase';

// Get current user profile (server-side)
export async function getCurrentUser(): Promise<UserProfile | null> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component cookie setting may fail
          }
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

// Check if user is admin (server-side)
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

// Check if user has specific role (server-side)
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

// Generate invitation token
export function generateInvitationToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

// Create user invitation (admin only)
export async function createInvitation(email: string, role: UserRole, invitedBy: string) {
  const token = generateInvitationToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  const { data, error } = await supabaseAdmin
    .from('user_invitations')
    .insert({
      email,
      role,
      invited_by: invitedBy,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return { invitation: data, token };
}

// Validate invitation token
export async function validateInvitationToken(token: string) {
  const { data: invitation, error } = await supabaseAdmin
    .from('user_invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .single();

  if (error || !invitation) {
    return null;
  }

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    return null;
  }

  return invitation;
}

// Accept invitation and create user
export async function acceptInvitation(token: string, password: string, fullName?: string) {
  const invitation = await validateInvitationToken(token);

  if (!invitation) {
    throw new Error('Invalid or expired invitation');
  }

  // Create user with Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName || invitation.email,
      role: invitation.role,
    },
  });

  if (authError) {
    throw authError;
  }

  // Mark invitation as accepted
  await supabaseAdmin
    .from('user_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token);

  return authData.user;
}

// Get user by ID
export async function getUserById(userId: string): Promise<UserProfile | null> {
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return profile;
}

// List all users (admin only)
export async function listUsers(): Promise<UserProfile[]> {
  const { data: profiles, error } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return profiles || [];
}

// Update user role (admin only)
export async function updateUserRole(userId: string, role: UserRole) {
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ role })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}

// Deactivate user (admin only)
export async function deactivateUser(userId: string) {
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ is_active: false })
    .eq('id', userId);

  if (error) {
    throw error;
  }

  // Also update Supabase Auth
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: 'none', // Can be changed to specific duration
    user_metadata: { is_active: false },
  });
}
