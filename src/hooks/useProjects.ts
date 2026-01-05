import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { Project, ProjectUpdateData } from '@/types/database';

interface ToastMessages {
  projectCreated: string;
  projectCreatedDesc: string;
  projectUpdated: string;
  projectDeleted: string;
  error: string;
}

export function useProjects(toastMessages?: ToastMessages) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listar proyectos
  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/projects'),
  });

  // Crear proyecto
  const createProject = useMutation({
    mutationFn: (data: { 
      name: string; 
      description?: string;
      study_objective?: string;
      country?: string;
      industry?: string;
      target_audience?: string;
      brands?: string[];
      methodology?: string;
      study_date?: string;
      is_tracking?: boolean;
      wave_number?: number;
      additional_context?: string;
    }) =>
      api.post<Project>('/projects', { ...data, owner_type: 'user' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: toastMessages?.projectCreated ?? 'Project created',
        description: toastMessages?.projectCreatedDesc ?? 'The project has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: toastMessages?.error ?? 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Actualizar proyecto
  const updateProject = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      api.patch<Project>(`/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: toastMessages?.projectUpdated ?? 'Project updated',
      });
    },
  });

  // Eliminar proyecto
  const deleteProject = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: toastMessages?.projectDeleted ?? 'Project deleted',
      });
    },
  });

  return {
    projects: projectsQuery.data ?? [],
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
    createProject,
    updateProject,
    deleteProject,
  };
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get<Project>(`/projects/${projectId}`),
    enabled: !!projectId,
  });
}

interface UpdateProjectParams {
  projectId: string;
  data: ProjectUpdateData;
  toastMessages?: { success: string; error: string };
}

export function useUpdateProject() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: UpdateProjectParams) =>
      api.patch<Project>(`/projects/${projectId}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      toast({
        title: variables.toastMessages?.success ?? 'Project updated',
      });
    },
    onError: (error: Error, variables) => {
      toast({
        title: variables.toastMessages?.error ?? 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

interface DeleteProjectParams {
  projectId: string;
  toastMessages?: { success: string; error: string };
}

export function useDeleteProject() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId }: DeleteProjectParams) =>
      api.delete(`/projects/${projectId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: variables.toastMessages?.success ?? 'Project deleted',
      });
    },
    onError: (error: Error, variables) => {
      toast({
        title: variables.toastMessages?.error ?? 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
