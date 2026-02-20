import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Presentation,
  Download,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useReportGenerator } from '@/hooks/useReportGenerator';
import { downloadFile } from '@/lib/downloadFile';
import { REPORT_THEMES, REPORT_LANGUAGES } from '@/types/reports';
import type { ReportOptions } from '@/types/reports';

interface ReportGeneratorDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationIds?: string[];
  studyObjective?: string;
  analysisCount?: number;
  conversationCount?: number;
}

export function ReportGeneratorDialog({
  projectId,
  open,
  onOpenChange,
  conversationIds,
  studyObjective,
  analysisCount = 0,
  conversationCount = 0,
}: ReportGeneratorDialogProps) {
  const { t, language } = useLanguage();
  const reportGen = useReportGenerator(projectId);

  // Config form state
  const [reportLanguage, setReportLanguage] = useState('es');
  const [theme, setTheme] = useState<'modern_dark' | 'corporate_light' | 'minimal'>('modern_dark');
  const [researchBrief, setResearchBrief] = useState(studyObjective || '');
  const [includeSpeakerNotes, setIncludeSpeakerNotes] = useState(true);

  const handleGenerate = async () => {
    const options: ReportOptions = {
      language: reportLanguage,
      theme,
      include_speaker_notes: includeSpeakerNotes,
      ...(researchBrief.trim() ? { research_brief: researchBrief.trim() } : {}),
      ...(conversationIds && conversationIds.length > 0
        ? { conversation_ids: conversationIds }
        : {}),
    };
    await reportGen.generate(options);
  };

  const handleDownload = async () => {
    if (reportGen.downloadUrl) {
      try {
        await downloadFile(reportGen.downloadUrl, `insights_report.pptx`);
      } catch (e) {
        console.error('Download failed:', e);
      }
    }
  };

  const handleReset = () => {
    reportGen.reset();
    setResearchBrief(studyObjective || '');
  };

  const handleOpenChange = (value: boolean) => {
    if (!value && reportGen.status === 'processing') {
      // Don't close while processing
      return;
    }
    if (!value) {
      reportGen.reset();
    }
    onOpenChange(value);
  };

  const phaseTexts = [
    t.reports?.phase0 ?? 'Gathering analyses...',
    t.reports?.phase1 ?? 'Identifying key findings...',
    t.reports?.phase2 ?? 'Building slides...',
    t.reports?.phase3 ?? 'Finalizing...',
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            {t.reports?.generateInsightsReport ?? 'Generate Insights Report'}
          </DialogTitle>
        </DialogHeader>

        {/* === CONFIG STATE === */}
        {reportGen.status === 'idle' && (
          <div className="space-y-5 pt-2">
            {/* Data summary */}
            <p className="text-sm text-muted-foreground">
              {conversationCount} {t.reports?.dataSummary ?? 'conversations - analyses performed'}
              {analysisCount > 0 && ` - ${analysisCount}`}
            </p>

            {/* Language Select */}
            <div className="space-y-2">
              <Label>{t.reports?.reportLanguage ?? 'Report language'}</Label>
              <Select value={reportLanguage} onValueChange={setReportLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {language === 'es' ? lang.labelEs : lang.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Theme selector */}
            <div className="space-y-2">
              <Label>{t.reports?.visualTheme ?? 'Visual theme'}</Label>
              <RadioGroup
                value={theme}
                onValueChange={(v) =>
                  setTheme(v as 'modern_dark' | 'corporate_light' | 'minimal')
                }
                className="grid grid-cols-3 gap-3"
              >
                {REPORT_THEMES.map((themeOption) => (
                  <div key={themeOption.value}>
                    <RadioGroupItem
                      value={themeOption.value}
                      id={`theme-${themeOption.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`theme-${themeOption.value}`}
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center"
                    >
                      <span className="text-sm font-medium">
                        {language === 'es' ? themeOption.labelEs : themeOption.labelEn}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Research Brief */}
            <div className="space-y-2">
              <Label>{t.reports?.researchBrief ?? 'Research Brief (optional)'}</Label>
              <Textarea
                value={researchBrief}
                onChange={(e) => setResearchBrief(e.target.value)}
                placeholder={
                  t.reports?.researchBriefPlaceholder ??
                  'E.g.: The goal is to understand...'
                }
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {t.reports?.researchBriefHint ??
                  'If not provided, inferred from context.'}
              </p>
            </div>

            {/* Speaker Notes Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="speaker-notes"
                checked={includeSpeakerNotes}
                onCheckedChange={(checked) =>
                  setIncludeSpeakerNotes(checked === true)
                }
              />
              <Label htmlFor="speaker-notes" className="text-sm font-normal cursor-pointer">
                {t.reports?.includeSpeakerNotes ?? 'Include speaker notes'}
              </Label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t.common?.cancel ?? 'Cancel'}
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={conversationCount === 0}
              >
                <Presentation className="h-4 w-4 mr-2" />
                {t.reports?.generate ?? 'Generate'}
              </Button>
            </div>

            {conversationCount === 0 && (
              <p className="text-xs text-destructive">
                {t.reports?.noConversations ??
                  'You need at least one conversation with analyses.'}
              </p>
            )}
          </div>
        )}

        {/* === PROCESSING STATE === */}
        {reportGen.status === 'processing' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium text-lg">
              {t.reports?.generating ?? 'Generating your report...'}
            </p>
            <p className="text-sm text-muted-foreground animate-pulse">
              {phaseTexts[reportGen.progressPhase] ?? phaseTexts[0]}
            </p>
          </div>
        )}

        {/* === COMPLETED STATE === */}
        {reportGen.status === 'completed' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <p className="font-medium text-lg">
              {t.reports?.completed ?? 'Report ready'}
            </p>
            <Button onClick={handleDownload} size="lg" className="gap-2">
              <Download className="h-4 w-4" />
              {t.reports?.download ?? 'Download PPTX'}
            </Button>
            <button
              onClick={handleReset}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              {t.reports?.generateAnother ?? 'Generate another'}
            </button>
          </div>
        )}

        {/* === ERROR STATE === */}
        {reportGen.status === 'error' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <p className="font-medium text-lg">
              {t.reports?.error ?? 'Error generating report'}
            </p>
            {reportGen.error && (
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {reportGen.error}
              </p>
            )}
            <Button onClick={handleReset} variant="outline" className="gap-2">
              {t.reports?.retry ?? 'Retry'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
