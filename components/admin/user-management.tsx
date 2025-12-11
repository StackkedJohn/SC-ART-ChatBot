'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, UserRole } from '@/lib/supabase';

interface UserManagementProps {
  users: UserProfile[];
}

export function UserManagement({ users: initialUsers }: UserManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('intern');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setInviteUrl('');

    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
      });

      setInviteUrl(data.inviteUrl);
      setInviteEmail('');
      setInviteRole('intern');

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, deactivate: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to deactivate user');
      }

      toast({
        title: 'Success',
        description: 'User deactivated successfully',
      });

      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: false } : u));
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'artist':
        return 'default';
      case 'intern':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      {/* Invite New User */}
      <Card>
        <CardHeader>
          <CardTitle>Invite New User</CardTitle>
          <CardDescription>
            Send an invitation email to grant access to the knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  disabled={isInviting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(value) => setInviteRole(value as UserRole)}
                  disabled={isInviting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intern">Intern</SelectItem>
                    <SelectItem value="artist">Artist</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={isInviting}>
              {isInviting ? 'Sending Invitation...' : 'Send Invitation'}
            </Button>
          </form>

          {inviteUrl && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Invitation Link (expires in 7 days):</p>
              <code className="text-xs bg-white p-2 rounded block break-all">
                {inviteUrl}
              </code>
              <p className="text-xs text-gray-500 mt-2">
                Share this link with the user to complete registration.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Users ({users.length})</CardTitle>
          <CardDescription>
            Manage user roles and access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{user.full_name || user.email}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                    {!user.is_active && (
                      <Badge variant="outline">Deactivated</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                    disabled={!user.is_active}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intern">Intern</SelectItem>
                      <SelectItem value="artist">Artist</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {user.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivate(user.id)}
                    >
                      Deactivate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
