import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ChecklistItemForm } from '@/components/admin/onboarding/checklist-item-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function NewChecklistItemPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/onboarding">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Checklist
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-2">Create Checklist Item</h1>
        <p className="text-muted-foreground">
          Add a new item to the intern onboarding checklist
        </p>
      </div>

      <ChecklistItemForm mode="create" />
    </div>
  );
}
