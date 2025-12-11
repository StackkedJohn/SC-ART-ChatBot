# Quick Start: Authentication System

Get your authentication system up and running in 5 minutes!

## ⚡ Fast Track Setup

### Step 1: Install Dependencies (30 seconds)
```bash
npm install
```

### Step 2: Run Database Migration (2 minutes)

1. Open Supabase Dashboard → SQL Editor
2. Copy ALL content from `supabase/migrations/add_auth_and_roles.sql`
3. Paste into SQL Editor
4. Click **RUN**
5. Wait for "Success" message

### Step 3: Create Your Admin Account (1 minute)

1. Open `scripts/create-first-admin.sql`
2. Change line 19: Replace `admin@scart.com` with your email
3. Change line 20: Replace `ChangeMe123!` with your password
4. Copy the modified SQL
5. Paste into Supabase SQL Editor
6. Click **RUN**

### Step 4: Test Login (1 minute)

```bash
npm run dev
```

1. Go to http://localhost:3000/login
2. Enter your admin email and password
3. Click **Sign In**

You should see:
- ✅ Navigation showing your email
- ✅ "Admin" link in navigation
- ✅ Redirected to home page

### Step 5: Invite Your First User (30 seconds)

1. Click **Admin** in navigation
2. Click **User Management** (or go to `/admin/users`)
3. Enter user email
4. Select role (Artist or Intern)
5. Click **Send Invitation**
6. Copy the invitation link
7. Send to user

## 🎯 You're Done!

Your authentication system is now live with:
- ✅ Secure login/logout
- ✅ Three role levels (Admin/Artist/Intern)
- ✅ Admin-managed user invitations
- ✅ Route protection
- ✅ Role-based permissions

## 🚀 What's Next?

### Test the System
1. **Logout**: Click "Sign Out" button
2. **Login**: Go to `/login` and sign back in
3. **Invite user**: Create invitation for test account
4. **Signup**: Open invitation link in incognito window
5. **Test permissions**: Login as different roles

### Production Checklist
- [ ] Change admin password from default
- [ ] Set up email service for invitations
- [ ] Configure custom domain
- [ ] Review RLS policies
- [ ] Test all role permissions
- [ ] Add password reset flow (optional)

## 📚 Need Help?

- **Full Setup Guide**: See `AUTH_SETUP.md`
- **Implementation Details**: See `AUTHENTICATION_IMPLEMENTATION.md`
- **Troubleshooting**: Check `AUTH_SETUP.md` troubleshooting section

## 🔐 Security Notes

- Invitation links expire in 7 days
- Passwords must be 8+ characters
- All data protected by Row Level Security (RLS)
- Admin-only user management
- Session-based authentication

## Role Capabilities Quick Reference

| Feature | Admin | Artist | Intern |
|---------|-------|--------|--------|
| View content | ✅ | ✅ | ✅ |
| Edit content | ✅ | ✅ | ❌ |
| Upload documents | ✅ | ✅ | ❌ |
| Take quizzes | ✅ | ✅ | ✅ |
| View quiz results | ✅ | Own | Own |
| User management | ✅ | ❌ | ❌ |
| Admin panel | ✅ | ❌ | ❌ |
