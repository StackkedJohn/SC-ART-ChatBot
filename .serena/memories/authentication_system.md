# Authentication System

## Implementation Summary
SC-ART ChatBot now has a complete authentication system with three role hierarchies:
- **Admin**: Full access + user management
- **Artist**: View/edit content, take quizzes, upload documents
- **Intern**: View content, take quizzes only

## Key Files

### Database
- `supabase/migrations/add_auth_and_roles.sql` - Complete migration with RLS
- `scripts/create-first-admin.sql` - Helper to create first admin user

### Authentication Core
- `lib/auth.ts` - All auth utilities and helpers
- `middleware.ts` - Route protection and session management
- `lib/supabase.ts` - Updated with UserProfile and UserRole types

### API Routes
- `/api/auth/login` - User authentication
- `/api/auth/logout` - Sign out
- `/api/auth/invite` - Create invitations (admin only)
- `/api/auth/signup` - Complete signup with token
- `/api/users` - User management (admin only)

### UI Pages
- `/login` - Login page
- `/signup?token=xxx` - Signup with invitation
- `/admin/users` - User management (admin only)

### Components
- `components/admin/user-management.tsx` - Full user admin interface
- `components/layout/navigation.tsx` - Updated with auth state

## Setup Steps
1. `npm install @supabase/auth-helpers-nextjs`
2. Run migration in Supabase SQL Editor
3. Create first admin with `scripts/create-first-admin.sql`
4. Login at `/login`
5. Invite users at `/admin/users`

## Role Permissions

### Database Level (RLS Policies)
- **Admin**: All tables (read/write/delete)
- **Artist**: Content items, document chunks (read/write)
- **Intern**: All content (read only), quiz attempts (create)

### Route Protection (Middleware)
- Public: `/`, `/login`, `/signup`
- Protected: `/browse`, `/content`, `/quizzes` (any authenticated)
- Admin-only: `/admin/*`

## Security Features
- Row Level Security at database layer
- Middleware route protection
- Password hashing (bcrypt)
- Invitation tokens expire in 7 days
- Session management via Supabase Auth
- Service role key server-side only

## Common Operations

### Create Invitation (Admin)
```typescript
const { invitation, token } = await createInvitation(
  'user@example.com',
  'artist',
  currentUser.id
);
// Share inviteUrl with user
```

### Check Current User
```typescript
const user = await getCurrentUser();
if (user?.role === 'admin') {
  // Admin operations
}
```

### Update User Role (Admin)
```typescript
await updateUserRole(userId, 'artist');
```

## Troubleshooting
- Migration fails: Check pgvector extension, backup data first
- Cannot login: Verify user is active, check RLS policies
- Admin nav not showing: Check role is exactly 'admin' (case-sensitive)
- Invitation link broken: Check expiration, verify token in URL

## Documentation
- `AUTH_SETUP.md` - Complete setup guide
- `AUTHENTICATION_IMPLEMENTATION.md` - Implementation details
