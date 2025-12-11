'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, BookOpen, GraduationCap, Trophy, Settings, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    name: 'Chat',
    href: '/',
    icon: MessageSquare,
  },
  {
    name: 'Browse',
    href: '/browse',
    icon: BookOpen,
  },
  {
    name: 'Quizzes',
    href: '/quizzes',
    icon: GraduationCap,
  },
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Trophy,
  },
  {
    name: 'Onboarding',
    href: '/onboarding',
    icon: ClipboardList,
    internOnly: true,
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: Settings,
  },
];

interface NavigationProps {
  userEmail?: string | null;
  userRole?: string | null;
}

export function Navigation({ userEmail, userRole }: NavigationProps) {
  const pathname = usePathname();
  const isAuthenticated = !!userEmail;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-sc-pink/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="mr-4 flex">
          <Link href="/" className="mr-8 flex items-center space-x-2">
            <span className="font-sans font-extrabold text-2xl text-brand-sc-pink">SC-ART KB</span>
          </Link>
          {/* Only show navigation items when authenticated */}
          {isAuthenticated && (
            <nav className="flex items-center space-x-6 text-sm font-semibold">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                // Hide admin nav for non-admins
                if (item.href === '/admin' && userRole !== 'admin') {
                  return null;
                }

                // Hide onboarding nav for non-interns
                if (item.href === '/onboarding' && userRole !== 'intern') {
                  return null;
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 transition-colors hover:text-brand-sc-pink px-3 py-2 rounded-md',
                      isActive
                        ? 'text-brand-sc-pink bg-brand-sc-pink/10'
                        : 'text-foreground/70 hover:bg-brand-barely-butter'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
        {/* Only show user info/sign out when authenticated */}
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <p className="font-medium">{userEmail}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50">
                Sign Out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
