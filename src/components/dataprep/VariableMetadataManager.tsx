import { useState, useCallback } from 'react';
import { Check, Pencil, Upload, Tag, X, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import { useVariableMetadata, type VariableOverride } from '@/hooks/useVariableMetadata';
import { ValueLabelsDialog } from './ValueLabelsDialog';
import { CodebookImportDialog } from './CodebookImportDialog';

interface VariableMetadataManagerProps {
  projectId: string;
}

export function VariableMetadataManager({ projectId }: VariableMetadataManagerProps) {
  const { t } = useLanguage();
  const meta = t.dataPrep?.metadata;
  const { toast } = useToast();

  const {
    variables,
    overriddenCount,
    isLoading,
    updateVariable,
    importCodebook,
  } = useVariableMetadata(projectId);

  const [editingVar, setEditingVar] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [valueLabelsVar, setValueLabelsVar] = useState<VariableOverride | null>(null);
  const [showCodebook, setShowCodebook] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const startEditing = useCallback((v: VariableOverride) => {
    setEditingVar(v.name);
    setEditValue(v.label);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingVar(null);
    setEditValue('');
  }, []);

  const saveLabel = useCallback(async (varName: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    try {
      await updateVariable.mutateAsync({
        varName,
        override: { label: trimmed },
      });
      toast({ title: meta?.saved || 'Label saved' });
    } catch {
      toast({ title: meta?.saveError || 'Error saving label', variant: 'destructive' });
    }
    setEditingVar(null);
    setEditValue('');
  }, [editValue, updateVariable, toast, meta]);

  const saveValueLabels = useCallback(async (labels: Record<string, string>) => {
    if (!valueLabelsVar) return;
    try {
      await updateVariable.mutateAsync({
        varName: valueLabelsVar.name,
        override: {
          label: valueLabelsVar.is_overridden ? valueLabelsVar.label : undefined,
          value_labels: Object.keys(labels).length > 0 ? labels : undefined,
        },
      });
      toast({ title: meta?.saved || 'Value labels saved' });
    } catch {
      toast({ title: meta?.saveError || 'Error saving', variant: 'destructive' });
    }
    setValueLabelsVar(null);
  }, [valueLabelsVar, updateVariable, toast, meta]);

  const handleImportCodebook = useCallback(async (file: File) => {
    try {
      const result = await importCodebook.mutateAsync(file);
      toast({
        title: meta?.codebookImported?.replace('{n}', String(result.imported_count))
          || `${result.imported_count} variables imported`,
      });
      setShowCodebook(false);
    } catch (err) {
      toast({
        title: meta?.importError || 'Import failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [importCodebook, toast, meta]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, varName: string) => {
    if (e.key === 'Enter') saveLabel(varName);
    if (e.key === 'Escape') cancelEditing();
  }, [saveLabel, cancelEditing]);

  // Filter variables by search query
  const filtered = searchQuery
    ? variables.filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : variables;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t.common?.loading || 'Loading...'}
        </CardContent>
      </Card>
    );
  }

  if (variables.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {meta?.title || 'Variable Labels'}
                </CardTitle>
                <CardDescription>
                  {meta?.description || 'Define labels so analysis results are readable'}
                  {overriddenCount > 0 && (
                    <span className="ml-2 text-primary font-medium">
                      ({overriddenCount} {meta?.enriched || 'enriched'})
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowCodebook(true)}
            >
              <Upload className="h-3.5 w-3.5" />
              {meta?.importCodebook || 'Import Codebook'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={meta?.searchPlaceholder || 'Search variables...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Variable table */}
          <ScrollArea className="max-h-[420px]">
            <div className="space-y-0.5">
              {/* Header */}
              <div className="grid grid-cols-[180px_1fr_120px_80px] gap-2 text-xs font-medium text-muted-foreground px-2 py-1.5 border-b">
                <span>{meta?.variableCol || 'Variable'}</span>
                <span>{meta?.labelCol || 'Label'}</span>
                <span>{meta?.valuesCol || 'Values'}</span>
                <span>{meta?.statusCol || 'Status'}</span>
              </div>

              {filtered.map(v => (
                <div
                  key={v.name}
                  className="grid grid-cols-[180px_1fr_120px_80px] gap-2 items-center px-2 py-1.5 rounded hover:bg-muted/50 group"
                >
                  {/* Variable name */}
                  <span className="text-sm font-mono truncate" title={v.name}>
                    {v.name}
                  </span>

                  {/* Label (inline editable) */}
                  {editingVar === v.name ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => handleKeyDown(e, v.name)}
                        autoFocus
                        className="h-7 text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => saveLabel(v.name)}
                        disabled={updateVariable.isPending}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={cancelEditing}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-1 cursor-pointer group/label"
                      onClick={() => startEditing(v)}
                    >
                      <span className="text-sm truncate" title={v.label}>
                        {v.label}
                      </span>
                      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/label:opacity-100 transition-opacity shrink-0" />
                    </div>
                  )}

                  {/* Value labels count + edit button */}
                  <div>
                    {v.type === 'categorical' || Object.keys(v.value_labels).length > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 px-2"
                        onClick={() => setValueLabelsVar(v)}
                      >
                        {Object.keys(v.value_labels).length} {meta?.valuesLabel || 'labels'}
                        <Pencil className="h-3 w-3" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>

                  {/* Status badge */}
                  <div>
                    {v.is_overridden ? (
                      <Badge variant="default" className="text-[10px] h-5">
                        {meta?.enriched || 'Enriched'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {meta?.autoGenerated || 'Auto'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {meta?.noResults || 'No matching variables'}
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Value Labels Dialog */}
      {valueLabelsVar && (
        <ValueLabelsDialog
          open={!!valueLabelsVar}
          onOpenChange={open => { if (!open) setValueLabelsVar(null); }}
          variableName={valueLabelsVar.name}
          variableLabel={valueLabelsVar.label}
          currentLabels={valueLabelsVar.has_value_label_overrides
            ? Object.fromEntries(
                Object.entries(valueLabelsVar.value_labels).filter(
                  ([k]) => !(k in valueLabelsVar.auto_value_labels) ||
                    valueLabelsVar.value_labels[k] !== valueLabelsVar.auto_value_labels[k]
                )
              )
            : {}
          }
          autoLabels={valueLabelsVar.auto_value_labels}
          onSave={saveValueLabels}
          isSaving={updateVariable.isPending}
        />
      )}

      {/* Codebook Import Dialog */}
      <CodebookImportDialog
        open={showCodebook}
        onOpenChange={setShowCodebook}
        onImport={handleImportCodebook}
        isImporting={importCodebook.isPending}
      />
    </>
  );
}
