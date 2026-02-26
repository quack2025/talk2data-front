import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSegmentation } from '@/hooks/useSegmentation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import type {
  ClusterMethod,
  LinkageMethod,
  ClusterProfile,
} from '@/types/segmentation';
import { METHOD_LABELS } from '@/types/segmentation';
import type { ExploreVariable } from '@/types/explore';
import { toast } from 'sonner';
import { DendrogramChart } from './DendrogramChart';

interface SegmentationWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  variables: ExploreVariable[];
}

type Step = 'variables' | 'configure' | 'detect' | 'execute';
const STEPS: Step[] = ['variables', 'configure', 'detect', 'execute'];

export function SegmentationWizardDialog({
  open,
  onOpenChange,
  projectId,
  variables,
}: SegmentationWizardDialogProps) {
  const { language } = useLanguage();
  const seg = useSegmentation(projectId);

  const [step, setStep] = useState<Step>('variables');
  const [selectedVars, setSelectedVars] = useState<string[]>([]);
  const [varSearch, setVarSearch] = useState('');
  const [method, setMethod] = useState<ClusterMethod>('kmeans');
  const [standardize, setStandardize] = useState(true);
  const [linkage, setLinkage] = useState<LinkageMethod>('ward');
  const [manualK, setManualK] = useState<number | null>(null);
  const [useAutoK, setUseAutoK] = useState(true);
  const [saveAsSegment, setSaveAsSegment] = useState(true);
  const [clusterPrefix, setClusterPrefix] = useState('Segment');

  const mg = language === 'es'
    ? {
        title: 'Segmentación / Clustering',
        step1: '1. Seleccionar variables',
        step2: '2. Configurar método',
        step3: '3. Detectar K óptimo',
        step4: '4. Ejecutar y resultados',
        searchVars: 'Buscar variables...',
        selectVarsDesc: 'Selecciona las variables numéricas para agrupar',
        onlyNumeric: 'Solo se muestran variables numéricas',
        selected: 'seleccionadas',
        method: 'Método de clustering',
        standardize: 'Estandarizar variables (Z-score)',
        standardizeDesc: 'Recomendado cuando las variables tienen distintas escalas',
        linkageMethod: 'Método de enlace',
        autoDetect: 'Auto-detectar K óptimo',
        manualK: 'Número de clusters (K)',
        detecting: 'Analizando rango de K...',
        recommended: 'K recomendado',
        reason: 'Razón',
        silhouette: 'Silhouette Score',
        inertia: 'Inercia',
        overrideK: 'Usar otro K',
        saveSegments: 'Guardar como segmentos reutilizables',
        segmentPrefix: 'Prefijo de nombre',
        execute: 'Ejecutar Clustering',
        executing: 'Ejecutando clustering...',
        success: 'Clustering completado',
        clusters: 'clusters',
        cases: 'casos',
        score: 'Silhouette',
        profile: 'Perfil del cluster',
        size: 'Tamaño',
        differentiators: 'Diferenciadores principales',
        clusterMean: 'Media cluster',
        overallMean: 'Media total',
        delta: 'Diferencia',
        demographics: 'Demografía',
        segmentsSaved: 'segmentos guardados',
        noNumericVars: 'No hay variables numéricas disponibles',
        kValues: 'K probados',
      }
    : {
        title: 'Segmentation / Clustering',
        step1: '1. Select variables',
        step2: '2. Configure method',
        step3: '3. Detect optimal K',
        step4: '4. Execute & results',
        searchVars: 'Search variables...',
        selectVarsDesc: 'Select numeric variables for clustering',
        onlyNumeric: 'Only numeric variables are shown',
        selected: 'selected',
        method: 'Clustering method',
        standardize: 'Standardize variables (Z-score)',
        standardizeDesc: 'Recommended when variables have different scales',
        linkageMethod: 'Linkage method',
        autoDetect: 'Auto-detect optimal K',
        manualK: 'Number of clusters (K)',
        detecting: 'Analyzing K range...',
        recommended: 'Recommended K',
        reason: 'Reason',
        silhouette: 'Silhouette Score',
        inertia: 'Inertia',
        overrideK: 'Use different K',
        saveSegments: 'Save as reusable segments',
        segmentPrefix: 'Name prefix',
        execute: 'Execute Clustering',
        executing: 'Executing clustering...',
        success: 'Clustering completed',
        clusters: 'clusters',
        cases: 'cases',
        score: 'Silhouette',
        profile: 'Cluster profile',
        size: 'Size',
        differentiators: 'Top differentiators',
        clusterMean: 'Cluster mean',
        overallMean: 'Overall mean',
        delta: 'Delta',
        demographics: 'Demographics',
        segmentsSaved: 'segments saved',
        noNumericVars: 'No numeric variables available',
        kValues: 'K values tested',
      };

  // Filter to numeric variables only
  const numericVars = variables.filter(
    (v) =>
      v.type === 'numeric' ||
      v.detected_type === 'numeric' ||
      v.detected_type === 'likert' ||
      v.detected_subtype === 'likert'
  );

  const filteredVars = numericVars.filter((v) => {
    if (!varSearch) return true;
    const q = varSearch.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      (v.label && v.label.toLowerCase().includes(q))
    );
  });

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('variables');
      setSelectedVars([]);
      setVarSearch('');
      setMethod('kmeans');
      setStandardize(true);
      setLinkage('ward');
      setManualK(null);
      setUseAutoK(true);
      setSaveAsSegment(true);
      setClusterPrefix('Segment');
      seg.reset();
    }
  }, [open]);

  const stepIndex = STEPS.indexOf(step);
  const stepLabels = [mg.step1, mg.step2, mg.step3, mg.step4];

  const toggleVar = (name: string) => {
    setSelectedVars((prev) =>
      prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
    );
  };

  const canGoNext = () => {
    if (step === 'variables') return selectedVars.length >= 2;
    if (step === 'configure') return true;
    if (step === 'detect') {
      if (useAutoK) return seg.autoDetectResult !== null;
      return manualK !== null && manualK >= 2;
    }
    return false;
  };

  const handleNext = async () => {
    if (step === 'variables') {
      setStep('configure');
    } else if (step === 'configure') {
      setStep('detect');
      if (useAutoK) {
        try {
          await seg.autoDetectK({
            variables: selectedVars,
            standardize,
            k_range: [2, 8],
          });
        } catch {
          // error shown via seg.error
        }
      }
    } else if (step === 'detect') {
      setStep('execute');
    }
  };

  const effectiveK = useAutoK
    ? manualK ?? seg.autoDetectResult?.recommended_k ?? 3
    : manualK ?? 3;

  const handleExecute = async () => {
    try {
      await seg.executeClustering({
        variables: selectedVars,
        method,
        n_clusters: effectiveK,
        standardize,
        linkage,
        save_as_segment: saveAsSegment,
        cluster_name_prefix: clusterPrefix,
      });
      toast.success(mg.success);
    } catch {
      toast.error(seg.error || 'Error');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => seg.reset(), 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {mg.title}
            </DialogTitle>
            <DialogDescription className="sr-only">Segmentation clustering wizard</DialogDescription>
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
          {/* ── STEP 1: Select Variables ── */}
          {step === 'variables' && (
            <>
              <p className="text-sm text-muted-foreground">{mg.selectVarsDesc}</p>

              {numericVars.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">{mg.noNumericVars}</p>
              ) : (
                <>
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={varSearch}
                      onChange={(e) => setVarSearch(e.target.value)}
                      placeholder={mg.searchVars}
                      className="pl-9"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {mg.onlyNumeric} · {selectedVars.length} {mg.selected}
                  </p>

                  <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                    {filteredVars.map((v) => (
                      <Card
                        key={v.name}
                        className={`cursor-pointer transition-colors ${
                          selectedVars.includes(v.name)
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-muted-foreground/30'
                        }`}
                        onClick={() => toggleVar(v.name)}
                      >
                        <CardContent className="flex items-center gap-3 py-2 px-3">
                          <Checkbox
                            checked={selectedVars.includes(v.name)}
                            onCheckedChange={() => toggleVar(v.name)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{v.name}</p>
                            {v.label && (
                              <p className="text-xs text-muted-foreground truncate">
                                {v.label}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {v.detected_subtype || v.detected_type || v.type}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── STEP 2: Configure Method ── */}
          {step === 'configure' && (
            <div className="space-y-4">
              <div>
                <Label>{mg.method}</Label>
                <Select
                  value={method}
                  onValueChange={(v) => setMethod(v as ClusterMethod)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['kmeans', 'hierarchical'] as ClusterMethod[]).map((m) => (
                      <SelectItem key={m} value={m}>
                        {METHOD_LABELS[m][language === 'es' ? 'es' : 'en']}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {METHOD_LABELS[method][language === 'es' ? 'desc_es' : 'desc_en']}
                </p>
              </div>

              {method === 'hierarchical' && (
                <div>
                  <Label>{mg.linkageMethod}</Label>
                  <Select
                    value={linkage}
                    onValueChange={(v) => setLinkage(v as LinkageMethod)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ward">Ward</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{mg.standardize}</Label>
                  <p className="text-xs text-muted-foreground">{mg.standardizeDesc}</p>
                </div>
                <Switch
                  checked={standardize}
                  onCheckedChange={setStandardize}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>{mg.autoDetect}</Label>
                  <p className="text-xs text-muted-foreground">
                    {language === 'es'
                      ? 'Prueba K=2..8 usando Elbow + Silhouette'
                      : 'Tests K=2..8 using Elbow + Silhouette'}
                  </p>
                </div>
                <Switch checked={useAutoK} onCheckedChange={setUseAutoK} />
              </div>

              {!useAutoK && (
                <div>
                  <Label>{mg.manualK}</Label>
                  <Input
                    type="number"
                    min={2}
                    max={15}
                    value={manualK ?? ''}
                    onChange={(e) =>
                      setManualK(e.target.value ? Number(e.target.value) : null)
                    }
                    className="mt-1 w-24"
                  />
                </div>
              )}

              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Label>{mg.saveSegments}</Label>
                  <Switch
                    checked={saveAsSegment}
                    onCheckedChange={setSaveAsSegment}
                  />
                </div>
                {saveAsSegment && (
                  <div>
                    <Label className="text-xs">{mg.segmentPrefix}</Label>
                    <Input
                      value={clusterPrefix}
                      onChange={(e) => setClusterPrefix(e.target.value)}
                      className="mt-1"
                      placeholder="Segment"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: Auto-detect K ── */}
          {step === 'detect' && (
            <div className="space-y-4">
              {useAutoK ? (
                <>
                  {seg.isDetecting ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2 text-muted-foreground">{mg.detecting}</span>
                    </div>
                  ) : seg.autoDetectResult ? (
                    <>
                      {/* Recommended K */}
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400">
                        <Sparkles className="h-5 w-5" />
                        <span className="font-medium">
                          {mg.recommended}: K = {seg.autoDetectResult.recommended_k}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {mg.reason}: {seg.autoDetectResult.recommendation_reason}
                      </p>

                      {/* K scores table */}
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="px-3 py-2 text-left font-medium">K</th>
                              <th className="px-3 py-2 text-right font-medium">{mg.silhouette}</th>
                              <th className="px-3 py-2 text-right font-medium">{mg.inertia}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {seg.autoDetectResult.k_values.map((k, i) => (
                              <tr
                                key={k}
                                className={`border-t ${
                                  k === (manualK ?? seg.autoDetectResult!.recommended_k)
                                    ? 'bg-primary/5 font-medium'
                                    : ''
                                } cursor-pointer hover:bg-muted/30`}
                                onClick={() => setManualK(k)}
                              >
                                <td className="px-3 py-2">
                                  {k}
                                  {k === seg.autoDetectResult!.recommended_k && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      {language === 'es' ? 'recomendado' : 'recommended'}
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right font-mono">
                                  {seg.autoDetectResult!.silhouette_scores[i].toFixed(3)}
                                </td>
                                <td className="px-3 py-2 text-right font-mono">
                                  {seg.autoDetectResult!.inertias[i].toFixed(0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Override K */}
                      <div className="flex items-center gap-3">
                        <Label className="text-sm shrink-0">{mg.overrideK}:</Label>
                        <Input
                          type="number"
                          min={2}
                          max={15}
                          value={manualK ?? seg.autoDetectResult.recommended_k}
                          onChange={(e) =>
                            setManualK(
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          className="w-20"
                        />
                      </div>
                    </>
                  ) : seg.error ? (
                    <div className="text-destructive text-sm p-3 bg-destructive/10 rounded">
                      {seg.error}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">K = {manualK ?? 3}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'es'
                      ? 'Auto-detección desactivada. Se usará el K manual.'
                      : 'Auto-detect disabled. Manual K will be used.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: Execute & Results ── */}
          {step === 'execute' && (
            <div className="space-y-4">
              {!seg.clusterResult ? (
                <>
                  <div className="text-center py-6">
                    <Target className="h-12 w-12 mx-auto text-primary mb-3" />
                    <p className="font-medium">
                      {METHOD_LABELS[method][language === 'es' ? 'es' : 'en']} · K = {effectiveK}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedVars.length} {language === 'es' ? 'variables' : 'variables'}
                      {standardize ? ' · Z-score' : ''}
                      {saveAsSegment ? ` · ${mg.saveSegments}` : ''}
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleExecute}
                    disabled={seg.isLoading}
                  >
                    {seg.isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {mg.executing}
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        {mg.execute}
                      </>
                    )}
                  </Button>

                  {seg.error && (
                    <div className="text-destructive text-sm p-3 bg-destructive/10 rounded">
                      {seg.error}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Success header */}
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                    <p className="text-lg font-semibold">{mg.success}</p>
                    <div className="flex justify-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{seg.clusterResult.n_clusters} {mg.clusters}</span>
                      <span>{seg.clusterResult.total_cases} {mg.cases}</span>
                      <span>
                        {mg.score}: {seg.clusterResult.silhouette_score.toFixed(3)}
                      </span>
                    </div>
                    {seg.clusterResult.segment_ids.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {seg.clusterResult.segment_ids.length} {mg.segmentsSaved}
                      </p>
                    )}
                  </div>

                  {/* Dendrogram (hierarchical only) */}
                  {seg.clusterResult.dendrogram_data && (
                    <Card>
                      <CardContent className="pt-4 pb-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          {language === 'es' ? 'Dendrograma' : 'Dendrogram'}
                        </p>
                        <DendrogramChart data={seg.clusterResult.dendrogram_data} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Cluster profiles */}
                  <div className="space-y-3">
                    {seg.clusterResult.profiles.map((profile) => (
                      <ClusterProfileCard
                        key={profile.cluster_id}
                        profile={profile}
                        mg={mg}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        {!seg.clusterResult && (
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
                ? language === 'es' ? 'Cancelar' : 'Cancel'
                : language === 'es' ? 'Atrás' : 'Back'}
            </Button>

            {step !== 'execute' && (
              <Button onClick={handleNext} disabled={!canGoNext()}>
                {language === 'es' ? 'Continuar' : 'Continue'}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        )}

        {/* Close button when done */}
        {seg.clusterResult && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleClose}>
              {language === 'es' ? 'Cerrar' : 'Close'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Cluster Profile Card ── */

function ClusterProfileCard({
  profile,
  mg,
}: {
  profile: ClusterProfile;
  mg: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {profile.cluster_id + 1}
            </div>
            <div>
              <p className="font-medium text-sm">{profile.label}</p>
              <p className="text-xs text-muted-foreground">
                {mg.size}: {profile.size} ({profile.pct}%)
              </p>
            </div>
          </div>
          <ArrowRight
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              expanded ? 'rotate-90' : ''
            }`}
          />
        </div>

        {expanded && (
          <div className="mt-3 space-y-3">
            {/* Top differentiators */}
            {profile.differentiators.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {mg.differentiators}
                </p>
                <div className="space-y-1">
                  {profile.differentiators.slice(0, 5).map((d) => (
                    <div
                      key={d.variable}
                      className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1"
                    >
                      <span className="font-mono truncate max-w-[40%]">
                        {d.variable}
                      </span>
                      <div className="flex items-center gap-3">
                        <span>
                          {mg.clusterMean}: <strong>{d.cluster_mean.toFixed(2)}</strong>
                        </span>
                        <span>
                          {mg.overallMean}: {d.overall_mean.toFixed(2)}
                        </span>
                        <Badge
                          variant={d.delta > 0 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {d.delta > 0 ? '+' : ''}
                          {d.delta.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Demographics */}
            {Object.keys(profile.demographics).length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {mg.demographics}
                </p>
                <div className="space-y-2">
                  {Object.entries(profile.demographics).map(([dimName, values]) => (
                    <div key={dimName}>
                      <p className="text-xs font-medium text-muted-foreground capitalize">
                        {dimName}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {Object.entries(values)
                          .sort((a, b) => b[1].pct_in_cluster - a[1].pct_in_cluster)
                          .slice(0, 5)
                          .map(([label, info]) => (
                            <Badge
                              key={label}
                              variant="outline"
                              className="text-xs"
                            >
                              {label}: {info.pct_in_cluster.toFixed(0)}%
                            </Badge>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
