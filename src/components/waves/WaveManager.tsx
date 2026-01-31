import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Waves,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GitCompare,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useWaves } from '@/hooks/useWaves';
import { WaveComparisonChart } from './WaveComparisonChart';
import type { ProjectWave, WaveCreate } from '@/types/waves';
import { toast } from 'sonner';

interface WaveManagerProps {
  projectId: string;
  availableFiles: { id: string; name: string }[];
  availableVariables: string[];
}

export function WaveManager({
  projectId,
  availableFiles,
  availableVariables,
}: WaveManagerProps) {
  const { t } = useLanguage();
  const wavesT = t.waves;
  const {
    waves,
    isLoading,
    isComparing,
    comparisonResult,
    error,
    fetchWaves,
    createWave,
    updateWave,
    deleteWave,
    compareWaves,
    clearComparison,
  } = useWaves(projectId);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWave, setEditingWave] = useState<ProjectWave | null>(null);
  const [deletingWave, setDeletingWave] = useState<ProjectWave | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formOrder, setFormOrder] = useState(1);
  const [formFileId, setFormFileId] = useState<string>('');
  const [formDescription, setFormDescription] = useState('');
  const [formDateStart, setFormDateStart] = useState('');
  const [formDateEnd, setFormDateEnd] = useState('');

  // Compare state
  const [compareVariable, setCompareVariable] = useState('');
  const [compareAnalysisType, setCompareAnalysisType] = useState('frequency');
  const [selectedWaveIds, setSelectedWaveIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWaves();
  }, [fetchWaves]);

  const resetForm = () => {
    setFormName('');
    setFormOrder(waves.length + 1);
    setFormFileId('');
    setFormDescription('');
    setFormDateStart('');
    setFormDateEnd('');
  };

  const openCreate = () => {
    resetForm();
    setFormOrder(waves.length + 1);
    setEditingWave(null);
    setShowCreateDialog(true);
  };

  const openEdit = (wave: ProjectWave) => {
    setFormName(wave.wave_name);
    setFormOrder(wave.wave_order);
    setFormFileId(wave.file_id || '');
    setFormDescription(wave.description || '');
    setFormDateStart(wave.field_dates?.start || '');
    setFormDateEnd(wave.field_dates?.end || '');
    setEditingWave(wave);
    setShowCreateDialog(true);
  };

  const handleSave = async () => {
    const data: WaveCreate = {
      wave_name: formName.trim(),
      wave_order: formOrder,
      file_id: formFileId || null,
      description: formDescription.trim() || null,
      field_dates:
        formDateStart || formDateEnd
          ? { start: formDateStart || undefined, end: formDateEnd || undefined }
          : null,
    };

    try {
      if (editingWave) {
        await updateWave(editingWave.id, data);
        toast.success(wavesT?.waveUpdated || 'Wave actualizada');
      } else {
        await createWave(data);
        toast.success(wavesT?.waveCreated || 'Wave creada');
      }
      setShowCreateDialog(false);
    } catch {
      // error is set by the hook
    }
  };

  const handleDelete = async () => {
    if (!deletingWave) return;
    try {
      await deleteWave(deletingWave.id);
      toast.success(wavesT?.waveDeleted || 'Wave eliminada');
    } finally {
      setDeletingWave(null);
    }
  };

  const toggleWaveForCompare = (waveId: string) => {
    setSelectedWaveIds((prev) => {
      const next = new Set(prev);
      if (next.has(waveId)) {
        next.delete(waveId);
      } else {
        next.add(waveId);
      }
      return next;
    });
  };

  const handleCompare = async () => {
    if (selectedWaveIds.size < 2 || !compareVariable) return;
    await compareWaves({
      variable: compareVariable,
      wave_ids: Array.from(selectedWaveIds),
      analysis_type: compareAnalysisType,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {wavesT?.title || 'Waves / Tracking'}
          </h2>
          {waves.length > 0 && (
            <Badge variant="secondary">{waves.length}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          {waves.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompare(!showCompare)}
            >
              <GitCompare className="mr-2 h-4 w-4" />
              {wavesT?.compare || 'Comparar'}
            </Button>
          )}
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {wavesT?.addWave || 'Agregar wave'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Compare panel */}
      {showCompare && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">
              {wavesT?.compareTitle || 'Comparar waves'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">
                  {wavesT?.variable || 'Variable'}
                </Label>
                <Select value={compareVariable} onValueChange={setCompareVariable}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={wavesT?.selectVariable || 'Seleccionar variable'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVariables.map((v) => (
                      <SelectItem key={v} value={v} className="text-xs font-mono">
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  {wavesT?.analysisType || 'Tipo de análisis'}
                </Label>
                <Select
                  value={compareAnalysisType}
                  onValueChange={setCompareAnalysisType}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frequency">Frecuencia</SelectItem>
                    <SelectItem value="mean">Media</SelectItem>
                    <SelectItem value="nps">NPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                {wavesT?.selectWaves || 'Seleccionar waves'} ({selectedWaveIds.size})
              </Label>
              <div className="flex flex-wrap gap-1">
                {waves.map((w) => (
                  <Badge
                    key={w.id}
                    variant={selectedWaveIds.has(w.id) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleWaveForCompare(w.id)}
                  >
                    {w.wave_name}
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleCompare}
              disabled={selectedWaveIds.size < 2 || !compareVariable || isComparing}
            >
              {isComparing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GitCompare className="mr-2 h-4 w-4" />
              )}
              {wavesT?.runComparison || 'Ejecutar comparación'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Comparison result */}
      {comparisonResult && (
        <WaveComparisonChart
          result={comparisonResult}
          onClose={clearComparison}
        />
      )}

      {/* Waves list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : waves.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Waves className="h-10 w-10 text-muted-foreground" />
            <div className="text-center space-y-1">
              <p className="font-medium text-muted-foreground">
                {wavesT?.noWaves || 'No hay waves configuradas'}
              </p>
              <p className="text-sm text-muted-foreground">
                {wavesT?.noWavesHint ||
                  'Agrega waves para comparar datos de tracking'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {waves.map((wave) => (
            <Card key={wave.id}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{wave.wave_order}
                      </Badge>
                      {wave.wave_name}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {wave.field_dates?.start && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {wave.field_dates.start}
                          {wave.field_dates.end && ` - ${wave.field_dates.end}`}
                        </span>
                      )}
                      {wave.file_id && (
                        <span className="flex items-center gap-1">
                          <FileSpreadsheet className="h-3 w-3" />
                          {wavesT?.fileLinked || 'Archivo vinculado'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => openEdit(wave)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => setDeletingWave(wave)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingWave
                ? wavesT?.editWave || 'Editar wave'
                : wavesT?.addWave || 'Agregar wave'}
            </DialogTitle>
            <DialogDescription>
              {wavesT?.waveDialogDescription ||
                'Configura los datos de esta ola del tracking'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="wave-name" className="text-xs">
                  {wavesT?.waveName || 'Nombre'}
                </Label>
                <Input
                  id="wave-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Wave 1 - Enero 2026"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wave-order" className="text-xs">
                  {wavesT?.order || 'Orden'}
                </Label>
                <Input
                  id="wave-order"
                  type="number"
                  min={1}
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">
                {wavesT?.associatedFile || 'Archivo asociado'}
              </Label>
              <Select value={formFileId} onValueChange={setFormFileId}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder={wavesT?.selectFile || 'Seleccionar archivo'} />
                </SelectTrigger>
                <SelectContent>
                  {availableFiles.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-sm">
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">
                  {wavesT?.fieldStart || 'Inicio campo'}
                </Label>
                <Input
                  type="date"
                  value={formDateStart}
                  onChange={(e) => setFormDateStart(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  {wavesT?.fieldEnd || 'Fin campo'}
                </Label>
                <Input
                  type="date"
                  value={formDateEnd}
                  onChange={(e) => setFormDateEnd(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">
                {wavesT?.description || 'Descripción (opcional)'}
              </Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Ej: Estudio de tracking mensual"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              {t.common.cancel}
            </Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingWave}
        onOpenChange={(open) => !open && setDeletingWave(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {wavesT?.deleteConfirmTitle || '¿Eliminar wave?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {wavesT?.deleteConfirmDescription ||
                'Esta acción eliminará la wave permanentemente.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
