import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getInternOnboardingProgress } from '@/lib/onboarding';
import { OnboardingLayout } from '@/components/onboarding/onboarding-layout';
import { ChecklistProgress } from '@/components/onboarding/checklist-progress';
import { ChecklistItemCard } from '@/components/onboarding/checklist-item-card';
import { ProfileSetupForm } from '@/components/onboarding/profile-setup-form';
import { HandbookReview } from '@/components/onboarding/handbook-review';
import { TaskList } from '@/components/onboarding/task-list';
import { QuizAssignment } from '@/components/onboarding/quiz-assignment';
import { QAScheduler } from '@/components/onboarding/qa-scheduler';

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  // Middleware handles authentication, so if we reach here user exists
  // Only check if user is actually an intern (non-interns shouldn't access this)
  if (!user || user.role !== 'intern') {
    redirect('/');
  }

  const { items, stats } = await getInternOnboardingProgress(user.id);

  // Redirect to home if onboarding complete
  if (stats.is_complete) {
    redirect('/');
  }

  // Format data for layout component
  const progressData = {
    percentage: stats.completion_percentage,
    items: items.map((item) => ({
      id: item.checklist_item_id, // Use checklist_item_id from the view
      title: item.title,
      type: item.item_type,
      status: item.progress?.status || 'pending',
      order: item.display_order,
    })),
  };

  const renderContent = (item: any) => {
    const progress = item.progress;
    if (!progress) return null;

    switch (item.item_type) {
      case 'profile_update':
        return <ProfileSetupForm userId={user.id} itemId={item.checklist_item_id} />;
      case 'handbook_review':
        return <HandbookReview itemId={item.checklist_item_id} userId={user.id} />;
      case 'task_completion':
        return (
          <TaskList
            itemId={item.checklist_item_id}
            userId={user.id}
            tasks={item.config?.tasks || []}
            initialCompletedTasks={progress.progress_data?.completed_tasks}
          />
        );
      case 'quiz':
        return (
          <QuizAssignment
            quizId={item.config?.quiz_id}
            itemId={item.checklist_item_id}
            userId={user.id}
          />
        );
      case 'manager_qa':
        return <QAScheduler itemId={item.checklist_item_id} userId={user.id} />;
      case 'verification':
        return (
          <div className="text-sm text-muted-foreground">
            {progress.verified
              ? '✓ Verified by manager'
              : 'Pending manager verification'}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <OnboardingLayout progress={progressData}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome to SC-ART, {user.full_name}! 👋
          </h1>
          <p className="text-muted-foreground">
            Complete your onboarding checklist to get started
          </p>
        </div>

        <ChecklistProgress
          progress={stats.completion_percentage}
          completedItems={stats.completed_required_items}
          totalItems={stats.required_items}
        />

        <div className="space-y-4 mt-8">
          {items.map((item) => (
            <ChecklistItemCard
              key={item.checklist_item_id}
              item={{
                id: item.checklist_item_id,
                title: item.title,
                description: item.description,
                item_type: item.item_type,
                status: item.progress?.status || 'pending',
                is_required: item.is_required,
                config: item.config,
              }}
              userId={user.id}
            >
              {renderContent(item)}
            </ChecklistItemCard>
          ))}
        </div>
      </div>
    </OnboardingLayout>
  );
}
