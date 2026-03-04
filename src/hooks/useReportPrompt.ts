import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ReportPromptOptions {
  conversationIds?: string[];
  depth: 'compact' | 'standard' | 'detailed';
  language?: string;
}

interface ReportPromptResponse {
  prompt_text: string;
  metadata: {
    project_name: string;
    analyses_count: number;
    depth: string;
    language: string;
    generated_at: string;
    sample_size: number;
    variable_count: number;
  };
}

export function useReportPrompt(projectId: string) {
  const generatePrompt = useMutation({
    mutationFn: async (options: ReportPromptOptions) => {
      return api.post<ReportPromptResponse>(
        `/projects/${projectId}/reports/report-prompt`,
        {
          conversation_ids: options.conversationIds,
          depth: options.depth,
          language: options.language,
        }
      );
    },
  });

  return { generatePrompt };
}
