import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Loader2, Wand2, ChevronDown, ChevronRight, Save, Info } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { GROUP_TYPE_LABELS } from '@/types/variableGroups';
import type {
  VariableGroupSuggestion,
  AutoDetectResponse,
  VariableGroupCreate,
} from '@/types/variableGroups';

interface AutoDetectPanelProps {
  isDetecting: boolean;
  autoDetectResult: AutoDetectResponse | null;
  onAutoDetect: () => Promise<AutoDetectResponse>;
  onSaveGroups: (groups: VariableGroupCreate[]) => Promise<void>;
  isSaving?: boolean;
}

export function AutoDetectPanel({
  isDetecting,
  autoDetectResult,
  onAutoDetect,
  onSaveGroups,
  isSaving = false,
}: AutoDetectPanelProps) {
  const { t } = useLanguage();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  const groupingT = t.grouping;

  useEffect(() => {
    if (autoDetectResult?.suggestions) {
      setSelectedIndices(
        new Set(autoDetectResult.suggestions.map((_, i) => i))
      );
    }
  }, [autoDetectResult]);

  const toggleSelection = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleExpand = (index: number) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!autoDetectResult) return;
    const toSave: VariableGroupCreate[] = autoDetectResult.suggestions
      .filter((_, i) => selectedIndices.has(i))
      .map((s) => ({
        name: s.name,
        group_type: s.group_type,
        variables: s.variables,
        sub_groups: s.sub_groups,
      }));
    await onSaveGroups(toSave);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.5) return 'secondary';
    return 'outline';
  };

  if (!autoDetectResult) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <Wand2 className="h-10 w-10 text-muted-foreground" />
          <div className="text-center space-y-1">
            <p className="font-medium">
              {groupingT?.autoDetectTitle || 'Auto-detectar grupos de variables'}
            </p>
            <p className="text-sm text-muted-foreground">
              {groupingT?.autoDetectDescription ||
                'Analiza las variables del proyecto para sugerir agrupaciones automáticas'}
            </p>
          </div>
          <Button onClick={onAutoDetect} disabled={isDetecting}>
            {isDetecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {groupingT?.detecting || 'Detectando...'}
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                {groupingT?.autoDetect || 'Auto-detectar'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const suggestions = autoDetectResult.suggestions;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold">
            {groupingT?.suggestionsTitle || 'Grupos sugeridos'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {suggestions.length}{' '}
            {groupingT?.groupsFound || 'grupos encontrados'} /{' '}
            {autoDetectResult.total_variables_analyzed}{' '}
            {groupingT?.variablesAnalyzed || 'variables analizadas'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAutoDetect}
            disabled={isDetecting}
          >
            {isDetecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              groupingT?.reDetect || 'Re-detectar'
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={selectedIndices.size === 0 || isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {groupingT?.saveSelected || 'Guardar seleccionados'} ({selectedIndices.size})
          </Button>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2" />
            {groupingT?.noSuggestions || 'No se detectaron grupos automáticamente'}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-2 pr-2">
            {suggestions.map((suggestion, index) => (
              <SuggestionCard
                key={index}
                suggestion={suggestion}
                index={index}
                isSelected={selectedIndices.has(index)}
                isExpanded={expandedIndices.has(index)}
                onToggleSelect={() => toggleSelection(index)}
                onToggleExpand={() => toggleExpand(index)}
                getConfidenceBadge={getConfidenceBadge}
                groupingT={groupingT}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function SuggestionCard({
  suggestion,
  index,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  getConfidenceBadge,
  groupingT,
}: {
  suggestion: VariableGroupSuggestion;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  getConfidenceBadge: (c: number) => 'default' | 'secondary' | 'outline';
  groupingT: any;
}) {
  return (
    <Card className={isSelected ? 'border-primary/50' : ''}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="mt-0.5"
          />
          <Collapsible open={isExpanded} onOpenChange={onToggleExpand} className="flex-1">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">
                  {suggestion.name}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {GROUP_TYPE_LABELS[suggestion.group_type] || suggestion.group_type}
                  </Badge>
                  <Badge
                    variant={getConfidenceBadge(suggestion.confidence)}
                    className="text-xs"
                  >
                    {Math.round(suggestion.confidence * 100)}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {suggestion.variables.length} vars
                  </span>
                </div>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="mt-2 space-y-2">
              <div className="text-xs text-muted-foreground">
                {groupingT?.detectionMethod || 'Método'}:{' '}
                <span className="font-medium">{suggestion.detection_method}</span>
              </div>

              <div className="flex flex-wrap gap-1">
                {suggestion.variables.map((v) => (
                  <Badge key={v} variant="secondary" className="text-xs font-mono">
                    {v}
                  </Badge>
                ))}
              </div>

              {suggestion.sub_groups && suggestion.sub_groups.length > 0 && (
                <div className="space-y-1 pt-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {groupingT?.subGroups || 'Sub-grupos'}:
                  </p>
                  {suggestion.sub_groups.map((sg, i) => (
                    <div key={i} className="text-xs pl-2 border-l-2 border-muted">
                      <span className="font-medium">{sg.name}</span>:{' '}
                      {sg.variables.join(', ')}
                    </div>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardHeader>
    </Card>
  );
}
