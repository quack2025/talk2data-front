import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout';
import { ExportCard } from '@/components/exports/ExportCard';
import { CreateExportDialog } from '@/components/exports/CreateExportDialog';
import { useExports } from '@/hooks/useExports';
import type { Export } from '@/types/database';
import { useLanguage } from '@/i18n/LanguageContext';

export default function Exports() {
  const { exports, isLoading, deleteExport } = useExports();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { t } = useLanguage();

  const handleDelete = async (id: string) => {
    await deleteExport.mutateAsync(id);
  };

  const handleDownload = (export_: Export) => {
    // TODO: Implement download from S3
    console.log('Download:', export_.s3_key);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.exports.title}</h1>
            <p className="text-muted-foreground">
              {t.exports.subtitle}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t.exports.newExport}
          </Button>
        </div>

        {/* Exports Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[200px] rounded-lg border bg-card animate-pulse"
              />
            ))}
          </div>
        ) : exports.length === 0 ? (
          <div className="rounded-lg border bg-card">
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">{t.exports.noExports}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.exports.noExportsDescription}
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="mt-6 gap-2"
              >
                <Plus className="h-4 w-4" />
                {t.exports.newExport}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exports.map((export_) => (
              <ExportCard
                key={export_.id}
                export_={export_}
                onDelete={handleDelete}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </div>

      <CreateExportDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </AppLayout>
  );
}
