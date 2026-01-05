import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, FileSpreadsheet, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout';
import { FileDropZone } from '@/components/upload/FileDropZone';
import { ProcessingModal } from '@/components/upload/ProcessingModal';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/i18n/LanguageContext';
import { useProjectFiles } from '@/hooks/useProjectFiles';
import { useToast } from '@/hooks/use-toast';
import { usePollSummary } from '@/hooks/useExecutiveSummary';

type UploadStep = 'idle' | 'uploading-spss' | 'uploading-questionnaire' | 'processing' | 'generating-summary';

export default function ProjectUpload() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [spssFile, setSpssFile] = useState<File | null>(null);
  const [questionnaireFile, setQuestionnaireFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  const [shouldPollSummary, setShouldPollSummary] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);
  const maxPollAttempts = 30; // 60 seconds max (2s intervals)
  
  const { t } = useLanguage();
  const { uploadFile } = useProjectFiles(projectId || '', {
    fileUploaded: t.toasts.fileUploaded,
    fileUploadedDesc: t.toasts.fileUploadedDesc,
    fileUploadError: t.toasts.fileUploadError,
    fileDeleted: t.toasts.fileDeleted,
  });
  const { toast } = useToast();

  // Poll for summary
  const { data: summary } = usePollSummary(projectId || '', shouldPollSummary);

  // Handle summary polling result
  useEffect(() => {
    if (!shouldPollSummary) return;

    if (summary) {
      // Summary is ready, navigate to summary page
      setIsProcessing(false);
      setShouldPollSummary(false);
      toast({
        title: t.projectUpload.uploadSuccess || 'Archivos procesados',
        description: t.projectUpload.uploadSuccessDesc || 'Los archivos han sido procesados correctamente.',
      });
      navigate(`/projects/${projectId}/summary`);
    } else {
      // Increment poll attempts
      setPollAttempts(prev => prev + 1);
    }
  }, [summary, shouldPollSummary, navigate, projectId, toast, t]);

  // Handle poll timeout
  useEffect(() => {
    if (pollAttempts >= maxPollAttempts && shouldPollSummary) {
      // Timeout - navigate to chat instead
      setIsProcessing(false);
      setShouldPollSummary(false);
      toast({
        title: t.projectUpload.uploadSuccess || 'Archivos procesados',
        description: 'El resumen se está generando en segundo plano.',
      });
      navigate(`/projects/${projectId}/chat`);
    }
  }, [pollAttempts, shouldPollSummary, navigate, projectId, toast, t]);

  const handleUpload = async () => {
    if (!spssFile || !projectId) return;
    
    setIsProcessing(true);
    setUploadError(null);
    setUploadStep('uploading-spss');
    setPollAttempts(0);

    try {
      // Upload SPSS file (required)
      await uploadFile.mutateAsync({
        file: spssFile,
        fileType: 'spss',
      });

      // Upload questionnaire if provided (optional)
      if (questionnaireFile) {
        setUploadStep('uploading-questionnaire');
        await uploadFile.mutateAsync({
          file: questionnaireFile,
          fileType: 'questionnaire',
        });
      }

      setUploadStep('processing');
      
      // Wait a bit for processing step animation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Start polling for summary
      setUploadStep('generating-summary');
      setShouldPollSummary(true);

    } catch (error) {
      setIsProcessing(false);
      setUploadStep('idle');
      setShouldPollSummary(false);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setUploadError(errorMessage);
      console.error('Upload error:', error);
    }
  };

  const handleProcessingComplete = () => {
    setIsProcessing(false);
    navigate(`/projects/${projectId}/summary`);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">{t.projects.title}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/projects/${projectId}`}>{t.projectUpload.project}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t.projectUpload.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.projectUpload.title}</h1>
          <p className="text-muted-foreground mt-1">
            {t.projectUpload.subtitle}
          </p>
        </div>

        {/* Error Alert */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Steps indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="font-medium">{t.projectUpload.step1}</span>
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="text-muted-foreground">{t.projectUpload.step2}</span>
          </div>
        </div>

        {/* Upload sections */}
        <div className="grid gap-6">
          {/* SPSS File (Required) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t.projectUpload.spssFile}</CardTitle>
                  <CardDescription>{t.projectUpload.spssRequired}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FileDropZone
                accept={{ 'application/x-spss-sav': ['.sav'] }}
                title={t.projectUpload.dropSpss}
                description={t.projectUpload.spssFormats}
                icon="spss"
                onFileSelect={setSpssFile}
                selectedFile={spssFile}
                onRemove={() => setSpssFile(null)}
                isUploading={isProcessing && uploadStep === 'uploading-spss'}
              />
            </CardContent>
          </Card>

          {/* Questionnaire (Optional) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t.projectUpload.questionnaire}</CardTitle>
                  <CardDescription>{t.projectUpload.questionnaireOptional}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FileDropZone
                accept={{
                  'application/pdf': ['.pdf'],
                  'application/msword': ['.doc'],
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                }}
                title={t.projectUpload.dropQuestionnaire}
                description={t.projectUpload.questionnaireFormats}
                icon="document"
                onFileSelect={setQuestionnaireFile}
                selectedFile={questionnaireFile}
                onRemove={() => setQuestionnaireFile(null)}
                isUploading={isProcessing && uploadStep === 'uploading-questionnaire'}
              />
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="gap-2"
            disabled={isProcessing}
          >
            <ArrowLeft className="h-4 w-4" />
            {t.projectUpload.back}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!spssFile || isProcessing}
            className="gap-2"
          >
            {isProcessing ? (
              <>Procesando...</>
            ) : (
              <>
                {t.projectUpload.continue}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      <ProcessingModal
        open={isProcessing}
        onComplete={handleProcessingComplete}
        currentStep={uploadStep}
        hasQuestionnaire={!!questionnaireFile}
      />
    </AppLayout>
  );
}
