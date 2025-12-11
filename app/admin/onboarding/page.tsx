import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getChecklistTemplates } from '@/lib/onboarding';
import { Button } from '@/components/ui/button';
import { ChecklistManager } from '@/components/admin/onboarding/checklist-manager';
import { Plus, Info } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default async function AdminOnboardingPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  const templates = await getChecklistTemplates();

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Onboarding Checklist Management</h1>
          <p className="text-muted-foreground">
            Configure the onboarding experience for new interns ({templates.length} items)
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/onboarding/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Link>
        </Button>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Drag items</strong> to reorder the checklist.{' '}
          <strong>Click the eye icon</strong> to activate/deactivate items.{' '}
          <strong>Edit</strong> to configure item details including quiz selection.
        </AlertDescription>
      </Alert>

      {templates.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            No checklist items yet. Create your first item to get started.
          </p>
          <Button asChild>
            <Link href="/admin/onboarding/new">
              <Plus className="w-4 h-4 mr-2" />
              Create First Item
            </Link>
          </Button>
        </div>
      ) : (
        <ChecklistManager initialItems={templates} />
      )}
    </div>
  );
}
