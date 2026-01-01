import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Upload,
  MessageSquare,
  FileText,
  Settings,
  FileSpreadsheet,
  Plus,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Project, ProjectFile } from '@/types/database';

const statusConfig = {
  active: { label: 'Activo', variant: 'default' as const },
  processing: { label: 'Procesando', variant: 'secondary' as const },
  completed: { label: 'Completado', variant: 'outline' as const },
  archived: { label: 'Archivado', variant: 'outline' as const },
};

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!projectId,
  });

  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ['project-files', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProjectFile[];
    },
    enabled: !!projectId,
  });

  if (projectLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 text-center">
          <h1 className="text-2xl font-bold">Proyecto no encontrado</h1>
          <Button
            variant="link"
            onClick={() => navigate('/projects')}
            className="mt-4"
          >
            Volver a proyectos
          </Button>
        </div>
      </AppLayout>
    );
  }

  const hasFiles = files && files.length > 0;
  const hasReadyFiles = files?.some((f) => f.status === 'ready');

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">Proyectos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant={statusConfig[project.status].variant}>
                {statusConfig[project.status].label}
              </Badge>
            </div>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Creado el{' '}
              {format(new Date(project.created_at), "d 'de' MMMM, yyyy", {
                locale: es,
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/project/${projectId}/upload`)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir archivos
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/project/${projectId}/chat`)}
              disabled={!hasReadyFiles}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Abrir chat
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(`/project/${projectId}/upload`)}
          >
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base">Subir archivos</CardTitle>
              <CardDescription>Añade datos SPSS al proyecto</CardDescription>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-colors ${
              hasReadyFiles ? 'hover:border-primary/50' : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={() => hasReadyFiles && navigate(`/project/${projectId}/chat`)}
          >
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base">Chat con datos</CardTitle>
              <CardDescription>
                {hasReadyFiles ? 'Analiza con IA' : 'Sube archivos primero'}
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-colors ${
              hasReadyFiles ? 'hover:border-primary/50' : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={() => hasReadyFiles && navigate('/exports')}
          >
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base">Exportar</CardTitle>
              <CardDescription>Genera reportes PDF</CardDescription>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base">Configuración</CardTitle>
              <CardDescription>Ajustes del proyecto</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Files section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Archivos</CardTitle>
              <CardDescription>Datos cargados en el proyecto</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/project/${projectId}/upload`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Añadir
            </Button>
          </CardHeader>
          <CardContent>
            {filesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !hasFiles ? (
              <div className="text-center py-8">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No hay archivos aún</p>
                <Button
                  variant="link"
                  onClick={() => navigate(`/project/${projectId}/upload`)}
                  className="mt-2"
                >
                  Subir primer archivo
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileSpreadsheet className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.file_size / 1024 / 1024).toFixed(2)} MB •{' '}
                        {format(new Date(file.created_at), "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        file.status === 'ready'
                          ? 'default'
                          : file.status === 'error'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {file.status === 'ready'
                        ? 'Listo'
                        : file.status === 'error'
                        ? 'Error'
                        : 'Procesando'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
