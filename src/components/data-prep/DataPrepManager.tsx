import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Filter,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Settings2,
  Scale,
  Sigma,
  Code2,
  Calculator,
  Lightbulb,
  ShieldCheck,
  LayoutTemplate,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useDataPrep } from '@/hooks/useDataPrep';
import { RuleFormDialog } from './RuleFormDialog';
import { SuggestionsPanel } from './SuggestionsPanel';
import { QCReportCard } from './QCReportCard';
import { TemplateSelector } from './TemplateSelector';
import { RULE_TYPE_LABELS } from '@/types/dataPrep';
import type { DataPrepRule, DataPrepRuleCreate, DataPrepRuleType } from '@/types/dataPrep';
import { toast } from 'sonner';

interface DataPrepManagerProps {
  projectId: string;
  availableVariables: string[];
}

const RULE_TYPE_ICONS: Record<DataPrepRuleType, typeof Filter> = {
  cleaning: Filter,
  weight: Scale,
  net: Sigma,
  recode: Code2,
  computed: Calculator,
};

const RULE_TYPE_COLORS: Record<DataPrepRuleType, string> = {
  cleaning: 'bg-red-500/10 text-red-600',
  weight: 'bg-blue-500/10 text-blue-600',
  net: 'bg-green-500/10 text-green-600',
  recode: 'bg-purple-500/10 text-purple-600',
  computed: 'bg-amber-500/10 text-amber-600',
};

export function DataPrepManager({
  projectId,
  availableVariables,
}: DataPrepManagerProps) {
  const { t, language } = useLanguage();
  const dpT = t.dataPrep;
  const {
    rules,
    isLoading,
    error,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    reorderRules,
    previewRule,
    toggleRule,
    getSuggestions,
    applySuggestions,
    getQCReport,
    getTemplates,
    applyTemplate,
  } = useDataPrep(projectId);

  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<DataPrepRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<DataPrepRule | null>(null);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const toggleExpand = (ruleId: string) => {
    setExpandedRules((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) next.delete(ruleId);
      else next.add(ruleId);
      return next;
    });
  };

  const handleSave = async (data: DataPrepRuleCreate) => {
    setIsSaving(true);
    try {
      if (editingRule) {
        await updateRule(editingRule.id, {
          name: data.name,
          config: data.config,
          is_active: data.is_active,
        });
        toast.success(dpT?.ruleUpdated || 'Regla actualizada');
      } else {
        await createRule(data);
        toast.success(dpT?.ruleCreated || 'Regla creada');
      }
      setEditingRule(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRule) return;
    try {
      await deleteRule(deletingRule.id);
      toast.success(dpT?.ruleDeleted || 'Regla eliminada');
    } finally {
      setDeletingRule(null);
    }
  };

  const handleEdit = (rule: DataPrepRule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleToggleActive = async (rule: DataPrepRule) => {
    try {
      await toggleRule(rule.id, !rule.is_active);
      toast.success(
        rule.is_active
          ? (dpT?.ruleDisabled || 'Regla desactivada')
          : (dpT?.ruleEnabled || 'Regla activada')
      );
    } catch {
      // error handled by hook
    }
  };

  const handleMoveUp = async (idx: number) => {
    if (idx <= 0) return;
    const ids = rules.map((r) => r.id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    await reorderRules(ids);
  };

  const handleMoveDown = async (idx: number) => {
    if (idx >= rules.length - 1) return;
    const ids = rules.map((r) => r.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    await reorderRules(ids);
  };

  const activeCount = rules.filter((r) => r.is_active).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {dpT?.title || 'Preparación de Datos'}
          </h2>
          {rules.length > 0 && (
            <Badge variant="secondary">
              {activeCount}/{rules.length} {dpT?.active || 'activas'}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingRule(null);
            setShowForm(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {dpT?.createRule || 'Crear regla'}
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Tabbed interface */}
      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rules" className="text-xs sm:text-sm">
            <Settings2 className="mr-1.5 h-3.5 w-3.5" />
            {dpT?.tabRules || 'Rules'}
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="text-xs sm:text-sm">
            <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
            {dpT?.tabSuggestions || 'AI'}
          </TabsTrigger>
          <TabsTrigger value="qc" className="text-xs sm:text-sm">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            {dpT?.tabQC || 'QC'}
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs sm:text-sm">
            <LayoutTemplate className="mr-1.5 h-3.5 w-3.5" />
            {dpT?.tabTemplates || 'Templates'}
          </TabsTrigger>
        </TabsList>

        {/* Rules tab */}
        <TabsContent value="rules" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <Settings2 className="h-10 w-10 text-muted-foreground" />
                <div className="text-center space-y-1">
                  <p className="font-medium text-muted-foreground">
                    {dpT?.noRules || 'No hay reglas de preparación'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dpT?.noRulesHint || 'Crea reglas de limpieza, ponderación, nets o recodificación para preparar tus datos.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-2 pr-2">
                {rules.map((rule, idx) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    index={idx}
                    totalRules={rules.length}
                    isExpanded={expandedRules.has(rule.id)}
                    onToggleExpand={() => toggleExpand(rule.id)}
                    onEdit={() => handleEdit(rule)}
                    onDelete={() => setDeletingRule(rule)}
                    onToggleActive={() => handleToggleActive(rule)}
                    onMoveUp={() => handleMoveUp(idx)}
                    onMoveDown={() => handleMoveDown(idx)}
                    language={language}
                    dpT={dpT}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* AI Suggestions tab */}
        <TabsContent value="suggestions" className="mt-4">
          <SuggestionsPanel
            projectId={projectId}
            getSuggestions={getSuggestions}
            applySuggestions={applySuggestions}
          />
        </TabsContent>

        {/* QC Report tab */}
        <TabsContent value="qc" className="mt-4">
          <QCReportCard
            projectId={projectId}
            getQCReport={getQCReport}
          />
        </TabsContent>

        {/* Templates tab */}
        <TabsContent value="templates" className="mt-4">
          <TemplateSelector
            projectId={projectId}
            getTemplates={getTemplates}
            applyTemplate={applyTemplate}
          />
        </TabsContent>
      </Tabs>

      {/* Rule form dialog */}
      <RuleFormDialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingRule(null);
        }}
        availableVariables={availableVariables}
        onSave={handleSave}
        onPreview={previewRule}
        editingRule={editingRule}
        isSaving={isSaving}
        nextOrderIndex={rules.length}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingRule}
        onOpenChange={(open) => !open && setDeletingRule(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dpT?.deleteConfirmTitle || '¿Eliminar regla?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dpT?.deleteConfirmDescription ||
                'Esta acción no se puede deshacer. La regla será eliminada permanentemente.'}
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

// ── Rule card ──────────────────────────────────────────────────────────────

function RuleCard({
  rule,
  index,
  totalRules,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  language,
  dpT,
}: {
  rule: DataPrepRule;
  index: number;
  totalRules: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  language: string;
  dpT: any;
}) {
  const ruleType = rule.rule_type as DataPrepRuleType;
  const Icon = RULE_TYPE_ICONS[ruleType] || Settings2;
  const colorClass = RULE_TYPE_COLORS[ruleType] || 'bg-muted text-muted-foreground';

  return (
    <Card className={!rule.is_active ? 'opacity-60' : ''}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between gap-2">
          {/* Left: expand + icon + info */}
          <button
            className="flex items-center gap-2 text-left flex-1 min-w-0"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div className={`h-7 w-7 rounded flex items-center justify-center shrink-0 ${colorClass}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <CardTitle className="text-sm font-medium truncate">{rule.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {RULE_TYPE_LABELS[ruleType]?.[language as 'es' | 'en'] || ruleType}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  #{index + 1}
                </span>
              </div>
            </div>
          </button>

          {/* Right: actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Reorder buttons */}
            <div className="flex flex-col">
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={onMoveUp}
                disabled={index === 0}
              >
                <GripVertical className="h-3 w-3 rotate-90" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={onMoveDown}
                disabled={index === totalRules - 1}
              >
                <GripVertical className="h-3 w-3 -rotate-90" />
              </Button>
            </div>
            <Switch
              checked={rule.is_active}
              onCheckedChange={onToggleActive}
              className="scale-75"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-3 px-4">
          <ConfigSummary rule={rule} language={language} dpT={dpT} />
        </CardContent>
      )}
    </Card>
  );
}

// ── Config summary ─────────────────────────────────────────────────────────

function ConfigSummary({
  rule,
  language,
  dpT,
}: {
  rule: DataPrepRule;
  language: string;
  dpT: any;
}) {
  const c = rule.config;

  switch (rule.rule_type) {
    case 'cleaning':
      return (
        <div className="text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">{dpT?.variable || 'Variable'}:</span>{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{c.variable}</code>
          </p>
          <p>
            <span className="text-muted-foreground">{dpT?.operator || 'Operador'}:</span>{' '}
            {c.operator}
            {c.value !== undefined && c.value !== null && ` ${c.value}`}
            {c.values && ` [${c.values.join(', ')}]`}
          </p>
          <p>
            <span className="text-muted-foreground">{dpT?.action || 'Acción'}:</span>{' '}
            {c.action === 'drop' ? (dpT?.actionDrop || 'Eliminar') : (dpT?.actionFilter || 'Filtrar')}
          </p>
        </div>
      );

    case 'net':
      return (
        <div className="text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">{dpT?.variable || 'Variable'}:</span>{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{c.variable}</code>
          </p>
          <p>
            <span className="text-muted-foreground">{dpT?.netName || 'Net'}:</span>{' '}
            {c.net_name}
          </p>
          <p>
            <span className="text-muted-foreground">{dpT?.netCodes || 'Códigos'}:</span>{' '}
            {c.codes?.join(', ')}
          </p>
        </div>
      );

    case 'recode':
      return (
        <div className="text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">{dpT?.variable || 'Variable'}:</span>{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{c.variable}</code>
            {c.new_variable_name && (
              <> → <code className="text-xs bg-muted px-1 py-0.5 rounded">{c.new_variable_name}</code></>
            )}
          </p>
          {c.mappings?.map((m: any, i: number) => (
            <p key={i} className="text-xs pl-2 border-l-2 border-primary/30">
              [{m.from_codes?.join(', ')}] → {m.to_value} ({m.label})
            </p>
          ))}
        </div>
      );

    case 'computed':
      return (
        <div className="text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">{dpT?.computedVarName || 'Variable'}:</span>{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{c.name}</code>{' '}
            ({c.label})
          </p>
          <p className="text-xs text-muted-foreground">
            {dpT?.combineConditions || 'Combinar'}: {c.combine?.toUpperCase()}
          </p>
          {c.conditions?.map((cond: any, i: number) => (
            <p key={i} className="text-xs pl-2 border-l-2 border-primary/30">
              {cond.variable} {cond.operator} {cond.value ?? cond.values?.join(', ')}
            </p>
          ))}
        </div>
      );

    case 'weight':
      return (
        <div className="text-sm space-y-1">
          {c.targets && Object.entries(c.targets).map(([variable, targets]: [string, any]) => (
            <div key={variable}>
              <p>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">{variable}</code>:
              </p>
              <div className="flex flex-wrap gap-1 pl-2">
                {Object.entries(targets).map(([val, pct]: [string, any]) => (
                  <Badge key={val} variant="outline" className="text-xs">
                    {val} → {pct}%
                  </Badge>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Max iter: {c.max_iterations ?? 50} | Weight: [{c.min_weight ?? 0.1}, {c.max_weight ?? 10}]
          </p>
        </div>
      );

    default:
      return (
        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
          {JSON.stringify(c, null, 2)}
        </pre>
      );
  }
}
