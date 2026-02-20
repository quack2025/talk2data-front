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
import { Separator } from '@/components/ui/separator';
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
import { REPORT_THEMES, REPORT_LANGUAGES, REPORT_DEPTHS, REPORT_TONES } from '@/types/reports';
import type { ReportOptions, ReportDepth, ReportTone, ReportHistoryItem, ReportTemplate } from '@/types/reports';
import { ConversationSelector } from './ConversationSelector';
import { ReportHistory } from './ReportHistory';
import { TemplateSelectorBar } from './TemplateSelectorBar';

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
  const rpt = t.reports;
  const reportGen = useReportGenerator(projectId);

  // Config form state
  const [reportLanguage, setReportLanguage] = useState('es');
  const [theme, setTheme] = useState<'modern_dark' | 'corporate_light' | 'minimal'>('modern_dark');
  const [depth, setDepth] = useState<ReportDepth>('standard');
  const [tone, setTone] = useState<ReportTone>('executive');
  const [researchBrief, setResearchBrief] = useState(studyObjective || '');
  const [includeSpeakerNotes, setIncludeSpeakerNotes] = useState(true);
  const [includeAppendix, setIncludeAppendix] = useState(false);
  const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>(
    conversationIds ?? []
  );

  const handleGenerate = async () => {
    const options: ReportOptions = {
      language: reportLanguage,
      theme,
      depth,
      tone,
      include_speaker_notes: includeSpeakerNotes,
      include_appendix: includeAppendix,
      ...(researchBrief.trim() ? { research_brief: researchBrief.trim() } : {}),
      ...(selectedConversationIds.length > 0
        ? { conversation_ids: selectedConversationIds }
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

  const handleRegenerate = (metadata: ReportHistoryItem['metadata']) => {
    if (!metadata) return;
    if (metadata.language) setReportLanguage(metadata.language);
    if (metadata.theme) setTheme(metadata.theme as typeof theme);
    if (metadata.depth) setDepth(metadata.depth as ReportDepth);
    if (metadata.tone) setTone(metadata.tone as ReportTone);
    if (metadata.research_brief) setResearchBrief(metadata.research_brief);
    if (metadata.include_speaker_notes !== undefined) {
      setIncludeSpeakerNotes(metadata.include_speaker_notes);
    }
    if (metadata.include_appendix !== undefined) {
      setIncludeAppendix(metadata.include_appendix);
    }
    if (metadata.conversation_ids) {
      setSelectedConversationIds(metadata.conversation_ids);
    }
  };

  const handleApplyTemplate = (config: ReportTemplate['config']) => {
    if (config.language) setReportLanguage(config.language);
    if (config.theme) setTheme(config.theme as typeof theme);
    if (config.depth) setDepth(config.depth as ReportDepth);
    if (config.tone) setTone(config.tone as ReportTone);
    if (config.include_speaker_notes !== undefined) {
      setIncludeSpeakerNotes(config.include_speaker_notes);
    }
    if (config.include_appendix !== undefined) {
      setIncludeAppendix(config.include_appendix);
    }
    if (config.research_brief !== undefined) {
      setResearchBrief(config.research_brief);
    }
  };

  const currentConfig: ReportTemplate['config'] = {
    language: reportLanguage,
    theme,
    depth,
    tone,
    include_speaker_notes: includeSpeakerNotes,
    include_appendix: includeAppendix,
    research_brief: researchBrief.trim() || undefined,
  };

  const phaseTexts = [
    rpt?.phase0 ?? 'Gathering analyses...',
    rpt?.phase1 ?? 'Identifying key findings...',
    rpt?.phase2 ?? 'Building slides...',
    rpt?.phase3 ?? 'Finalizing...',
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            {rpt?.generateInsightsReport ?? 'Generate Insights Report'}
          </DialogTitle>
        </DialogHeader>

        {/* === CONFIG STATE === */}
        {reportGen.status === 'idle' && (
          <div className="space-y-5 pt-2">
            {/* Data summary */}
            <p className="text-sm text-muted-foreground">
              {conversationCount} {rpt?.dataSummary ?? 'conversations - analyses performed'}
              {analysisCount > 0 && ` - ${analysisCount}`}
            </p>

            {/* Template selector bar */}
            <div className="space-y-2">
              <Label>{rpt?.template ?? 'Template'}</Label>
              <TemplateSelectorBar
                projectId={projectId}
                onApplyTemplate={handleApplyTemplate}
                currentConfig={currentConfig}
              />
            </div>

            {/* Language Select */}
            <div className="space-y-2">
              <Label>{rpt?.reportLanguage ?? 'Report language'}</Label>
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

            {/* Tone selector */}
            <div className="space-y-2">
              <Label>{rpt?.narrativeTone ?? 'Narrative tone'}</Label>
              <RadioGroup
                value={tone}
                onValueChange={(v) => setTone(v as ReportTone)}
                className="grid grid-cols-3 gap-3"
              >
                {REPORT_TONES.map((toneOption) => (
                  <div key={toneOption.value}>
                    <RadioGroupItem
                      value={toneOption.value}
                      id={`tone-${toneOption.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`tone-${toneOption.value}`}
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center gap-1"
                    >
                      <span className="text-sm font-medium">
                        {language === 'es' ? toneOption.labelEs : toneOption.labelEn}
                      </span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {language === 'es' ? toneOption.descEs : toneOption.descEn}
                      </span>
                      <span className="text-xs text-muted-foreground/70 font-normal italic mt-1">
                        {language === 'es' ? toneOption.exampleEs : toneOption.exampleEn}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Theme selector */}
            <div className="space-y-2">
              <Label>{rpt?.visualTheme ?? 'Visual theme'}</Label>
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

            {/* Depth selector */}
            <div className="space-y-2">
              <Label>{rpt?.reportDepth ?? 'Report depth'}</Label>
              <RadioGroup
                value={depth}
                onValueChange={(v) => setDepth(v as ReportDepth)}
                className="grid grid-cols-3 gap-3"
              >
                {REPORT_DEPTHS.map((depthOption) => (
                  <div key={depthOption.value}>
                    <RadioGroupItem
                      value={depthOption.value}
                      id={`depth-${depthOption.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`depth-${depthOption.value}`}
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center gap-1"
                    >
                      <span className="text-sm font-medium">
                        {language === 'es' ? depthOption.labelEs : depthOption.labelEn}
                      </span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {language === 'es' ? depthOption.descEs : depthOption.descEn}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Conversation selector */}
            <ConversationSelector
              projectId={projectId}
              selectedIds={selectedConversationIds}
              onSelectionChange={setSelectedConversationIds}
            />

            {/* Research Brief */}
            <div className="space-y-2">
              <Label>{rpt?.researchBrief ?? 'Research Brief (optional)'}</Label>
              <Textarea
                value={researchBrief}
                onChange={(e) => setResearchBrief(e.target.value)}
                placeholder={
                  rpt?.researchBriefPlaceholder ??
                  'E.g.: The goal is to understand...'
                }
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {rpt?.researchBriefHint ??
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
                {rpt?.includeSpeakerNotes ?? 'Include speaker notes'}
              </Label>
            </div>

            {/* Appendix Checkbox */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-appendix"
                  checked={includeAppendix}
                  onCheckedChange={(checked) =>
                    setIncludeAppendix(checked === true)
                  }
                />
                <Label htmlFor="include-appendix" className="text-sm font-normal cursor-pointer">
                  {rpt?.includeAppendix ?? 'Include data appendix'}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {rpt?.appendixHint ?? 'Adds slides with data tables supporting each finding.'}
              </p>
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
                {rpt?.generate ?? 'Generate'}
              </Button>
            </div>

            {conversationCount === 0 && (
              <p className="text-xs text-destructive">
                {rpt?.noConversations ??
                  'You need at least one conversation with analyses.'}
              </p>
            )}

            {/* Report History */}
            <Separator />
            <ReportHistory
              projectId={projectId}
              onRegenerate={handleRegenerate}
            />
          </div>
        )}

        {/* === PROCESSING STATE === */}
        {reportGen.status === 'processing' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium text-lg">
              {rpt?.generating ?? 'Generating your report...'}
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
              {rpt?.completed ?? 'Report ready'}
            </p>
            <Button onClick={handleDownload} size="lg" className="gap-2">
              <Download className="h-4 w-4" />
              {rpt?.download ?? 'Download PPTX'}
            </Button>
            <button
              onClick={handleReset}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              {rpt?.generateAnother ?? 'Generate another'}
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
              {rpt?.error ?? 'Error generating report'}
            </p>
            {reportGen.error && (
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {reportGen.error}
              </p>
            )}
            <Button onClick={handleReset} variant="outline" className="gap-2">
              {rpt?.retry ?? 'Retry'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
