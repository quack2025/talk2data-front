import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Filter, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSegments } from '@/hooks/useSegments';
import { SegmentFormDialog } from './SegmentFormDialog';
import { OPERATOR_LABELS } from '@/types/segments';
import type { Segment, SegmentCreate } from '@/types/segments';
import type { ExploreVariable } from '@/types/explore';
import { toast } from 'sonner';

interface SegmentManagerProps {
  projectId: string;
  availableVariables: ExploreVariable[];
}

export function SegmentManager({
  projectId,
  availableVariables,
}: SegmentManagerProps) {
  const { t, language } = useLanguage();
  const seg = t.segments;
  const {
    segments,
    isLoading,
    error,
    fetchSegments,
    createSegment,
    updateSegment,
    deleteSegment,
    previewSegment,
  } = useSegments(projectId);

  const [showDialog, setShowDialog] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [deletingSegment, setDeletingSegment] = useState<Segment | null>(null);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const handleCreate = () => {
    setEditingSegment(null);
    setShowDialog(true);
  };

  const handleEdit = (segment: Segment) => {
    setEditingSegment(segment);
    setShowDialog(true);
  };

  const handleSave = async (data: SegmentCreate) => {
    if (editingSegment) {
      await updateSegment(editingSegment.id, data);
      toast.success(seg?.updated ?? 'Segment updated');
    } else {
      await createSegment(data);
      toast.success(seg?.created ?? 'Segment created');
    }
  };

  const handleDelete = async () => {
    if (!deletingSegment) return;
    try {
      await deleteSegment(deletingSegment.id);
      toast.success(seg?.deleted ?? 'Segment deleted');
    } catch {
      // error in hook
    }
    setDeletingSegment(null);
  };

  const conditionSummary = (segment: Segment) => {
    const conds = segment.conditions?.conditions || [];
    return conds
      .map((c) => {
        const opLabel = OPERATOR_LABELS[c.operator]?.[language] ?? c.operator;
        const val = c.values ? c.values.join(', ') : String(c.value ?? '');
        return `${c.variable} ${opLabel} ${val}`;
      })
      .join(' AND ');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">
            {seg?.title ?? 'Segments'}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {segments.length}
          </Badge>
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1" />
          {seg?.createSegment ?? 'New Segment'}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : segments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            {seg?.empty ?? 'No segments defined yet. Create one to apply as a reusable filter.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {segments.map((segment) => (
            <Card key={segment.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {segment.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(segment)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setDeletingSegment(segment)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {segment.description && (
                  <p className="text-xs text-muted-foreground mb-1">
                    {segment.description}
                  </p>
                )}
                <p className="text-xs font-mono text-muted-foreground bg-muted/50 rounded px-2 py-1">
                  {conditionSummary(segment)}
                </p>
                <Badge
                  variant={segment.is_active ? 'default' : 'secondary'}
                  className="mt-2 text-[10px]"
                >
                  {segment.conditions?.conditions?.length ?? 0}{' '}
                  {seg?.conditionCount ?? 'conditions'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <SegmentFormDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        editingSegment={editingSegment}
        onSave={handleSave}
        onPreview={previewSegment}
        availableVariables={availableVariables}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingSegment}
        onOpenChange={(open) => !open && setDeletingSegment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {seg?.deleteTitle ?? 'Delete Segment'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {seg?.deleteDescription ??
                'This segment will be permanently deleted. Analyses using this segment will no longer be filtered.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{seg?.cancel ?? 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {seg?.delete ?? 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
