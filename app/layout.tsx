import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/layout/navigation';
import { Toaster } from '@/components/ui/toaster';
import { passionOne, notoSans, openSans } from './fonts';

export const metadata: Metadata = {
  title: 'SC-ART Knowledge Base',
  description: 'AI-powered knowledge base for employee onboarding and training',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${notoSans.variable} ${passionOne.variable} ${openSans.variable} font-sans`}>
        <Navigation />
        <main className="min-h-screen">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
