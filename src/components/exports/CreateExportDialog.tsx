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
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  projectId: z.string().min(1, 'Selecciona un proyecto'),
  format: z.enum(['pdf', 'excel', 'pptx']),
});

type FormData = z.infer<typeof formSchema>;

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
  const projectId = defaultProjectId || (projects.length > 0 ? projects[0].id : '');
  const { createExport } = useExports(projectId);

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
          <DialogTitle>Nueva exportación</DialogTitle>
          <DialogDescription>
            Genera un reporte con los análisis de tu proyecto.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proyecto</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un proyecto" />
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
                  <FormLabel>Formato</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="pptx">PowerPoint (.pptx)</SelectItem>
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
                Cancelar
              </Button>
              <Button type="submit" disabled={createExport.isPending || !projectId}>
                {createExport.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generar reporte
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
