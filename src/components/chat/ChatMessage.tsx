import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bot, User, BarChart3, FileSpreadsheet, Loader2, Code2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { Message, RefinementAction } from '@/types/database';
import { format } from 'date-fns';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RefineActions } from './RefineActions';
import { ChartWithTable } from '@/components/charts/ChartWithTable';

interface ChatMessageProps {
  message: Message;
  onRefine?: (messageId: string, action: RefinementAction, params: Record<string, unknown>) => void;
  isRefining?: boolean;
  onSelect?: (messageId: string) => void;
  isSelected?: boolean;
}

export function ChatMessage({ message, onRefine, isRefining = false, onSelect, isSelected }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const { t } = useLanguage();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const hasAnalysis = !isUser && (
    message.analysis_executed && Object.keys(message.analysis_executed).length > 0 ||
    message.charts && message.charts.length > 0 ||
    message.tables && message.tables.length > 0
  );

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const blob = await api.downloadBlob(`/messages/${message.id}/export/excel`, 'POST');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis_${message.id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: t.chat.exportSuccess });
    } catch {
      toast({ title: t.chat.exportError, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const handleCopyCode = async () => {
    if (message.python_code) {
      await navigator.clipboard.writeText(message.python_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        'flex gap-3 p-4 transition-colors',
        isUser ? 'flex-row-reverse' : 'flex-row',
        !isUser && hasAnalysis && 'cursor-pointer hover:bg-muted/50',
        isSelected && 'bg-muted/60 ring-1 ring-primary/20 rounded-lg',
      )}
      onClick={!isUser && hasAnalysis && onSelect ? () => onSelect(message.id) : undefined}
    >
      <Avatar className={cn('h-8 w-8 flex-shrink-0', isUser && 'bg-primary')}>
        <AvatarFallback className={cn(isUser && 'bg-primary text-primary-foreground')}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'flex flex-col max-w-[85%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Charts visualization for assistant messages */}
        {!isUser && message.charts && message.charts.length > 0 && (
          <div className="mt-3 w-full space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs font-medium">{t.chat.visualizations}</span>
            </div>
            <div className="space-y-3">
              {message.charts.map((chart, index) => (
                <ChartWithTable
                  key={index}
                  chart={chart}
                  index={index}
                  onZoom={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* Python code collapsible */}
        {!isUser && message.python_code && (
          <Collapsible open={codeOpen} onOpenChange={setCodeOpen} className="mt-3 w-full">
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground h-7 px-2">
                  <Code2 className="h-3.5 w-3.5" />
                  {codeOpen ? t.chat.hideCode : t.chat.showCode}
                  {codeOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </CollapsibleTrigger>
              {!codeOpen && (
                <span className="text-[10px] text-muted-foreground/60">
                  {t.chat.reproducibleCode}
                </span>
              )}
            </div>
            <CollapsibleContent>
              <div className="relative mt-1 rounded-lg border bg-zinc-950 text-zinc-50 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800 bg-zinc-900">
                  <span className="text-[11px] text-zinc-400 font-mono">Python</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    onClick={handleCopyCode}
                  >
                    {codeCopied ? (
                      <><Check className="h-3 w-3 mr-1" />{t.chat.codeCopied}</>
                    ) : (
                      <><Copy className="h-3 w-3 mr-1" />{t.chat.copyCode}</>
                    )}
                  </Button>
                </div>
                <pre className="p-3 overflow-x-auto text-xs leading-relaxed">
                  <code>{message.python_code}</code>
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Action buttons for analysis messages */}
        {hasAnalysis && (
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              {t.chat.analysisExecuted}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 gap-1.5 text-xs px-2"
              onClick={handleExportExcel}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-3 w-3" />
              )}
              {exporting ? t.chat.exporting : t.chat.exportExcel}
            </Button>
          </div>
        )}

        {/* Refine actions */}
        {hasAnalysis && onRefine && (
          <RefineActions
            message={message}
            onRefine={(action, params) => onRefine(message.id, action, params)}
            disabled={isRefining}
          />
        )}

        <span className="text-xs text-muted-foreground mt-1">
          {format(new Date(message.created_at), 'HH:mm')}
        </span>
      </div>
    </div>
  );
}
