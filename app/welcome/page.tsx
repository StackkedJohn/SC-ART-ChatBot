'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WelcomeDialog } from '@/components/intern/welcome-dialog';

export default function WelcomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user info
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(data => {
        setUserName(data.full_name || data.email?.split('@')[0]);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch user profile:', err);
        setLoading(false);
      });
  }, []);

  const handleComplete = () => {
    // Dialog component handles API call and navigation
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-sc-pink/10 via-brand-barely-butter/10 to-brand-cream-slush/10">
        <div className="animate-pulse text-brand-sc-pink text-xl font-bold">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-sc-pink/10 via-brand-barely-butter/10 to-brand-cream-slush/10">
      <WelcomeDialog userName={userName} onComplete={handleComplete} />
    </div>
  );
}
