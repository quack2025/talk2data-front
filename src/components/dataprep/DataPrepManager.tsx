import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  SlidersHorizontal,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronUp,
  ChevronDown,
  Eye,
  Eraser,
  Scale,
  Network,
  ArrowLeftRight,
  Calculator,
  CheckCircle2,
  SkipForward,
  RotateCcw,
  EyeOff,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useDataPrep } from '@/hooks/useDataPrep';
import { DataPrepRuleDialog } from './DataPrepRuleDialog';
import type { RulePrefill } from './DataPrepRuleDialog';
import { DataPrepPreview } from './DataPrepPreview';
import { DataPrepAIInput } from './DataPrepAIInput';
import type { DataPrepRule, DataPrepRuleCreate, DataPrepRuleType, DataPrepPreviewResponse } from '@/types/dataPrep';
import type { VariableLabelMap } from '@/hooks/useProjectVariables';
import { toast } from 'sonner';

interface DataPrepManagerProps {
  projectId: string;
  availableVariables?: string[];
  variableLabels?: VariableLabelMap;
  onStatusChange?: (status: 'pending' | 'confirmed' | 'skipped') => void;
}

const RULE_TYPE_ICONS: Record<DataPrepRuleType, React.ElementType> = {
  cleaning: Eraser,
  weight: Scale,
  net: Network,
  recode: ArrowLeftRight,
  computed: Calculator,
  exclude_columns: EyeOff,
};

export function DataPrepManager({ projectId, availableVariables = [], variableLabels = {}, onStatusChange }: DataPrepManagerProps) {
  const { t } = useLanguage();
  const dp = t.dataPrep;
  const {
    rules,
    isLoading,
    preview,
    isPreviewLoading,
    error,
    dataPrepStatus,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    reorderRules,
    previewRules,
    clearPreview,
    confirmDataReady,
    skipDataPrep,
    reopenDataPrep,
  } = useDataPrep(projectId);

  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<DataPrepRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<DataPrepRule | null>(null);
  const [rulePrefill, setRulePrefill] = useState<RulePrefill | null>(null);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleSave = async (data: DataPrepRuleCreate) => {
    if (editingRule) {
      await updateRule(editingRule.id, data);
      toast.success(dp?.ruleUpdated || 'Regla actualizada');
    } else {
      await createRule(data);
      toast.success(dp?.ruleCreated || 'Regla creada');
    }
  };

  const handlePreview = async (data: DataPrepRuleCreate) => {
    // Temporarily create/update, preview, then revert if needed
    // For now, use the global preview endpoint
    const response = await api.post<DataPrepPreviewResponse>(
      `/projects/${projectId}/data-prep/preview`,
      { rule: data }
    );
    return response;
  };

  const handleDelete = async () => {
    if (!deletingRule) return;
    try {
      await deleteRule(deletingRule.id);
      toast.success(dp?.ruleDeleted || 'Regla eliminada');
    } finally {
      setDeletingRule(null);
    }
  };

  const handleToggleActive = async (rule: DataPrepRule) => {
    await updateRule(rule.id, { is_active: !rule.is_active });
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...rules];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    await reorderRules(newOrder.map((r) => r.id));
  };

  const handleMoveDown = async (index: number) => {
    if (index === rules.length - 1) return;
    const newOrder = [...rules];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    await reorderRules(newOrder.map((r) => r.id));
  };

  const openCreate = () => {
    setEditingRule(null);
    setRulePrefill(null);
    setShowDialog(true);
  };

  const openCreateWithPrefill = (prefill: RulePrefill) => {
    setEditingRule(null);
    setRulePrefill(prefill);
    setShowDialog(true);
  };

  const openEdit = (rule: DataPrepRule) => {
    setEditingRule(rule);
    setRulePrefill(null);
    setShowDialog(true);
  };

  const ruleTypeLabel = (type: DataPrepRuleType) => {
    const labels: Record<DataPrepRuleType, string> = {
      cleaning: dp?.typeCleaning || 'Cleaning',
      weight: dp?.typeWeight || 'Weight',
      net: dp?.typeNet || 'Net',
      recode: dp?.typeRecode || 'Recode',
      computed: dp?.typeComputed || 'Computed',
      exclude_columns: dp?.typeExcludeColumns || 'Exclude Columns',
    };
    return labels[type];
  };

  const activeCount = rules.filter((r) => r.is_active).length;

  const dt = (dp as Record<string, unknown>).dataTab as Record<string, string> | undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {dp?.title || 'Preparación de Datos'}
          </h2>
          {rules.length > 0 && (
            <Badge variant="secondary">
              {activeCount}/{rules.length} {dp?.activeLabel || 'activas'}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {rules.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={previewRules}
              disabled={isPreviewLoading || activeCount === 0}
            >
              {isPreviewLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              {dp?.preview || 'Vista previa'}
            </Button>
          )}
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {dp?.addRule || 'Agregar regla'}
          </Button>
        </div>
      </div>

      {/* Rules content (no more internal tabs) */}
      <div className="space-y-4 mt-3">
          {/* AI Input */}
          <DataPrepAIInput projectId={projectId} onRuleCreated={fetchRules} availableVariables={availableVariables} variableLabels={variableLabels} />

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="relative">
              <DataPrepPreview preview={preview} />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 text-xs"
                onClick={clearPreview}
              >
                {t.common.close}
              </Button>
            </div>
          )}

          {/* Rules list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <SlidersHorizontal className="h-10 w-10 text-muted-foreground" />
                <div className="text-center space-y-1">
                  <p className="font-medium text-muted-foreground">
                    {dp?.noRules || 'No hay reglas configuradas'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dp?.noRulesHint || 'Agrega reglas para limpiar, ponderar o recodificar datos'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {rules.map((rule, index) => {
                const Icon = RULE_TYPE_ICONS[rule.rule_type];
                return (
                  <Card key={rule.id} className={!rule.is_active ? 'opacity-60' : ''}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => handleMoveDown(index)}
                              disabled={index === rules.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium flex items-center gap-2">
                              {rule.name}
                              <Badge variant="outline" className="text-xs">
                                {ruleTypeLabel(rule.rule_type)}
                              </Badge>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              #{rule.order_index}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => handleToggleActive(rule)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => openEdit(rule)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeletingRule(rule)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
      </div>

      {/* Data Readiness Gate Footer */}
      <div className="mt-4">
        {dataPrepStatus === 'pending' ? (
          <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
            <CardContent className="py-4 px-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    {dp?.gateBanner || 'Revisa y confirma la preparación de datos antes de iniciar el análisis'}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="border-amber-400 bg-white hover:bg-amber-100 text-amber-800 dark:border-amber-600 dark:bg-amber-900/50 dark:text-amber-200 dark:hover:bg-amber-900"
                    onClick={() => setShowSkipConfirm(true)}
                  >
                    <SkipForward className="mr-2 h-4 w-4" />
                    {dp?.skipPrep || 'No requiere preparación — continuar'}
                  </Button>
                  {rules.length > 0 && (
                    <Button
                      onClick={() => {
                        confirmDataReady();
                        onStatusChange?.('confirmed');
                        toast.success(dp?.statusConfirmed || 'Datos confirmados');
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {dp?.confirmReady || 'Confirmar datos listos'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2">
              <Badge variant={dataPrepStatus === 'confirmed' ? 'default' : 'secondary'} className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {dataPrepStatus === 'confirmed'
                  ? (dp?.statusConfirmed || 'Datos confirmados')
                  : (dp?.statusSkipped || 'Sin preparación requerida')}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                reopenDataPrep();
                onStatusChange?.('pending');
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {dp?.reopenPrep || 'Reabrir preparación'}
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit dialog */}
      <DataPrepRuleDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        editingRule={editingRule}
        prefill={rulePrefill}
        onSave={handleSave}
        onPreview={handlePreview}
        availableVariables={availableVariables}
        variableLabels={variableLabels}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingRule}
        onOpenChange={(open) => !open && setDeletingRule(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dp?.deleteConfirmTitle || '¿Eliminar regla?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dp?.deleteConfirmDescription ||
                'Esta acción eliminará la regla permanentemente.'}
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

      {/* Skip confirmation */}
      <AlertDialog
        open={showSkipConfirm}
        onOpenChange={setShowSkipConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dp?.skipConfirmTitle || '¿Confirmar sin preparación?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dp?.skipConfirmDescription ||
                'Al continuar sin reglas de preparación, el análisis usará los datos tal como fueron cargados.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              skipDataPrep();
              onStatusChange?.('skipped');
              setShowSkipConfirm(false);
              toast.success(dp?.statusSkipped || 'Sin preparación requerida');
            }}>
              {t.common.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
