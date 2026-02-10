import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Layers,
  Plus,
  Wand2,
  Pencil,
  Trash2,
  Loader2,
  FolderOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useVariableGroups } from '@/hooks/useVariableGroups';
import { AutoDetectPanel } from './AutoDetectPanel';
import { ManualGrouper } from './ManualGrouper';
import { GROUP_TYPE_LABELS } from '@/types/variableGroups';
import type { VariableGroup, VariableGroupCreate } from '@/types/variableGroups';
import { toast } from 'sonner';

interface VariableGroupsManagerProps {
  projectId: string;
  availableVariables: string[];
}

export function VariableGroupsManager({
  projectId,
  availableVariables,
}: VariableGroupsManagerProps) {
  const { t, language } = useLanguage();
  const groupingT = t.grouping;
  const {
    groups,
    isLoading,
    isDetecting,
    autoDetectResult,
    error,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    autoDetect,
    clearAutoDetect,
  } = useVariableGroups(projectId);

  const [showManualGrouper, setShowManualGrouper] = useState(false);
  const [editingGroup, setEditingGroup] = useState<VariableGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<VariableGroup | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [showAutoDetect, setShowAutoDetect] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const toggleExpand = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleSaveManualGroup = async (data: VariableGroupCreate) => {
    setIsSaving(true);
    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, data);
        toast.success(groupingT?.groupUpdated || 'Grupo actualizado');
      } else {
        await createGroup(data);
        toast.success(groupingT?.groupCreated || 'Grupo creado');
      }
      setEditingGroup(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDetectedGroups = async (groupsToSave: VariableGroupCreate[]) => {
    setIsSaving(true);
    try {
      for (const g of groupsToSave) {
        await createGroup(g);
      }
      toast.success(
        `${groupsToSave.length} ${groupingT?.groupsSaved || 'grupos guardados'}`
      );
      clearAutoDetect();
      setShowAutoDetect(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;
    try {
      await deleteGroup(deletingGroup.id);
      toast.success(groupingT?.groupDeleted || 'Grupo eliminado');
    } finally {
      setDeletingGroup(null);
    }
  };

  const handleEdit = (group: VariableGroup) => {
    setEditingGroup(group);
    setShowManualGrouper(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {groupingT?.title || 'Grupos de Variables'}
          </h2>
          {groups.length > 0 && (
            <Badge variant="secondary">{groups.length}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowAutoDetect(!showAutoDetect);
            }}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            {groupingT?.autoDetect || 'Auto-detectar'}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingGroup(null);
              setShowManualGrouper(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {groupingT?.createGroup || 'Crear grupo'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Auto-detect panel */}
      {showAutoDetect && (
        <>
          <AutoDetectPanel
            isDetecting={isDetecting}
            autoDetectResult={autoDetectResult}
            onAutoDetect={autoDetect}
            onSaveGroups={handleSaveDetectedGroups}
            isSaving={isSaving}
          />
          <Separator />
        </>
      )}

      {/* Saved groups list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
            <div className="text-center space-y-1">
              <p className="font-medium text-muted-foreground">
                {groupingT?.noGroups || 'No hay grupos de variables'}
              </p>
              <p className="text-sm text-muted-foreground">
                {groupingT?.noGroupsHint ||
                  'Usa auto-detección o crea grupos manualmente'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-2 pr-2">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isExpanded={expandedGroups.has(group.id)}
                onToggleExpand={() => toggleExpand(group.id)}
                onEdit={() => handleEdit(group)}
                onDelete={() => setDeletingGroup(group)}
                groupingT={groupingT}
                language={language}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Manual grouper dialog */}
      <ManualGrouper
        open={showManualGrouper}
        onOpenChange={(open) => {
          setShowManualGrouper(open);
          if (!open) setEditingGroup(null);
        }}
        availableVariables={availableVariables}
        onSave={handleSaveManualGroup}
        editingGroup={editingGroup}
        isSaving={isSaving}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingGroup}
        onOpenChange={(open) => !open && setDeletingGroup(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {groupingT?.deleteConfirmTitle || '¿Eliminar grupo?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {groupingT?.deleteConfirmDescription ||
                'Esta acción no se puede deshacer. El grupo será eliminado permanentemente.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GroupCard({
  group,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  groupingT,
  language,
}: {
  group: VariableGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  groupingT: any;
  language: 'es' | 'en';
}) {
  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-2 text-left flex-1"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-medium">{group.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {GROUP_TYPE_LABELS[group.group_type]?.[language] || group.group_type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {group.variables.length} vars
                </span>
                {group.sub_groups && group.sub_groups.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {group.sub_groups.length} {groupingT?.subGroups || 'sub-grupos'}
                  </span>
                )}
              </div>
            </div>
          </button>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-3 px-4 space-y-3">
          {group.description && (
            <p className="text-xs text-muted-foreground">{group.description}</p>
          )}

          <div className="flex flex-wrap gap-1">
            {group.variables.map((v) => (
              <Badge key={v} variant="secondary" className="text-xs font-mono">
                {v}
              </Badge>
            ))}
          </div>

          {group.sub_groups && group.sub_groups.length > 0 && (
            <div className="space-y-1 pt-1">
              <p className="text-xs font-medium text-muted-foreground">
                {groupingT?.subGroups || 'Sub-grupos'}:
              </p>
              {group.sub_groups.map((sg, i) => (
                <div key={i} className="text-xs pl-2 border-l-2 border-primary/30">
                  <span className="font-medium">{sg.name}</span>:{' '}
                  {sg.variables.join(', ')}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
