import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { VariableCheckbox } from './VariableCheckbox';
import { ChevronLeft, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useVariableGroups } from '@/hooks/useVariableGroups';
import type { AnalysisVariable } from '@/types/aggfile';
import type { VariableGroup } from '@/types/variableGroups';

interface AnalysisVariablesStepProps {
  projectId: string;
  variables: AnalysisVariable[];
  selectedAnalysis: string[] | 'all';
  selectedGroups: string[];
  isLoading: boolean;
  onToggle: (name: string) => void;
  onToggleGroup: (groupId: string, groupVars: string[]) => void;
  onSetMode: (mode: 'all' | 'selected') => void;
  onBack: () => void;
  onNext: () => void;
  onFetch: () => void;
  canProceed: boolean;
}

export function AnalysisVariablesStep({
  projectId,
  variables,
  selectedAnalysis,
  selectedGroups,
  isLoading,
  onToggle,
  onToggleGroup,
  onSetMode,
  onBack,
  onNext,
  onFetch,
  canProceed,
}: AnalysisVariablesStepProps) {
  const { t } = useLanguage();
  const { groups, fetchGroups, isLoading: isLoadingGroups } = useVariableGroups(projectId);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    onFetch();
    fetchGroups();
  }, [onFetch, fetchGroups]);

  const isAllMode = selectedAnalysis === 'all';
  const hasGroups = groups.length > 0;

  // Build set of variables that belong to any group
  const groupedVars = new Set<string>();
  groups.forEach((g) => g.variables.forEach((v) => groupedVars.add(v)));

  // Variables not in any group
  const ungroupedVars = variables.filter((v) => !groupedVars.has(v.name));

  const toggleExpanded = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  if (isLoading || isLoadingGroups) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-4 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 space-y-1">
        <h3 className="font-semibold">
          {t.aggfile?.step2Title || 'Select questions to analyze'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {hasGroups
            ? (t.aggfile?.step2DescriptionGroups || 'Select question groups to cross with the banner variables')
            : (t.aggfile?.step2Description || 'Choose which questions to cross with the banner variables')}
        </p>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 pb-4">
          {/* Analysis mode selection */}
          <div className="space-y-3">
            <RadioGroup
              value={isAllMode ? 'all' : 'selected'}
              onValueChange={(v) => onSetMode(v as 'all' | 'selected')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer">
                  {t.aggfile?.allQuestions || 'All questions'} ({variables.length})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="selected" id="selected" />
                <Label htmlFor="selected" className="cursor-pointer">
                  {t.aggfile?.onlySelected || 'Only selected'}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Variable list (only when "selected" mode) */}
          {!isAllMode && hasGroups && (
            <div className="space-y-3">
              {/* Variable groups */}
              {groups.map((group) => {
                const isGroupSelected = selectedGroups.includes(group.id);
                const isExpanded = expandedGroups.has(group.id);
                const groupVarsInDataset = group.variables.filter((v) =>
                  variables.some((av) => av.name === v)
                );

                return (
                  <div key={group.id} className="border rounded-md">
                    <div className="flex items-center gap-2 p-3 hover:bg-muted/50">
                      <Checkbox
                        id={`group-${group.id}`}
                        checked={isGroupSelected}
                        onCheckedChange={() => onToggleGroup(group.id, groupVarsInDataset)}
                      />
                      <button
                        type="button"
                        className="flex-1 flex items-center gap-2 text-left"
                        onClick={() => toggleExpanded(group.id)}
                      >
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{group.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({groupVarsInDataset.length} {t.aggfile?.variables || 'variables'})
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-3 pl-10 space-y-1 border-t">
                        {groupVarsInDataset.map((varName) => {
                          const varInfo = variables.find((v) => v.name === varName);
                          return (
                            <div key={varName} className="text-xs text-muted-foreground py-0.5">
                              <span className="font-mono">{varName}</span>
                              {varInfo?.label && varInfo.label !== varName && (
                                <span className="ml-2">{varInfo.label}</span>
                              )}
                            </div>
                          );
                        })}
                        {group.sub_groups && group.sub_groups.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {group.sub_groups.map((sg) => (
                              <div key={sg.name} className="text-xs">
                                <span className="font-medium text-muted-foreground">{sg.name}:</span>
                                <span className="ml-1 text-muted-foreground">
                                  {sg.variables.length} vars
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Ungrouped variables */}
              {ungroupedVars.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t.aggfile?.ungroupedVars || 'Ungrouped variables'}
                  </p>
                  {ungroupedVars.map((variable) => (
                    <VariableCheckbox
                      key={variable.name}
                      name={variable.name}
                      label={variable.label}
                      nValues={variable.n_values}
                      checked={
                        Array.isArray(selectedAnalysis) &&
                        selectedAnalysis.includes(variable.name)
                      }
                      onChange={onToggle}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Flat list when no groups exist */}
          {!isAllMode && !hasGroups && (
            <div className="space-y-2 pl-4">
              {variables.map((variable) => (
                <VariableCheckbox
                  key={variable.name}
                  name={variable.name}
                  label={variable.label}
                  nValues={variable.n_values}
                  checked={
                    Array.isArray(selectedAnalysis) &&
                    selectedAnalysis.includes(variable.name)
                  }
                  onChange={onToggle}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-2">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          {t.common.back}
        </Button>
        <Button onClick={onNext} disabled={!canProceed} className="flex-1">
          {t.common.continue}
        </Button>
      </div>
    </div>
  );
}
