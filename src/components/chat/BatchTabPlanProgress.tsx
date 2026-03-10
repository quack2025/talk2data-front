import { useState, useEffect, useRef, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';

interface BatchTabPlanProgressProps {
  data: {
    task_id: string;
    estimated_tables: number;
    stubs?: string[];
    banners?: string[];
  };
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 60; // ~3 min timeout

interface TaskStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  tables_done: number;
  tables_total: number;
  download_url: string | null;
  error: string | null;
}

export function BatchTabPlanProgress({ data }: BatchTabPlanProgressProps) {
  const { t } = useLanguage();
  const [taskStatus, setTaskStatus] = useState<TaskStatus>({
    status: 'pending',
    progress: 0,
    stage: '',
    tables_done: 0,
    tables_total: data.estimated_tables,
    download_url: null,
    error: null,
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const pollCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollStatus = useCallback(async () => {
    try {
      const response = await api.get<TaskStatus>(`/generate-tables/export-status/${data.task_id}`);
      setTaskStatus(response);

      if (response.status === 'completed' || response.status === 'failed') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }

      pollCountRef.current += 1;
      if (pollCountRef.current >= MAX_POLLS) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setTaskStatus(prev => ({
          ...prev,
          status: 'failed',
          error: t.chat?.batchTabPlan?.timedOut ?? 'Export timed out. Please try again.',
        }));
      }
    } catch {
      // Silently retry on poll errors
    }
  }, [data.task_id]);

  useEffect(() => {
    // Start polling
    pollStatus();
    intervalRef.current = setInterval(pollStatus, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pollStatus]);

  const handleDownload = async () => {
    if (!taskStatus.download_url) return;
    setIsDownloading(true);
    try {
      // Download from Supabase URL
      const link = document.createElement('a');
      link.href = taskStatus.download_url;
      link.download = 'tab_plan.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  const progressPercent = Math.round(taskStatus.progress * 100);

  if (taskStatus.status === 'completed') {
    return (
      <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-700 dark:text-green-400">
            {t.chat?.batchTabPlan?.exportComplete ?? 'Export complete'}
          </span>
          <Badge variant="outline" className="text-xs">
            {taskStatus.tables_total} {t.chat?.batchTabPlan?.tables ?? 'tables'}
          </Badge>
        </div>
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          size="sm"
          className="gap-2"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {t.chat?.batchTabPlan?.downloadExcel ?? 'Download Excel'}
        </Button>
      </div>
    );
  }

  if (taskStatus.status === 'failed') {
    return (
      <div className="rounded-lg border bg-red-50 dark:bg-red-950/20 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-600" />
          <span className="font-medium text-red-700 dark:text-red-400">
            {t.chat?.batchTabPlan?.exportFailed ?? 'Export failed'}
          </span>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400">
          {taskStatus.error || (t.chat?.batchTabPlan?.unexpectedError ?? 'An unexpected error occurred.')}
        </p>
      </div>
    );
  }

  // Processing state
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium">
          {t.chat?.batchTabPlan?.generating ?? 'Generating tables...'}
        </span>
        {taskStatus.tables_total > 0 && (
          <Badge variant="outline" className="text-xs">
            {taskStatus.tables_done}/{taskStatus.tables_total}
          </Badge>
        )}
      </div>
      <Progress value={progressPercent} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {taskStatus.stage || `${progressPercent}% ${t.chat?.batchTabPlan?.complete ?? 'complete'}`}
      </p>
    </div>
  );
}
