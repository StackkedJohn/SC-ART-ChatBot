'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  GripVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { OnboardingChecklistItem } from '@/lib/supabase';

interface ChecklistManagerProps {
  initialItems: OnboardingChecklistItem[];
}

export function ChecklistManager({ initialItems }: ChecklistManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [deleteItem, setDeleteItem] = useState<OnboardingChecklistItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    // Reorder items in state
    const reorderedItems = Array.from(items);
    const [movedItem] = reorderedItems.splice(sourceIndex, 1);
    reorderedItems.splice(destIndex, 0, movedItem);

    // Update display_order for all affected items
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      display_order: index + 1,
    }));

    setItems(updatedItems);
    setIsReordering(true);

    try {
      // Send reordering request to API
      const res = await fetch('/api/onboarding/checklist/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updatedItems.map((item) => ({
            id: item.id,
            display_order: item.display_order,
          })),
        }),
      });

      if (!res.ok) throw new Error('Failed to reorder items');

      toast({
        title: 'Success',
        description: 'Checklist reordered successfully',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reorder checklist items',
        variant: 'destructive',
      });
      // Revert to original order on error
      setItems(initialItems);
    } finally {
      setIsReordering(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/onboarding/checklist/${deleteItem.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete item');

      toast({
        title: 'Success',
        description: 'Checklist item deleted successfully',
      });

      setItems(items.filter((item) => item.id !== deleteItem.id));
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete checklist item',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteItem(null);
    }
  };

  const handleToggleActive = async (item: OnboardingChecklistItem) => {
    try {
      const res = await fetch(`/api/onboarding/checklist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archived: !item.archived,
        }),
      });

      if (!res.ok) throw new Error('Failed to update item');

      toast({
        title: 'Success',
        description: `Item ${item.archived ? 'activated' : 'deactivated'} successfully`,
      });

      setItems(
        items.map((i) =>
          i.id === item.id ? { ...i, archived: !i.archived } : i
        )
      );

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update item',
        variant: 'destructive',
      });
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return '📝';
      case 'handbook_review':
        return '📖';
      case 'task_completion':
        return '✅';
      case 'manager_qa':
        return '💬';
      case 'verification':
        return '✔️';
      case 'profile_update':
        return '👤';
      default:
        return '📋';
    }
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="checklist">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`border rounded-lg p-4 bg-background transition-shadow ${
                        snapshot.isDragging ? 'shadow-lg' : ''
                      } ${item.archived ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Drag Handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="mt-1 cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="w-5 h-5 text-muted-foreground" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-lg">
                              {getItemTypeIcon(item.item_type)}
                            </span>
                            <h3 className="font-semibold text-sm sm:text-base">
                              {item.title}
                            </h3>
                            {item.is_required ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                <CheckCircle2 className="w-3 h-3" />
                                Required
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                <Circle className="w-3 h-3" />
                                Optional
                              </span>
                            )}
                            {item.archived && (
                              <span className="text-xs px-2 py-0.5 bg-muted rounded">
                                Inactive
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">
                            {item.description}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Type: {item.item_type.replace(/_/g, ' ')}
                            </span>
                            <span>Order: {item.display_order}</span>
                            {item.item_type === 'quiz' && item.config?.quiz_id && (
                              <span className="text-green-600">✓ Quiz configured</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(item)}
                            title={item.archived ? 'Activate' : 'Deactivate'}
                          >
                            {item.archived ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>

                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/onboarding/${item.id}/edit`}>
                              <Pencil className="w-4 h-4" />
                            </Link>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteItem(item)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Checklist Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteItem?.title}&quot;? This
              action cannot be undone and will remove this item from all existing
              intern checklists.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isReordering && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
          Reordering...
        </div>
      )}
    </>
  );
}
