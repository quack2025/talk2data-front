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
import { ConfigureStep } from './ConfigureStep';
import { PreviewStep } from './PreviewStep';
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
        return { step: 1, total: 4 };
      case 'stubs':
        return { step: 2, total: 4 };
      case 'configure':
        return { step: 3, total: 4 };
      case 'preview':
        return { step: 4, total: 4 };
      default:
        return null;
    }
  };

  const stepInfo = getStepInfo();

  const analysisCount =
    generator.selectedAnalysis === 'all'
      ? generator.analysisVariables.length
      : generator.selectedAnalysis.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg h-[80vh] max-h-[700px] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>
              {t.aggfile?.title || 'Generar Tablas Cruzadas'}
            </DialogTitle>
            {stepInfo && (
              <span className="text-sm text-muted-foreground">
                {t.aggfile?.step || 'Paso'} {stepInfo.step}/{stepInfo.total}
              </span>
            )}
          </div>
          {stepInfo && (
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
              canProceed={generator.canProceedToStubs}
            />
          )}

          {generator.step === 'stubs' && (
            <AnalysisVariablesStep
              variables={generator.analysisVariables}
              selectedAnalysis={generator.selectedAnalysis}
              isLoading={generator.isLoadingAnalysis}
              onToggle={generator.toggleAnalysis}
              onSetMode={generator.setAnalysisMode}
              onBack={generator.goToPrevStep}
              onNext={generator.goToNextStep}
              onFetch={generator.fetchAnalysisVariables}
              canProceed={generator.canProceedToConfigure}
            />
          )}

          {generator.step === 'configure' && (
            <ConfigureStep
              projectId={projectId}
              analysisTypes={generator.analysisTypes}
              format={generator.format}
              title={generator.title}
              currentConfig={generator.buildConfig()}
              onToggleAnalysisType={generator.toggleAnalysisType}
              onSetValueType={generator.setValueType}
              onSetDecimalPlaces={generator.setDecimalPlaces}
              onSetIncludeBases={generator.setIncludeBases}
              onSetIncludeSignificance={generator.setIncludeSignificance}
              onSetSignificanceLevel={generator.setSignificanceLevel}
              onSetTitle={generator.setTitle}
              onBack={generator.goToPrevStep}
              onNext={generator.goToNextStep}
              canProceed={generator.canProceedToPreview}
            />
          )}

          {generator.step === 'preview' && (
            <PreviewStep
              preview={generator.preview}
              isLoading={generator.isLoadingPreview}
              error={generator.error}
              selectedBannersCount={generator.selectedBanners.length}
              selectedAnalysisCount={analysisCount}
              onFetchPreview={generator.fetchPreview}
              onBack={generator.goToPrevStep}
              onGenerate={generator.generateTables}
              onExportExcel={generator.exportToExcel}
              canGenerate={generator.canGenerate}
            />
          )}

          {generator.step === 'generating' && (
            <GeneratingState
              progress={generator.progress}
              nQuestions={analysisCount}
              nBanners={generator.selectedBanners.length}
            />
          )}

          {generator.step === 'success' && (
            <SuccessState
              result={generator.result}
              generateTablesResult={generator.generateTablesResult}
              format={generator.format}
              onDownload={generator.downloadResult}
              onExportExcel={generator.exportToExcel}
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
