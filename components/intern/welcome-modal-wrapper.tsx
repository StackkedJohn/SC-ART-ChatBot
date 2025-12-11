'use client';

import { useState } from 'react';
import { WelcomeModal } from './welcome-modal';
import type { UserProfile } from '@/lib/supabase';

interface WelcomeModalWrapperProps {
  user: UserProfile | null;
}

export function WelcomeModalWrapper({ user }: WelcomeModalWrapperProps) {
  const [showWelcome, setShowWelcome] = useState(() => {
    // Only show welcome for interns who haven't seen it
    return user?.role === 'intern' && !user?.has_seen_welcome;
  });

  const userName = user?.full_name || user?.email.split('@')[0];

  if (!showWelcome) {
    return null;
  }

  return (
    <WelcomeModal
      isOpen={showWelcome}
      onClose={() => setShowWelcome(false)}
      userName={userName}
    />
  );
}
