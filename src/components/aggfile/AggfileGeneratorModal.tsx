import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAggfileGenerator } from '@/hooks/useAggfileGenerator';
import { BannerVariablesStep } from './BannerVariablesStep';
import { AnalysisVariablesStep } from './AnalysisVariablesStep';
import { GeneratingState } from './GeneratingState';
import { SuccessState } from './SuccessState';
import { ErrorState } from './ErrorState';
import { useLanguage } from '@/i18n/LanguageContext';

interface AggfileGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function AggfileGeneratorModal({
  open,
  onOpenChange,
  projectId,
}: AggfileGeneratorModalProps) {
  const { t } = useLanguage();
  const generator = useAggfileGenerator(projectId);

  const handleClose = () => {
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => {
      generator.reset();
    }, 200);
  };

  const getStepInfo = () => {
    switch (generator.step) {
      case 'banners':
        return { step: 1, total: 2 };
      case 'analysis':
        return { step: 2, total: 2 };
      default:
        return null;
    }
  };

  const stepInfo = getStepInfo();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg h-[80vh] max-h-[700px] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>{t.aggfile?.title || 'Generar Tablas Cruzadas'}</DialogTitle>
            {stepInfo && (
              <span className="text-sm text-muted-foreground">
                {t.aggfile?.step || 'Paso'} {stepInfo.step}/{stepInfo.total}
              </span>
            )}
          </div>
          {(generator.step === 'banners' || generator.step === 'analysis') && (
            <DialogDescription>
              {t.aggfile?.description ||
                'Genera un archivo Excel con tablas cruzadas para tu estudio'}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {generator.step === 'banners' && (
            <BannerVariablesStep
              variables={generator.bannerVariables}
              selectedBanners={generator.selectedBanners}
              isLoading={generator.isLoadingBanners}
              maxBanners={generator.maxBanners}
              onToggle={generator.toggleBanner}
              onNext={generator.goToNextStep}
              onFetch={generator.fetchBannerVariables}
              canProceed={generator.canProceedToAnalysis}
            />
          )}

          {generator.step === 'analysis' && (
            <AnalysisVariablesStep
              variables={generator.analysisVariables}
              selectedAnalysis={generator.selectedAnalysis}
              format={generator.format}
              isLoading={generator.isLoadingAnalysis}
              onToggle={generator.toggleAnalysis}
              onSetMode={generator.setAnalysisMode}
              onSetValueType={generator.setValueType}
              onSetDecimalPlaces={generator.setDecimalPlaces}
              onSetIncludeBases={generator.setIncludeBases}
              onBack={generator.goToPrevStep}
              onGenerate={generator.generateAggfile}
              onFetch={generator.fetchAnalysisVariables}
              canGenerate={generator.canGenerate}
            />
          )}

          {generator.step === 'generating' && (
            <GeneratingState
              progress={generator.progress}
              nQuestions={
                generator.selectedAnalysis === 'all'
                  ? generator.analysisVariables.length
                  : generator.selectedAnalysis.length
              }
              nBanners={generator.selectedBanners.length}
            />
          )}

          {generator.step === 'success' && generator.result && (
            <SuccessState
              result={generator.result}
              format={generator.format}
              onDownload={generator.downloadResult}
              onClose={handleClose}
            />
          )}

          {generator.step === 'error' && (
            <ErrorState
              error={generator.error || 'Unknown error'}
              onRetry={generator.retry}
              onClose={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
