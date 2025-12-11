'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export function WelcomeModal({ isOpen, onClose, userName }: WelcomeModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = async () => {
    setIsClosing(true);

    try {
      // Call API to mark welcome as seen
      await fetch('/api/user/mark-welcome-seen', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to mark welcome as seen:', error);
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          disabled={isClosing}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-brand-sc-pink">
            Welcome to Sunday Cool! 🎨
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <p className="text-lg">
              Hey {userName || 'there'}! Welcome to the SC-ART Knowledge Base for Sunday Cool's Art Department.
            </p>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-brand-sc-pink">About Sunday Cool</h3>
              <p>
                Sunday Cool is all about creating premium, super-soft tees with vibrant water-based prints.
                We're passionate about quality apparel and making every design pop with color and creativity.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-brand-sc-pink">Your Journey Starts Here</h3>
              <p>
                As an art department intern, you're joining a team that values creativity, attention to detail,
                and collaborative problem-solving. This knowledge base will be your go-to resource for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Learning our design standards and best practices</li>
                <li>Understanding our printing processes and techniques</li>
                <li>Getting answers to common questions</li>
                <li>Testing your knowledge with interactive quizzes</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-brand-sc-pink">Getting Started</h3>
              <p>
                Use the chat interface to ask questions about anything related to our art department.
                Browse through the knowledge base or take quizzes to test your understanding.
                We're excited to have you on the team!
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleClose}
              disabled={isClosing}
              className="bg-brand-sc-pink hover:bg-brand-sc-pink/90"
            >
              {isClosing ? 'Getting Started...' : "Let's Get Started!"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
