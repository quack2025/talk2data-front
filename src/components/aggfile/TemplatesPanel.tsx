import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Save,
  Trash2,
  FolderOpen,
  Clock,
  FileText,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { GenerateTablesConfig } from '@/types/aggfile';

interface TableTemplate {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  description: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface TemplatesPanelProps {
  projectId: string;
  currentConfig: GenerateTablesConfig;
  onLoadTemplate: (config: GenerateTablesConfig) => void;
}

export function TemplatesPanel({
  projectId,
  currentConfig,
  onLoadTemplate,
}: TemplatesPanelProps) {
  const { t } = useLanguage();
  const [templates, setTemplates] = useState<TableTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<TableTemplate[]>(
        `/projects/${projectId}/table-templates`
      );
      setTemplates(response);
    } catch {
      // silently fail - templates are optional
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setIsSaving(true);
    try {
      await api.post(`/projects/${projectId}/table-templates`, {
        name: saveName.trim(),
        description: saveDescription.trim() || null,
        config: currentConfig,
      });
      setSaveDialogOpen(false);
      setSaveName('');
      setSaveDescription('');
      fetchTemplates();
    } catch {
      // error handled by api client
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      await api.delete(`/projects/${projectId}/table-templates/${templateId}`);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch {
      // error handled by api client
    }
  };

  const handleLoad = (template: TableTemplate) => {
    onLoadTemplate(template.config as unknown as GenerateTablesConfig);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{t.aggfile?.savedTemplates || 'Saved templates'}</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSaveDialogOpen(true)}
          className="gap-1.5"
        >
          <Save className="h-3.5 w-3.5" />
          {t.aggfile?.saveCurrent || 'Save current'}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          {t.aggfile?.noTemplates || 'No saved templates'}
        </p>
      ) : (
        <ScrollArea className="max-h-[200px]">
          <div className="space-y-2">
            {templates.map((template) => (
              <Card key={template.id} className="group">
                <CardContent className="p-3 flex items-center justify-between gap-2">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleLoad(template)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {template.name}
                      </span>
                    </div>
                    {template.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5 pl-5">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1 pl-5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(template.updated_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleLoad(template)}
                      title={t.aggfile?.loadTemplate || 'Load template'}
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setConfirmDeleteId(template.id)}
                      title={t.common?.delete || 'Delete'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.aggfile?.deleteTemplate || 'Delete this template?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.aggfile?.deleteTemplateConfirm || 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) handleDelete(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.aggfile?.saveTemplate || 'Save template'}</DialogTitle>
            <DialogDescription>
              {t.aggfile?.saveTemplateDescription || 'Save the current configuration for later reuse'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="template-name">{t.aggfile?.templateName || 'Name'}</Label>
              <Input
                id="template-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={t.aggfile?.templateNamePlaceholder || 'E.g.: Satisfaction crosstabs'}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template-desc">{t.aggfile?.templateDescription || 'Description (optional)'}</Label>
              <Input
                id="template-desc"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder={t.aggfile?.templateDescPlaceholder || 'Brief description'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!saveName.trim() || isSaving}
            >
              {isSaving ? (t.common?.saving || 'Saving...') : (t.common?.save || 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
