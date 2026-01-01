import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, FileSpreadsheet, FileText } from 'lucide-react';
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

export default function ProjectUpload() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [spssFile, setSpssFile] = useState<File | null>(null);
  const [questionnaireFile, setQuestionnaireFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = () => {
    if (!spssFile) return;
    setIsProcessing(true);
  };

  const handleProcessingComplete = () => {
    setIsProcessing(false);
    navigate(`/project/${projectId}/chat`);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">Proyectos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/project/${projectId}`}>Proyecto</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Subir archivos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subir archivos</h1>
          <p className="text-muted-foreground mt-1">
            Sube tu archivo SPSS para comenzar a analizar los datos
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="font-medium">Subir archivos</span>
          </div>
          <div className="h-px flex-1 bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="text-muted-foreground">Analizar datos</span>
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
                  <CardTitle className="text-lg">Archivo SPSS</CardTitle>
                  <CardDescription>Requerido - Archivo .sav con los datos de la encuesta</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FileDropZone
                accept={{ 'application/x-spss-sav': ['.sav'] }}
                title="Arrastra tu archivo SPSS aquí"
                description="Formatos soportados: .sav (máx. 100MB)"
                icon="spss"
                onFileSelect={setSpssFile}
                selectedFile={spssFile}
                onRemove={() => setSpssFile(null)}
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
                  <CardTitle className="text-lg">Cuestionario</CardTitle>
                  <CardDescription>Opcional - PDF o Word con el cuestionario original</CardDescription>
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
                title="Arrastra tu cuestionario aquí"
                description="Formatos soportados: .pdf, .doc, .docx"
                icon="document"
                onFileSelect={setQuestionnaireFile}
                selectedFile={questionnaireFile}
                onRemove={() => setQuestionnaireFile(null)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/project/${projectId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!spssFile}
            className="gap-2"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ProcessingModal
        open={isProcessing}
        onComplete={handleProcessingComplete}
      />
    </AppLayout>
  );
}
