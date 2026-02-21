import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Save, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { useReportTemplates } from '@/hooks/useReportTemplates';
import type { ReportTemplate } from '@/types/reports';

const NO_TEMPLATE = '__none__';

interface TemplateSelectorBarProps {
  projectId: string;
  onApplyTemplate: (config: ReportTemplate['config']) => void;
  currentConfig: ReportTemplate['config'];
}

export function TemplateSelectorBar({
  projectId,
  onApplyTemplate,
  currentConfig,
}: TemplateSelectorBarProps) {
  const { t } = useLanguage();
  const rpt = t.reports;
  const {
    templates,
    isLoading,
    fetchTemplates,
    createTemplate,
    deleteTemplate,
  } = useReportTemplates(projectId);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(NO_TEMPLATE);
  const [saveOpen, setSaveOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSelectTemplate = (value: string) => {
    setSelectedTemplateId(value);
    if (value === NO_TEMPLATE) return;
    const template = templates.find((t) => t.id === value);
    if (template) {
      onApplyTemplate(template.config);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) return;
    setIsSaving(true);
    try {
      await createTemplate({
        name: templateName.trim(),
        description: templateDescription.trim() || null,
        config: currentConfig,
      });
      toast.success(rpt?.templateSaved ?? 'Template saved');
      setTemplateName('');
      setTemplateDescription('');
      setSaveOpen(false);
    } catch {
      toast.error(rpt?.error ?? 'Error saving template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(NO_TEMPLATE);
      }
      toast.success(rpt?.templateDeleted ?? 'Template deleted');
    } catch {
      toast.error(rpt?.error ?? 'Error deleting template');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <Select value={selectedTemplateId} onValueChange={handleSelectTemplate}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={rpt?.noTemplate ?? 'No template'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_TEMPLATE}>
              {rpt?.noTemplate ?? 'No template'}
            </SelectItem>
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="flex items-center group">
                <SelectItem value={tmpl.id} className="flex-1">
                  {tmpl.name}
                </SelectItem>
                <button
                  className="p-1 mr-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteId(tmpl.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      <Popover open={saveOpen} onOpenChange={setSaveOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
            <Save className="h-3.5 w-3.5" />
            {rpt?.saveAsTemplate ?? 'Save as template'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="template-name" className="text-sm">
                {rpt?.templateName ?? 'Template name'}
              </Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Executive Summary ES"
                className="h-8"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template-desc" className="text-sm">
                {rpt?.templateDescription ?? 'Description (optional)'}
              </Label>
              <Textarea
                id="template-desc"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={!templateName.trim() || isSaving}
              size="sm"
              className="w-full"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              {rpt?.saveAsTemplate ?? 'Save as template'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{rpt?.confirmDeleteTemplate ?? '¿Eliminar esta plantilla?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {rpt?.confirmDeleteTemplateDesc ?? 'Esta acción no se puede deshacer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common?.cancel ?? 'Cancelar'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) handleDelete(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common?.delete ?? 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
