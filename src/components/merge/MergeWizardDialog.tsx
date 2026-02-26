/**
 * MergeWizardDialog — multi-step wizard for dataset merging.
 *
 * Steps:
 * 1. Select source projects
 * 2. Choose merge type + configuration
 * 3. Validate compatibility + preview
 * 4. Execute merge
 */

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/i18n/LanguageContext';
import { useMerge } from '@/hooks/useMerge';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Loader2,
  Merge,
  XCircle,
} from 'lucide-react';
import type {
  MergeType,
  ProjectSummary,
  JoinConfig,
} from '@/types/merge';
import { MERGE_TYPE_LABELS } from '@/types/merge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface MergeWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

type Step = 'select' | 'configure' | 'validate' | 'execute';
const STEPS: Step[] = ['select', 'configure', 'validate', 'execute'];

export function MergeWizardDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: MergeWizardDialogProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const merge = useMerge(projectId);

  const [step, setStep] = useState<Step>('select');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [mergeType, setMergeType] = useState<MergeType>('append');
  const [mergedName, setMergedName] = useState('');
  const [applyPrepRules, setApplyPrepRules] = useState(true);
  const [waveLabels, setWaveLabels] = useState<string[]>([]);
  const [joinKey, setJoinKey] = useState('');
  const [joinHow, setJoinHow] = useState<'left' | 'inner' | 'outer'>('left');

  const mg = language === 'es' ? {
    title: 'Combinar Datasets',
    step1: 'Seleccionar proyectos',
    step2: 'Configurar merge',
    step3: 'Validar compatibilidad',
    step4: 'Ejecutar',
    selectProjects: 'Selecciona los proyectos a combinar',
    noProjects: 'No hay otros proyectos disponibles',
    mergeType: 'Tipo de merge',
    projectName: 'Nombre del proyecto resultante',
    applyRules: 'Aplicar reglas de Data Prep de cada fuente',
    waveLabel: 'Etiqueta oleada',
    joinKey: 'Variable clave para unir',
    joinType: 'Tipo de unión',
    validate: 'Validar compatibilidad',
    compatible: 'Los datasets son compatibles',
    incompatible: 'Los datasets NO son compatibles',
    matchedVars: 'Variables en común',
    totalVars: 'Total variables (unión)',
    conflicts: 'Conflictos',
    warnings: 'Advertencias',
    executeMerge: 'Ejecutar merge',
    merging: 'Combinando datasets...',
    success: 'Merge completado',
    goToProject: 'Ir al proyecto combinado',
    cases: 'casos',
    variables: 'variables',
    sources: 'fuentes',
    selected: 'seleccionados',
  } : {
    title: 'Merge Datasets',
    step1: 'Select projects',
    step2: 'Configure merge',
    step3: 'Validate compatibility',
    step4: 'Execute',
    selectProjects: 'Select the projects to merge',
    noProjects: 'No other projects available',
    mergeType: 'Merge type',
    projectName: 'Merged project name',
    applyRules: 'Apply Data Prep rules from each source',
    waveLabel: 'Wave label',
    joinKey: 'Key variable for join',
    joinType: 'Join type',
    validate: 'Validate compatibility',
    compatible: 'Datasets are compatible',
    incompatible: 'Datasets are NOT compatible',
    matchedVars: 'Matched variables',
    totalVars: 'Total variables (union)',
    conflicts: 'Conflicts',
    warnings: 'Warnings',
    executeMerge: 'Execute merge',
    merging: 'Merging datasets...',
    success: 'Merge completed',
    goToProject: 'Go to merged project',
    cases: 'cases',
    variables: 'variables',
    sources: 'sources',
    selected: 'selected',
  };

  // Load available projects when dialog opens
  useEffect(() => {
    if (open) {
      merge.fetchProjects();
      setStep('select');
      setSelectedProjectIds([]);
      setMergeType('append');
      setMergedName(`${projectName} (Merged)`);
      setApplyPrepRules(true);
      setWaveLabels([]);
      setJoinKey('');
      setJoinHow('left');
      merge.reset();
    }
  }, [open]);

  const stepIndex = STEPS.indexOf(step);
  const stepLabels = [mg.step1, mg.step2, mg.step3, mg.step4];

  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectedProjects = merge.availableProjects.filter((p) =>
    selectedProjectIds.includes(p.id)
  );

  const canGoNext = () => {
    if (step === 'select') return selectedProjectIds.length >= 1;
    if (step === 'configure') {
      if (mergeType === 'join' && selectedProjectIds.length !== 1) return false;
      if (mergeType === 'join' && !joinKey) return false;
      if (mergeType === 'wave_merge' && waveLabels.some((l) => !l.trim())) return false;
      return true;
    }
    if (step === 'validate') return merge.compatibility?.is_compatible === true;
    return false;
  };

  const handleNext = async () => {
    if (step === 'select') {
      setStep('configure');
      // Initialize wave labels
      if (mergeType === 'wave_merge') {
        setWaveLabels([
          projectName,
          ...selectedProjects.map((p) => p.name),
        ]);
      }
    } else if (step === 'configure') {
      setStep('validate');
      // Auto-validate
      const allIds = [projectId, ...selectedProjectIds];
      const joinConfig: JoinConfig | null =
        mergeType === 'join' ? { key_variable: joinKey, how: joinHow } : null;
      try {
        await merge.validateCompatibility({
          source_project_ids: allIds,
          merge_type: mergeType,
          join_config: joinConfig,
        });
      } catch {
        // error shown via merge.error
      }
    } else if (step === 'validate') {
      setStep('execute');
    }
  };

  const handleExecute = async () => {
    const allIds = [projectId, ...selectedProjectIds];
    const joinConfig: JoinConfig | null =
      mergeType === 'join' ? { key_variable: joinKey, how: joinHow } : null;
    const labels =
      mergeType === 'wave_merge'
        ? waveLabels.length === allIds.length
          ? waveLabels
          : allIds.map((_, i) => `Wave ${i + 1}`)
        : null;

    try {
      const result = await merge.executeMerge({
        source_project_ids: allIds,
        merge_type: mergeType,
        join_config: joinConfig,
        wave_labels: labels,
        apply_source_prep_rules: applyPrepRules,
        merged_project_name: mergedName || null,
      });
      toast.success(mg.success);
      // Result stored in merge.mergeResult
    } catch {
      toast.error(merge.error || 'Error');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => merge.reset(), 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Merge className="h-5 w-5" />
              {mg.title}
            </DialogTitle>
            <span className="text-sm text-muted-foreground">
              {stepIndex + 1} / {STEPS.length}
            </span>
          </div>
          {/* Step indicator */}
          <div className="flex gap-1 mt-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{stepLabels[stepIndex]}</p>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-4">
          {/* STEP 1: Select projects */}
          {step === 'select' && (
            <>
              <p className="text-sm text-muted-foreground">{mg.selectProjects}</p>
              {merge.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : merge.availableProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">{mg.noProjects}</p>
              ) : (
                <div className="space-y-2">
                  {merge.availableProjects.map((p) => (
                    <Card
                      key={p.id}
                      className={`cursor-pointer transition-colors ${
                        selectedProjectIds.includes(p.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-muted-foreground/30'
                      }`}
                      onClick={() => toggleProject(p.id)}
                    >
                      <CardContent className="flex items-center gap-3 py-3 px-4">
                        <Checkbox
                          checked={selectedProjectIds.includes(p.id)}
                          onCheckedChange={() => toggleProject(p.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.n_cases ?? '?'} {mg.cases} · {p.n_variables ?? '?'} {mg.variables}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {selectedProjectIds.length > 0 && (
                <p className="text-sm font-medium">
                  {selectedProjectIds.length} {mg.selected}
                </p>
              )}
            </>
          )}

          {/* STEP 2: Configure merge */}
          {step === 'configure' && (
            <div className="space-y-4">
              <div>
                <Label>{mg.mergeType}</Label>
                <Select
                  value={mergeType}
                  onValueChange={(v) => setMergeType(v as MergeType)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['append', 'join', 'wave_merge'] as MergeType[]).map((mt) => (
                      <SelectItem key={mt} value={mt}>
                        {MERGE_TYPE_LABELS[mt][language === 'es' ? 'es' : 'en']}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {MERGE_TYPE_LABELS[mergeType][language === 'es' ? 'desc_es' : 'desc_en']}
                </p>
              </div>

              <div>
                <Label>{mg.projectName}</Label>
                <Input
                  value={mergedName}
                  onChange={(e) => setMergedName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="apply-rules"
                  checked={applyPrepRules}
                  onCheckedChange={(v) => setApplyPrepRules(v === true)}
                />
                <Label htmlFor="apply-rules" className="text-sm">{mg.applyRules}</Label>
              </div>

              {/* Join-specific config */}
              {mergeType === 'join' && (
                <div className="space-y-3 border rounded-lg p-3">
                  <div>
                    <Label>{mg.joinKey}</Label>
                    <Input
                      value={joinKey}
                      onChange={(e) => setJoinKey(e.target.value)}
                      placeholder="respondent_id"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{mg.joinType}</Label>
                    <Select
                      value={joinHow}
                      onValueChange={(v) => setJoinHow(v as 'left' | 'inner' | 'outer')}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left join</SelectItem>
                        <SelectItem value="inner">Inner join</SelectItem>
                        <SelectItem value="outer">Outer join</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Wave-specific config */}
              {mergeType === 'wave_merge' && (
                <div className="space-y-2 border rounded-lg p-3">
                  {[projectName, ...selectedProjects.map((p) => p.name)].map((name, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Label className="w-20 text-xs text-muted-foreground shrink-0">
                        {mg.waveLabel} {i + 1}
                      </Label>
                      <Input
                        value={waveLabels[i] || name}
                        onChange={(e) => {
                          const updated = [...waveLabels];
                          while (updated.length <= i) updated.push('');
                          updated[i] = e.target.value;
                          setWaveLabels(updated);
                        }}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Validate compatibility */}
          {step === 'validate' && (
            <div className="space-y-4">
              {merge.isValidating ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2 text-muted-foreground">{mg.validate}...</span>
                </div>
              ) : merge.compatibility ? (
                <>
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    merge.compatibility.is_compatible
                      ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                  }`}>
                    {merge.compatibility.is_compatible ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                    <span className="font-medium">
                      {merge.compatibility.is_compatible ? mg.compatible : mg.incompatible}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">{mg.matchedVars}:</span>{' '}
                      <span className="font-medium">{merge.compatibility.matched_variables}</span>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">{mg.totalVars}:</span>{' '}
                      <span className="font-medium">{merge.compatibility.total_variables_union}</span>
                    </div>
                  </div>

                  {merge.compatibility.conflicts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        {mg.conflicts} ({merge.compatibility.conflicts.length})
                      </h4>
                      <div className="space-y-1">
                        {merge.compatibility.conflicts.map((c, i) => (
                          <div key={i} className="text-xs p-2 bg-destructive/10 rounded">
                            <span className="font-mono">{c.variable}</span> — {c.details}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {merge.compatibility.warnings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        {mg.warnings} ({merge.compatibility.warnings.length})
                      </h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {merge.compatibility.warnings.map((w, i) => (
                          <p key={i} className="text-xs text-muted-foreground p-1">{w}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : merge.error ? (
                <div className="text-destructive text-sm p-3 bg-destructive/10 rounded">
                  {merge.error}
                </div>
              ) : null}
            </div>
          )}

          {/* STEP 4: Execute */}
          {step === 'execute' && (
            <div className="space-y-4">
              {!merge.mergeResult ? (
                <>
                  <div className="text-center py-6">
                    <Merge className="h-12 w-12 mx-auto text-primary mb-3" />
                    <p className="font-medium">
                      {MERGE_TYPE_LABELS[mergeType][language === 'es' ? 'es' : 'en']}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {1 + selectedProjectIds.length} {mg.sources} · {mergedName}
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleExecute}
                    disabled={merge.isLoading}
                  >
                    {merge.isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {mg.merging}
                      </>
                    ) : (
                      <>
                        <Merge className="h-4 w-4 mr-2" />
                        {mg.executeMerge}
                      </>
                    )}
                  </Button>

                  {merge.error && (
                    <div className="text-destructive text-sm p-3 bg-destructive/10 rounded">
                      {merge.error}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-center py-6">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                    <p className="text-lg font-semibold">{mg.success}</p>
                    <div className="flex justify-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span>{merge.mergeResult.total_cases} {mg.cases}</span>
                      <span>{merge.mergeResult.total_variables} {mg.variables}</span>
                    </div>
                  </div>

                  {/* Merge report summary */}
                  {merge.mergeResult.merge_report.warnings.length > 0 && (
                    <div className="text-xs space-y-1">
                      {merge.mergeResult.merge_report.warnings.map((w, i) => (
                        <p key={i} className="text-muted-foreground">{w}</p>
                      ))}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => {
                      handleClose();
                      navigate(`/projects/${merge.mergeResult!.merged_project_id}`);
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {mg.goToProject}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        {!merge.mergeResult && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                if (stepIndex === 0) handleClose();
                else setStep(STEPS[stepIndex - 1]);
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {stepIndex === 0
                ? (t.common?.cancel || 'Cancel')
                : (t.common?.back || 'Back')}
            </Button>

            {step !== 'execute' && (
              <Button onClick={handleNext} disabled={!canGoNext()}>
                {t.common?.continue || 'Continue'}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
