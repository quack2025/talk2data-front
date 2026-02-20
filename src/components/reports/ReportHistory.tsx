import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
  History,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useReportHistory } from '@/hooks/useReportHistory';
import { downloadFile } from '@/lib/downloadFile';
import type { ReportHistoryItem } from '@/types/reports';

interface ReportHistoryProps {
  projectId: string;
  onRegenerate: (metadata: ReportHistoryItem['metadata']) => void;
}

export function ReportHistory({ projectId, onRegenerate }: ReportHistoryProps) {
  const { t } = useLanguage();
  const rpt = t.reports;
  const { reports, isLoading, refresh } = useReportHistory(projectId);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const handleDownload = async (url: string) => {
    try {
      await downloadFile(url, 'insights_report.pptx');
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  const isError = (item: ReportHistoryItem) =>
    item.storage_url.startsWith('error:');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-4">
        <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          {rpt?.noReports ?? 'No reports generated'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <History className="h-4 w-4" />
        {rpt?.reportHistory ?? 'Report history'}
      </Label>

      <ScrollArea className="max-h-[200px] rounded-md border">
        <div className="p-2 space-y-2">
          {reports.map((item) => (
            <Card key={item.id} className="shadow-none">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  {/* Left: date + badges */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {rpt?.generatedOn ?? 'Generated on'}{' '}
                      {formatDate(item.created_at)}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {item.metadata?.theme && (
                        <Badge variant="secondary" className="text-xs">
                          {item.metadata.theme}
                        </Badge>
                      )}
                      {item.metadata?.language && (
                        <Badge variant="secondary" className="text-xs">
                          {item.metadata.language.toUpperCase()}
                        </Badge>
                      )}
                      {item.metadata?.depth && (
                        <Badge variant="outline" className="text-xs">
                          {item.metadata.depth}
                        </Badge>
                      )}
                      {isError(item) && (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Error
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!isError(item) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownload(item.storage_url)}
                        title={rpt?.downloadReport ?? 'Download report'}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      onClick={() => onRegenerate(item.metadata)}
                    >
                      <RefreshCw className="h-3 w-3" />
                      {rpt?.regenerateWith ?? 'Regenerate with adjustments'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
