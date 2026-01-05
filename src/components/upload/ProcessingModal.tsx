import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, Loader2, FileSpreadsheet, Brain, Database, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/i18n/LanguageContext';

interface ProcessingStep {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'pending' | 'processing' | 'completed';
}

type UploadStep = 'idle' | 'uploading-spss' | 'uploading-questionnaire' | 'processing';

interface ProcessingModalProps {
  open: boolean;
  onComplete: () => void;
  currentStep?: UploadStep;
  hasQuestionnaire?: boolean;
}

export function ProcessingModal({ 
  open, 
  onComplete, 
  currentStep = 'idle',
  hasQuestionnaire = false 
}: ProcessingModalProps) {
  const { t } = useLanguage();
  
  // Build steps dynamically based on whether there's a questionnaire
  const getSteps = (): ProcessingStep[] => {
    const baseSteps: ProcessingStep[] = [
      { 
        id: 'uploading-spss', 
        label: t.processing?.uploadingSpss || 'Subiendo archivo SPSS', 
        icon: FileSpreadsheet, 
        status: 'pending' 
      },
    ];

    if (hasQuestionnaire) {
      baseSteps.push({
        id: 'uploading-questionnaire',
        label: t.processing?.uploadingQuestionnaire || 'Subiendo cuestionario',
        icon: FileText,
        status: 'pending',
      });
    }

    baseSteps.push(
      { 
        id: 'processing', 
        label: t.processing?.analyzing || 'Analizando estructura SPSS', 
        icon: Database, 
        status: 'pending' 
      },
      { 
        id: 'indexing', 
        label: t.processing?.indexing || 'Indexando variables', 
        icon: Brain, 
        status: 'pending' 
      }
    );

    return baseSteps;
  };

  const [steps, setSteps] = useState<ProcessingStep[]>(getSteps());
  const [progress, setProgress] = useState(0);

  // Update steps when hasQuestionnaire changes
  useEffect(() => {
    if (open) {
      setSteps(getSteps());
    }
  }, [hasQuestionnaire, open]);

  // Update step statuses based on currentStep
  useEffect(() => {
    if (!open) {
      setSteps(getSteps().map(s => ({ ...s, status: 'pending' })));
      setProgress(0);
      return;
    }

    const stepIds = steps.map(s => s.id);
    const currentIndex = stepIds.indexOf(currentStep);

    if (currentIndex === -1) return;

    setSteps(prev => prev.map((step, index) => ({
      ...step,
      status: index < currentIndex 
        ? 'completed' 
        : index === currentIndex 
          ? 'processing' 
          : 'pending'
    })));

    // Calculate progress
    const progressPercent = ((currentIndex + 0.5) / steps.length) * 100;
    setProgress(progressPercent);

    // If we're on the last processing step, simulate completion
    if (currentStep === 'processing') {
      const timer = setTimeout(() => {
        setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
        setProgress(100);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [open, currentStep, steps.length]);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t.processing?.title || 'Procesando archivo'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <Progress value={progress} className="h-2" />

          <div className="space-y-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-4 p-3 rounded-lg transition-all duration-300',
                    step.status === 'processing' && 'bg-primary/10',
                    step.status === 'completed' && 'opacity-60'
                  )}
                >
                  <div
                    className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300',
                      step.status === 'pending' && 'bg-muted',
                      step.status === 'processing' && 'bg-primary/20',
                      step.status === 'completed' && 'bg-green-500/20'
                    )}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : step.status === 'processing' ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'font-medium transition-colors duration-300',
                      step.status === 'processing' && 'text-primary',
                      step.status === 'completed' && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
