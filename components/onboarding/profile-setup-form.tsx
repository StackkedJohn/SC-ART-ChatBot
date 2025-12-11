'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ProfileSetupFormProps {
  userId: string;
  itemId: string;
}

export function ProfileSetupForm({ userId, itemId }: ProfileSetupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Update profile data
      await fetch('/api/onboarding/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...data }),
      });

      // Mark item as completed
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, checklistItemId: itemId }),
      });

      toast({
        title: 'Profile updated',
        description: 'Your profile has been completed successfully',
      });

      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          {...register('bio')}
          placeholder="Tell us about yourself"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" {...register('phone')} type="tel" placeholder="(555) 123-4567" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
        <Input
          id="emergency_contact_name"
          {...register('emergency_contact_name')}
          placeholder="Full name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
        <Input
          id="emergency_contact_phone"
          {...register('emergency_contact_phone')}
          type="tel"
          placeholder="(555) 123-4567"
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Complete Profile'}
      </Button>
    </form>
  );
}
