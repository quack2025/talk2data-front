import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Upload, FileSpreadsheet, FileText, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/i18n/LanguageContext';

interface FileDropZoneProps {
  accept: Record<string, string[]>;
  title: string;
  description: string;
  icon: 'spss' | 'document';
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onRemove: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function FileDropZone({
  accept,
  title,
  description,
  icon,
  onFileSelect,
  selectedFile,
  onRemove,
  isUploading,
  uploadProgress = 0,
}: FileDropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const { t } = useLanguage();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    disabled: isUploading,
  });

  const Icon = icon === 'spss' ? FileSpreadsheet : FileText;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (selectedFile) {
    return (
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(selectedFile.size)}
            </p>
            {isUploading && (
              <div className="mt-2">
                <Progress value={uploadProgress} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-1">
                  {t.upload.uploading} {uploadProgress}%
                </p>
              </div>
            )}
          </div>
          {!isUploading && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {!isUploading && (
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200',
        isDragActive
          ? 'border-primary bg-primary/5 scale-[1.02]'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            'h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-200',
            isDragActive ? 'bg-primary/20' : 'bg-muted'
          )}
        >
          {isDragActive ? (
            <Upload className="h-8 w-8 text-primary animate-bounce" />
          ) : (
            <Icon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <Button variant="outline" size="sm" className="mt-2">
          {t.upload.selectFile}
        </Button>
      </div>
    </div>
  );
}
