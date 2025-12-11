'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Heart, Palette } from 'lucide-react';

interface WelcomeDialogProps {
  userName?: string;
  onComplete: () => void;
}

export function WelcomeDialog({ userName, onComplete }: WelcomeDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  const handleViewChecklist = async () => {
    // Mark welcome as seen
    await fetch('/api/user/welcome', {
      method: 'POST',
    });

    setIsOpen(false);
    onComplete();
    router.push('/onboarding');
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl p-0 gap-0 overflow-hidden border-4 border-brand-sc-pink"
        hideClose
      >
        {/* Header with Sunday Cool branding */}
        <div className="bg-gradient-to-br from-brand-sc-pink via-brand-barely-butter to-brand-cream-slush p-8 text-center">
          <div className="flex justify-center mb-4">
            <Sparkles className="w-12 h-12 text-white animate-pulse" />
          </div>
          <h1 className="text-4xl font-sans font-extrabold text-white mb-2">
            Welcome to the Fam{userName ? `, ${userName}` : ''}!
          </h1>
          <p className="text-white text-lg font-medium">
            You're officially part of the Sunday Cool Art Department
          </p>
        </div>

        {/* Content */}
        <div className="p-8 bg-white space-y-6">
          <div className="text-center space-y-4">
            <p className="text-lg text-gray-700">
              We're <span className="font-bold text-brand-sc-pink">stoked</span> to have you here!
              At Sunday Cool, it's about way more than T-shirts—it's about{' '}
              <span className="font-bold">creativity</span>, <span className="font-bold">second chances</span>,
              and <span className="font-bold">making something remarkable</span> together.
            </p>
          </div>

          {/* Core Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            <div className="text-center p-4 bg-brand-barely-butter/30 rounded-lg border-2 border-brand-sc-pink/20">
              <Heart className="w-8 h-8 mx-auto mb-2 text-brand-sc-pink" />
              <h3 className="font-bold text-sm text-brand-sc-pink mb-1">Serve Those Who Serve</h3>
              <p className="text-xs text-gray-600">We exist to make our customers look good</p>
            </div>
            <div className="text-center p-4 bg-brand-barely-butter/30 rounded-lg border-2 border-brand-sc-pink/20">
              <Palette className="w-8 h-8 mx-auto mb-2 text-brand-sc-pink" />
              <h3 className="font-bold text-sm text-brand-sc-pink mb-1">Creativity Matters</h3>
              <p className="text-xs text-gray-600">From napkin sketches to masterpieces</p>
            </div>
            <div className="text-center p-4 bg-brand-barely-butter/30 rounded-lg border-2 border-brand-sc-pink/20">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-brand-sc-pink" />
              <h3 className="font-bold text-sm text-brand-sc-pink mb-1">Have Fun</h3>
              <p className="text-xs text-gray-600">We don't take ourselves too seriously</p>
            </div>
          </div>

          <div className="bg-brand-cream-slush/30 border-l-4 border-brand-sc-pink p-4 rounded">
            <p className="text-sm text-gray-700 italic">
              <strong>Our Mission:</strong> Honor God, Love Our People, Serve those who serve
            </p>
          </div>

          <div className="text-center space-y-2">
            <p className="text-gray-700 font-medium">
              Ready to get started on your onboarding journey?
            </p>
            <p className="text-sm text-gray-500">
              We've put together a checklist to help you hit the ground running and get to know
              the Sunday Cool way. Let's do this!
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="bg-gradient-to-r from-brand-sc-pink to-brand-barely-butter p-6">
          <Button
            onClick={handleViewChecklist}
            size="lg"
            className="w-full bg-white text-brand-sc-pink hover:bg-gray-50 font-bold text-lg py-6 group"
          >
            View Onboarding Checklist
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
