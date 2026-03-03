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
  Activity,
  BarChart3,
  Sparkles,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useDataPrep } from '@/hooks/useDataPrep';
import { DataPrepRuleDialog } from './DataPrepRuleDialog';
import type { RulePrefill } from './DataPrepRuleDialog';
import { DataPrepPreview } from './DataPrepPreview';
import { DataPrepAIInput } from './DataPrepAIInput';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import type { DataPrepRule, DataPrepRuleCreate, DataPrepRuleType, DataPrepPreviewResponse, QCReportResponse, VariableProfilesResponse, PrepSuggestionsResponse } from '@/types/dataPrep';
import type { VariableLabelMap } from '@/hooks/useProjectVariables';
import { toast } from 'sonner';

interface DataPrepManagerProps {
  projectId: string;
  availableVariables?: string[];
  variableLabels?: VariableLabelMap;
  onStatusChange?: (status: 'pending' | 'confirmed' | 'skipped') => void;
  externalPrefill?: RulePrefill | null;
  onExternalPrefillConsumed?: () => void;
}

const RULE_TYPE_ICONS: Record<DataPrepRuleType, React.ElementType> = {
  cleaning: Eraser,
  weight: Scale,
  net: Network,
  recode: ArrowLeftRight,
  computed: Calculator,
  exclude_columns: EyeOff,
};

export function DataPrepManager({ projectId, availableVariables = [], variableLabels = {}, onStatusChange, externalPrefill, onExternalPrefillConsumed }: DataPrepManagerProps) {
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
    getQCReport,
    getVariableProfiles,
    getSuggestions,
    applySuggestions,
  } = useDataPrep(projectId);

  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<DataPrepRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<DataPrepRule | null>(null);
  const [rulePrefill, setRulePrefill] = useState<RulePrefill | null>(null);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // V2 panel state
  const [qcReport, setQcReport] = useState<QCReportResponse | null>(null);
  const [qcLoading, setQcLoading] = useState(false);
  const [qcOpen, setQcOpen] = useState(false);
  const [profiles, setProfiles] = useState<VariableProfilesResponse | null>(null);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesOpen, setProfilesOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PrepSuggestionsResponse | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<Set<string>>(new Set());
  const [applyingLoading, setApplyingLoading] = useState(false);

  // Consume external prefill (e.g., from Data Explorer tab context menu)
  useEffect(() => {
    if (externalPrefill) {
      setEditingRule(null);
      setRulePrefill(externalPrefill);
      setShowDialog(true);
      onExternalPrefillConsumed?.();
    }
  }, [externalPrefill]);

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

  // V2 panel handlers
  const handleRunQC = async () => {
    setQcLoading(true);
    try {
      const res = await getQCReport();
      setQcReport(res);
      setQcOpen(true);
    } catch {
      toast.error('Error running QC check');
    } finally {
      setQcLoading(false);
    }
  };

  const handleProfileVars = async () => {
    setProfilesLoading(true);
    try {
      const res = await getVariableProfiles();
      setProfiles(res);
      setProfilesOpen(true);
    } catch {
      toast.error('Error profiling variables');
    } finally {
      setProfilesLoading(false);
    }
  };

  const handleGetSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      const res = await getSuggestions();
      setSuggestions(res);
      setSelectedSuggestionIds(new Set());
      setSuggestionsOpen(true);
    } catch {
      toast.error('Error loading suggestions');
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleApplySelected = async () => {
    if (selectedSuggestionIds.size === 0) return;
    setApplyingLoading(true);
    try {
      const res = await applySuggestions(Array.from(selectedSuggestionIds));
      toast.success(`${res.rules_created} ${dp?.v2SuggestionsApplied || 'suggestions applied as rules'}`);
      setSuggestions(null);
      setSuggestionsOpen(false);
      setSelectedSuggestionIds(new Set());
    } catch {
      toast.error('Error applying suggestions');
    } finally {
      setApplyingLoading(false);
    }
  };

  const toggleSuggestionId = (id: string) => {
    setSelectedSuggestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

          {/* V2 Panels */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleRunQC} disabled={qcLoading}>
              {qcLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
              {dp?.v2RunQC || 'Run quality check'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleProfileVars} disabled={profilesLoading}>
              {profilesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
              {dp?.v2ProfileVars || 'Profile variables'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleGetSuggestions} disabled={suggestionsLoading}>
              {suggestionsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {dp?.v2GetSuggestions || 'Get suggestions'}
            </Button>
          </div>

          {/* Panel A: Data Quality (QC Report) */}
          {qcReport && (
            <Collapsible open={qcOpen} onOpenChange={setQcOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">{dp?.v2QCTitle || 'Quality Control'}</span>
                      <Badge
                        variant={qcReport.overall_quality === 'good' ? 'default' : 'secondary'}
                        className={
                          qcReport.overall_quality === 'good' ? 'bg-green-600 hover:bg-green-700' :
                          qcReport.overall_quality === 'acceptable' ? 'bg-amber-500 hover:bg-amber-600' :
                          'bg-red-600 hover:bg-red-700'
                        }
                      >
                        {qcReport.overall_quality === 'good' ? (dp?.v2OverallGood || 'Good quality') :
                         qcReport.overall_quality === 'acceptable' ? (dp?.v2OverallAcceptable || 'Acceptable quality') :
                         (dp?.v2OverallPoor || 'Poor quality')}
                      </Badge>
                    </div>
                    {qcOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-3 px-4 space-y-2">
                    <p className="text-sm text-muted-foreground">{qcReport.recommendation}</p>
                    <div className="space-y-1.5">
                      {qcReport.checks.map((check, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm border rounded-md px-3 py-2">
                          {check.status === 'ok' ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> :
                           check.status === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" /> :
                           <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{check.check_type}</span>
                              <span className="text-muted-foreground">{check.description}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{check.flagged_count}/{check.total_cases} {dp?.v2FlaggedCases || 'flagged cases'} ({check.pct_flagged}%)</span>
                            </div>
                            {check.suggested_action && (
                              <p className="text-xs text-muted-foreground mt-0.5 italic">{check.suggested_action}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Panel B: Variable Profiles */}
          {profiles && (
            <Collapsible open={profilesOpen} onOpenChange={setProfilesOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">{dp?.v2ProfilesTitle || 'Variable Profiles'}</span>
                      <Badge variant="secondary">{profiles.summary.total_variables}</Badge>
                    </div>
                    {profilesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-3 px-4 space-y-3">
                    {/* Summary badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {profiles.summary.likert_scales > 0 && <Badge variant="outline">{profiles.summary.likert_scales} Likert</Badge>}
                      {profiles.summary.nps_variables > 0 && <Badge variant="outline">{profiles.summary.nps_variables} NPS</Badge>}
                      {profiles.summary.demographics > 0 && <Badge variant="outline">{profiles.summary.demographics} Demo</Badge>}
                      {profiles.summary.open_ended > 0 && <Badge variant="outline">{profiles.summary.open_ended} Open</Badge>}
                      {profiles.summary.binary > 0 && <Badge variant="outline">{profiles.summary.binary} Binary</Badge>}
                      {profiles.summary.multi_response_groups > 0 && <Badge variant="outline">{profiles.summary.multi_response_groups} MRS</Badge>}
                      {profiles.summary.grids > 0 && <Badge variant="outline">{profiles.summary.grids} Grid</Badge>}
                      {profiles.summary.categorical_nominal > 0 && <Badge variant="outline">{profiles.summary.categorical_nominal} Categ.</Badge>}
                      {profiles.summary.continuous_scale > 0 && <Badge variant="outline">{profiles.summary.continuous_scale} Cont.</Badge>}
                      {profiles.summary.id_metadata > 0 && <Badge variant="outline">{profiles.summary.id_metadata} ID/Meta</Badge>}
                    </div>
                    {/* Profile list */}
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {profiles.profiles.map((p) => (
                        <div key={p.name} className="flex items-center gap-2 text-sm border rounded-md px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate">{p.name}</span>
                              {p.label && <span className="text-muted-foreground text-xs truncate">{p.label}</span>}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">{p.detected_type}</Badge>
                          <span className={`text-xs shrink-0 ${p.pct_missing > 10 ? 'text-red-600' : p.pct_missing > 5 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                            {p.pct_missing.toFixed(1)}% {dp?.v2Missing || 'missing'}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {dp?.v2Confidence || 'Confidence'}: {(p.confidence * 100).toFixed(0)}%
                          </span>
                          {p.suggested_actions.length > 0 && (
                            <div className="flex gap-1 shrink-0">
                              {p.suggested_actions.map((a, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{a}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Panel C: AI Suggestions */}
          {suggestions && (
            <Collapsible open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">{dp?.v2SuggestionsTitle || 'Prep Suggestions'}</span>
                      <Badge variant="secondary">{suggestions.total_suggestions}</Badge>
                    </div>
                    {suggestionsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-3 px-4 space-y-3">
                    {suggestions.suggestions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{dp?.v2NoSuggestions || 'No suggestions available'}</p>
                    ) : (
                      <>
                        <div className="space-y-2">
                          {suggestions.suggestions.map((s) => (
                            <div key={s.id} className="border rounded-md px-3 py-2 space-y-1">
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  checked={selectedSuggestionIds.has(s.id)}
                                  onCheckedChange={() => toggleSuggestionId(s.id)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge
                                      variant="secondary"
                                      className={
                                        s.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                        s.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                      }
                                    >
                                      {s.priority}
                                    </Badge>
                                    <span className="text-sm font-medium">{s.title}</span>
                                    <Badge variant="outline" className="text-xs">{s.category}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
                                  <details className="mt-1">
                                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                      Reasoning
                                    </summary>
                                    <p className="text-xs text-muted-foreground mt-1 pl-2 border-l-2">{s.reasoning}</p>
                                  </details>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          onClick={handleApplySelected}
                          disabled={selectedSuggestionIds.size === 0 || applyingLoading}
                        >
                          {applyingLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                          {dp?.v2ApplySelected || 'Apply selected'} ({selectedSuggestionIds.size})
                        </Button>
                      </>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

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
