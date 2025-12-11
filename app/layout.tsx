import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/layout/navigation';
import { Toaster } from '@/components/ui/toaster';
import { passionOne, notoSans, openSans } from './fonts';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'SC-ART Knowledge Base',
  description: 'AI-powered knowledge base for employee onboarding and training',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className={`${notoSans.variable} ${passionOne.variable} ${openSans.variable} font-sans`}>
        <Navigation userEmail={user?.email} userRole={user?.role} />
        <main className="min-h-screen">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
