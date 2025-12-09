'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, BookOpen, GraduationCap, Settings } from 'lucide-react';
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
    name: 'Admin',
    href: '/admin',
    icon: Settings,
  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-sc-pink/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-8 flex items-center space-x-2">
            <span className="font-sans font-extrabold text-2xl text-brand-sc-pink">SC-ART KB</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-semibold">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

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
        </div>
      </div>
    </header>
  );
}
