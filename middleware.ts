import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateInvitationToken } from '@/lib/auth';

// Public routes that DON'T require authentication
const publicRoutes = ['/login'];

// Routes only accessible to admins
const adminRoutes = ['/admin'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get user (validates session, more secure than getSession)
  const { data: { user } } = await supabase.auth.getUser();
  const session = user ? { user } : null;

  const { pathname } = req.nextUrl;

  // Check route types
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isAuthApiRoute = pathname.startsWith('/api/auth');
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isSignupRoute = pathname === '/signup';

  // Allow auth API routes without authentication
  if (isAuthApiRoute) {
    return res;
  }

  // Special handling for signup page - only allow with valid invitation token
  if (isSignupRoute && !session) {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      // No token provided, redirect to login
      const redirectUrl = new URL('/login', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Validate the invitation token
    const invitation = await validateInvitationToken(token);

    if (!invitation) {
      // Invalid or expired token, redirect to login
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('error', 'invalid_invitation');
      return NextResponse.redirect(redirectUrl);
    }

    // Valid token, allow access to signup page
    return res;
  }

  // Redirect to login if not authenticated and not on a public route
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Get user profile once if we have a session
  let userProfile = null;
  if (session) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, has_seen_welcome')
      .eq('id', session.user.id)
      .single();
    userProfile = profile;
  }

  // Redirect to appropriate page if accessing login while authenticated
  if (isPublicRoute && session && userProfile) {
    if (userProfile.role === 'intern') {
      // First check if they've seen welcome
      if (!userProfile.has_seen_welcome) {
        return NextResponse.redirect(new URL('/welcome', req.url));
      }

      // Then check onboarding completion
      const { data: progressData } = await supabase
        .rpc('calculate_onboarding_progress', { intern_user_id: session.user.id });
      const isComplete = progressData?.[0]?.is_complete || false;

      if (!isComplete) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
    }

    return NextResponse.redirect(new URL('/', req.url));
  }

  // Check admin access for admin routes
  if (isAdminRoute && session && userProfile) {
    if (userProfile.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Redirect interns through welcome -> onboarding flow
  if (session && userProfile && !pathname.startsWith('/welcome') && !pathname.startsWith('/onboarding') && !isAdminRoute && !pathname.startsWith('/api')) {
    if (userProfile.role === 'intern') {
      // First check if they've seen welcome
      if (!userProfile.has_seen_welcome) {
        return NextResponse.redirect(new URL('/welcome', req.url));
      }

      // Then check onboarding completion
      const { data: progressData } = await supabase
        .rpc('calculate_onboarding_progress', { intern_user_id: session.user.id });

      const isComplete = progressData?.[0]?.is_complete || false;

      // Redirect to onboarding if not complete and not already there
      if (!isComplete) {
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
