import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useExports } from '@/hooks/useExports';
import { useProjects } from '@/hooks/useProjects';
import { useChat } from '@/hooks/useChat';
import { useLanguage } from '@/i18n/LanguageContext';
import { Loader2, FileText, MessageSquare, FileSpreadsheet, Presentation } from 'lucide-react';

interface CreateExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
}

type ContentType = 'executive_summary' | 'conversation';
type ExportFormat = 'pdf' | 'excel' | 'pptx';

export function CreateExportDialog({
  open,
  onOpenChange,
  defaultProjectId,
}: CreateExportDialogProps) {
  const { projects } = useProjects();
  const { t } = useLanguage();
  
  const formSchema = z.object({
    projectId: z.string().min(1, t.createExport.projectPlaceholder),
    contentType: z.enum(['executive_summary', 'conversation']),
    conversationId: z.string().optional(),
    format: z.enum(['pdf', 'excel', 'pptx']),
  }).refine((data) => {
    // If conversation is selected, conversationId is required
    if (data.contentType === 'conversation' && !data.conversationId) {
      return false;
    }
    return true;
  }, {
    message: t.createExport.conversationPlaceholder,
    path: ['conversationId'],
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: defaultProjectId || '',
      contentType: 'executive_summary',
      conversationId: undefined,
      format: 'pdf',
    },
  });

  const selectedProjectId = useWatch({
    control: form.control,
    name: 'projectId',
  });

  const contentType = useWatch({
    control: form.control,
    name: 'contentType',
  });

  const projectId = selectedProjectId || defaultProjectId || (projects.length > 0 ? projects[0].id : '');
  const { createExport } = useExports(projectId);
  const { conversations, isLoading: conversationsLoading } = useChat(projectId);

  // Reset conversationId when switching content type or project
  useEffect(() => {
    if (contentType === 'executive_summary') {
      form.setValue('conversationId', undefined);
    }
  }, [contentType, form]);

  useEffect(() => {
    form.setValue('conversationId', undefined);
  }, [selectedProjectId, form]);

  // Set default project when dialog opens
  useEffect(() => {
    if (open && defaultProjectId) {
      form.setValue('projectId', defaultProjectId);
    }
  }, [open, defaultProjectId, form]);

  const onSubmit = async (data: FormData) => {
    await createExport.mutateAsync({
      format: data.format,
      conversationId: data.contentType === 'conversation' ? data.conversationId : undefined,
    });
    form.reset();
    onOpenChange(false);
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      case 'pptx':
        return <Presentation className="h-4 w-4 text-orange-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t.createExport.title}</DialogTitle>
          <DialogDescription>
            {t.createExport.description}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Project Selector */}
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.createExport.projectLabel}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || projectId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t.createExport.projectPlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content Type Selector */}
            <FormField
              control={form.control}
              name="contentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.createExport.contentLabel}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-3"
                    >
                      <div>
                        <RadioGroupItem
                          value="executive_summary"
                          id="executive_summary"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="executive_summary"
                          className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <FileText className="mb-2 h-6 w-6" />
                          <span className="font-medium">{t.createExport.executiveSummary}</span>
                          <span className="text-xs text-muted-foreground text-center mt-1">
                            {t.createExport.executiveSummaryDesc}
                          </span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="conversation"
                          id="conversation"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="conversation"
                          className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <MessageSquare className="mb-2 h-6 w-6" />
                          <span className="font-medium">{t.createExport.conversation}</span>
                          <span className="text-xs text-muted-foreground text-center mt-1">
                            {t.createExport.conversationDesc}
                          </span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conversation Selector (only when conversation is selected) */}
            {contentType === 'conversation' && (
              <FormField
                control={form.control}
                name="conversationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.createExport.conversationLabel}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={conversationsLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t.createExport.conversationPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {conversations.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            {t.createExport.noConversations}
                          </div>
                        ) : (
                          conversations.map((conv) => (
                            <SelectItem key={conv.id} value={conv.id}>
                              {conv.title || `Conversación ${conv.id.slice(0, 8)}`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Format Selector */}
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.createExport.formatLabel}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pdf">
                        <div className="flex items-center gap-2">
                          {getFormatIcon('pdf')}
                          <span>{t.exports.pdf}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="excel">
                        <div className="flex items-center gap-2">
                          {getFormatIcon('excel')}
                          <span>{t.exports.excel} (.xlsx)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="pptx">
                        <div className="flex items-center gap-2">
                          {getFormatIcon('pptx')}
                          <span>{t.exports.pptx} (.pptx)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value === 'pdf' && t.createExport.formatHint.pdf}
                    {field.value === 'excel' && t.createExport.formatHint.excel}
                    {field.value === 'pptx' && t.createExport.formatHint.pptx}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t.createExport.cancel}
              </Button>
              <Button 
                type="submit" 
                disabled={
                  createExport.isPending || 
                  !projectId ||
                  (contentType === 'conversation' && conversations.length === 0)
                }
              >
                {createExport.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {createExport.isPending ? t.createExport.generating : t.createExport.generate}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
