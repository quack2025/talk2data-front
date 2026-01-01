import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, Loader2, FileSpreadsheet, Brain, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface ProcessingStep {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'pending' | 'processing' | 'completed';
}

interface ProcessingModalProps {
  open: boolean;
  onComplete: () => void;
}

export function ProcessingModal({ open, onComplete }: ProcessingModalProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'upload', label: 'Subiendo archivo', icon: FileSpreadsheet, status: 'pending' },
    { id: 'parse', label: 'Analizando estructura SPSS', icon: Database, status: 'pending' },
    { id: 'index', label: 'Indexando variables', icon: Brain, status: 'pending' },
  ]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setSteps((prev) => prev.map((s) => ({ ...s, status: 'pending' })));
      setProgress(0);
      return;
    }

    const stepDurations = [1500, 2000, 1500];
    let currentStep = 0;

    const processStep = () => {
      if (currentStep >= steps.length) {
        setTimeout(onComplete, 500);
        return;
      }

      setSteps((prev) =>
        prev.map((s, i) => ({
          ...s,
          status: i === currentStep ? 'processing' : i < currentStep ? 'completed' : 'pending',
        }))
      );

      const duration = stepDurations[currentStep];
      const startProgress = (currentStep / steps.length) * 100;
      const endProgress = ((currentStep + 1) / steps.length) * 100;
      const progressIncrement = (endProgress - startProgress) / (duration / 50);

      let currentProgress = startProgress;
      const progressInterval = setInterval(() => {
        currentProgress += progressIncrement;
        if (currentProgress >= endProgress) {
          clearInterval(progressInterval);
          setProgress(endProgress);
          setSteps((prev) =>
            prev.map((s, i) => ({
              ...s,
              status: i <= currentStep ? 'completed' : s.status,
            }))
          );
          currentStep++;
          setTimeout(processStep, 300);
        } else {
          setProgress(currentProgress);
        }
      }, 50);
    };

    setTimeout(processStep, 500);
  }, [open, onComplete]);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-center">Procesando archivo</DialogTitle>
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
