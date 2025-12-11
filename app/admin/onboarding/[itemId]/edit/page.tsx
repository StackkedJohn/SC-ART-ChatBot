import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getChecklistItem } from '@/lib/onboarding';
import { ChecklistItemForm } from '@/components/admin/onboarding/checklist-item-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EditChecklistItemPageProps {
  params: {
    itemId: string;
  };
}

export default async function EditChecklistItemPage({ params }: EditChecklistItemPageProps) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  const item = await getChecklistItem(params.itemId);

  if (!item) {
    notFound();
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

        <h1 className="text-3xl font-bold mb-2">Edit Checklist Item</h1>
        <p className="text-muted-foreground">
          Modify the onboarding checklist item configuration
        </p>
      </div>

      <ChecklistItemForm mode="edit" item={item} />
    </div>
  );
}
