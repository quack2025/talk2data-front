import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ExecutiveSummary } from '@/types/database';
import { useLanguage } from '@/i18n/LanguageContext';

interface PendingSummary {
  projectId: string;
  projectName: string;
  startedAt: number;
}

interface SummaryNotificationContextType {
  addPendingSummary: (projectId: string, projectName: string) => void;
  removePendingSummary: (projectId: string) => void;
  hasPendingSummary: (projectId: string) => boolean;
}

const SummaryNotificationContext = createContext<SummaryNotificationContextType | null>(null);

const POLL_INTERVAL = 3000; // 3 seconds
const MAX_POLL_TIME = 120000; // 2 minutes

export function SummaryNotificationProvider({ children }: { children: React.ReactNode }) {
  const [pendingSummaries, setPendingSummaries] = useState<PendingSummary[]>([]);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addPendingSummary = useCallback((projectId: string, projectName: string) => {
    setPendingSummaries(prev => {
      if (prev.some(p => p.projectId === projectId)) {
        return prev;
      }
      return [...prev, { projectId, projectName, startedAt: Date.now() }];
    });
  }, []);

  const removePendingSummary = useCallback((projectId: string) => {
    setPendingSummaries(prev => prev.filter(p => p.projectId !== projectId));
  }, []);

  const hasPendingSummary = useCallback((projectId: string) => {
    return pendingSummaries.some(p => p.projectId === projectId);
  }, [pendingSummaries]);

  // Polling effect
  useEffect(() => {
    if (pendingSummaries.length === 0) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const checkSummaries = async () => {
      const now = Date.now();
      
      for (const pending of pendingSummaries) {
        // Check timeout
        if (now - pending.startedAt > MAX_POLL_TIME) {
          removePendingSummary(pending.projectId);
          continue;
        }

        try {
          const summary = await api.get<ExecutiveSummary>(
            `/analysis/projects/${pending.projectId}/summary`
          );
          
          if (summary) {
            removePendingSummary(pending.projectId);
            
            // Show toast notification
            toast.success(t.summary.ready || 'Resumen ejecutivo listo', {
              description: pending.projectName,
              duration: 10000,
              action: {
                label: t.summary.viewFullSummary || 'Ver resumen',
                onClick: () => navigate(`/projects/${pending.projectId}/summary`),
              },
            });
          }
        } catch (error) {
          // 404 means still generating, continue polling
          if (error instanceof Error && !error.message.includes('404')) {
            console.error('Error checking summary:', error);
            removePendingSummary(pending.projectId);
          }
        }
      }
    };

    // Start polling
    pollIntervalRef.current = setInterval(checkSummaries, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [pendingSummaries, removePendingSummary, navigate, t]);

  return (
    <SummaryNotificationContext.Provider value={{ addPendingSummary, removePendingSummary, hasPendingSummary }}>
      {children}
    </SummaryNotificationContext.Provider>
  );
}

export function useSummaryNotification() {
  const context = useContext(SummaryNotificationContext);
  if (!context) {
    throw new Error('useSummaryNotification must be used within a SummaryNotificationProvider');
  }
  return context;
}
