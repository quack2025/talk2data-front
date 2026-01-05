import { useForm } from 'react-hook-form';
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
import { useExports } from '@/hooks/useExports';
import { useProjects } from '@/hooks/useProjects';
import { useLanguage } from '@/i18n/LanguageContext';
import { Loader2 } from 'lucide-react';

interface CreateExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
}

export function CreateExportDialog({
  open,
  onOpenChange,
  defaultProjectId,
}: CreateExportDialogProps) {
  const { projects } = useProjects();
  const { t } = useLanguage();
  const projectId = defaultProjectId || (projects.length > 0 ? projects[0].id : '');
  const { createExport } = useExports(projectId);

  const formSchema = z.object({
    projectId: z.string().min(1, t.createExport.projectPlaceholder),
    format: z.enum(['pdf', 'excel', 'pptx']),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: defaultProjectId || '',
      format: 'pdf',
    },
  });

  const onSubmit = async (data: FormData) => {
    await createExport.mutateAsync({
      format: data.format,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t.createExport.title}</DialogTitle>
          <DialogDescription>
            {t.createExport.description}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.createExport.projectLabel}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.createExport.formatLabel}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pdf">{t.exports.pdf}</SelectItem>
                      <SelectItem value="excel">{t.exports.excel} (.xlsx)</SelectItem>
                      <SelectItem value="pptx">{t.exports.pptx} (.pptx)</SelectItem>
                    </SelectContent>
                  </Select>
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
              <Button type="submit" disabled={createExport.isPending || !projectId}>
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
