import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useReportPrompt } from '@/hooks/useReportPrompt';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import {
  Loader2,
  Copy,
  Download,
  FileText,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

type Depth = 'compact' | 'standard' | 'detailed';

interface ReportPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  conversationId?: string | null;
}

export function ReportPromptDialog({
  open,
  onOpenChange,
  projectId,
  conversationId,
}: ReportPromptDialogProps) {
  const { t } = useLanguage();
  const { generatePrompt } = useReportPrompt(projectId);
  const [depth, setDepth] = useState<Depth>('standard');
  const [source, setSource] = useState<'current' | 'all'>('current');
  const [promptText, setPromptText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels = t.reportPromptDialog;

  const handleGenerate = async () => {
    setError(null);
    try {
      const result = await generatePrompt.mutateAsync({
        depth,
        conversationIds:
          source === 'current' && conversationId
            ? [conversationId]
            : undefined,
      });
      setPromptText(result.prompt_text);
    } catch {
      const msg = labels?.error ?? 'Error generating prompt. Please try again.';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleCopy = async () => {
    if (!promptText) return;
    await navigator.clipboard.writeText(promptText);
    setCopied(true);
    toast.success(labels?.copied ?? 'Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!promptText) return;
    const blob = new Blob([promptText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report-prompt.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setPromptText(null);
      setCopied(false);
      setError(null);
    }, 300);
  };

  const handleBack = () => {
    setPromptText(null);
    setCopied(false);
  };

  // --- Preview mode (after generation) ---
  if (promptText) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogTitle>
                {labels?.resultTitle ?? 'Your Report Prompt'}
              </DialogTitle>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 max-h-[55vh] rounded-md border bg-muted/30 p-4">
            <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
              {promptText}
            </pre>
          </ScrollArea>

          <p className="text-xs text-muted-foreground px-1">
            {labels?.hint ??
              'Paste this into Gamma, ChatGPT, Tome, or any AI tool.'}
          </p>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              {labels?.download ?? 'Download'}
            </Button>
            <Button onClick={handleCopy}>
              {copied ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied
                ? labels?.copied ?? 'Copied!'
                : labels?.copyToClipboard ?? 'Copy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // --- Options mode (before generation) ---
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {labels?.title ?? 'Generate Report Prompt'}
          </DialogTitle>
          <DialogDescription>
            {labels?.description ??
              'Create a structured document for any AI tool.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Depth selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {labels?.depth ?? 'Depth'}
            </Label>
            <RadioGroup
              value={depth}
              onValueChange={(v) => setDepth(v as Depth)}
              className="grid grid-cols-3 gap-3"
            >
              {(['compact', 'standard', 'detailed'] as Depth[]).map((d) => (
                <div key={d}>
                  <RadioGroupItem
                    value={d}
                    id={`depth-${d}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`depth-${d}`}
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center"
                  >
                    <span className="font-medium text-sm">
                      {labels?.[d] ?? d}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-1">
                      {labels?.[`${d}Desc` as keyof typeof labels] ?? ''}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Source selector */}
          {conversationId && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {labels?.source ?? 'Source'}
              </Label>
              <RadioGroup
                value={source}
                onValueChange={(v) => setSource(v as 'current' | 'all')}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <RadioGroupItem
                    value="current"
                    id="source-current"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="source-current"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center"
                  >
                    <span className="text-sm font-medium">
                      {labels?.currentConversation ?? 'Current'}
                    </span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="all"
                    id="source-all"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="source-all"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center"
                  >
                    <span className="text-sm font-medium">
                      {labels?.allConversations ?? 'All'}
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive px-1">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t.common?.cancel ?? 'Cancel'}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generatePrompt.isPending}
          >
            {generatePrompt.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {generatePrompt.isPending
              ? labels?.generating ?? 'Generating...'
              : labels?.generate ?? 'Generate Prompt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
