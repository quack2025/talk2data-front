import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { UserPreferences, DefaultPromptResponse } from '@/types/userPreferences';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';

const PREFERENCES_KEY = ['user-preferences'];
const DEFAULT_PROMPT_KEY = ['default-prompt'];

export function useUserPreferences() {
  return useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: () => api.get<UserPreferences>('/api/v1/users/me/preferences'),
  });
}

export function useDefaultPrompt() {
  return useQuery({
    queryKey: DEFAULT_PROMPT_KEY,
    queryFn: () => api.get<DefaultPromptResponse>('/api/v1/users/me/preferences/default-prompt'),
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: (data: Partial<UserPreferences>) =>
      api.patch<UserPreferences>('/api/v1/users/me/preferences', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREFERENCES_KEY });
      toast({
        title: t.userPreferences.preferencesSaved,
        description: t.userPreferences.preferencesSavedDesc,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t.toasts.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
