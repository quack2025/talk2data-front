import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

interface CodebookImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => void;
  isImporting?: boolean;
}

export function CodebookImportDialog({
  open,
  onOpenChange,
  onImport,
  isImporting,
}: CodebookImportDialogProps) {
  const { t } = useLanguage();
  const meta = t.dataPrep?.metadata;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) setSelectedFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  const handleImport = () => {
    if (selectedFile) onImport(selectedFile);
  };

  const handleClose = (val: boolean) => {
    if (!val) setSelectedFile(null);
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{meta?.importCodebook || 'Import Codebook'}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {meta?.importDescription || 'Upload an Excel or CSV file with variable labels'}
          </p>
        </DialogHeader>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
        >
          <input {...getInputProps()} />
          {selectedFile ? (
            <div className="flex items-center justify-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {meta?.dropCodebook || 'Drop codebook file here (.csv, .xlsx)'}
              </p>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">{meta?.formatTitle || 'Supported formats:'}</p>
          <p>{meta?.formatSimple || 'Simple: columns [variable_name, label]'}</p>
          <p>{meta?.formatFull || 'Full: columns [variable_name, label, value, value_label]'}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            {t.common?.cancel || 'Cancel'}
          </Button>
          <Button onClick={handleImport} disabled={!selectedFile || isImporting}>
            {isImporting
              ? (meta?.importing || 'Importing...')
              : (meta?.importButton || 'Import')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
