'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/supabase';

interface AuthNavProps {
  user: UserProfile | null;
}

export function AuthNav({ user }: AuthNavProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Logout failed');
      }

      toast({
        title: 'Success',
        description: 'Logged out successfully',
      });

      router.push('/login');
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <Button onClick={() => router.push('/login')} variant="outline">
        Sign In
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <p className="font-medium">{user.full_name || user.email}</p>
        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
      </div>
      <Button onClick={handleLogout} variant="outline" size="sm">
        Sign Out
      </Button>
    </div>
  );
}
