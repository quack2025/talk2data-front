import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { GROUP_TYPE_LABELS } from '@/types/variableGroups';
import type { VariableLabelMap } from '@/hooks/useProjectVariables';
import type {
  SubGroupDefinition,
  VariableGroupCreate,
  VariableGroup,
} from '@/types/variableGroups';

interface ManualGrouperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableVariables: string[];
  variableLabels?: VariableLabelMap;
  onSave: (group: VariableGroupCreate) => Promise<void>;
  editingGroup?: VariableGroup | null;
  isSaving?: boolean;
}

const GROUP_TYPES = ['awareness', 'grid', 'ranking', 'scale', 'custom'];

export function ManualGrouper({
  open,
  onOpenChange,
  availableVariables,
  variableLabels = {},
  onSave,
  editingGroup,
  isSaving = false,
}: ManualGrouperProps) {
  const { t, language } = useLanguage();
  const groupingT = t.grouping;

  const getVarDisplay = (name: string) => {
    const label = variableLabels[name];
    return label ? `${name} (${label})` : name;
  };

  const [name, setName] = useState(editingGroup?.name || '');
  const [description, setDescription] = useState(editingGroup?.description || '');
  const [groupType, setGroupType] = useState(editingGroup?.group_type || 'custom');
  const [selectedVars, setSelectedVars] = useState<string[]>(
    editingGroup?.variables || []
  );
  const [subGroups, setSubGroups] = useState<SubGroupDefinition[]>(
    editingGroup?.sub_groups || []
  );
  const [filterText, setFilterText] = useState('');

  // Sync form state when editingGroup changes (useState ignores initial value on re-render)
  useEffect(() => {
    setName(editingGroup?.name || '');
    setDescription(editingGroup?.description || '');
    setGroupType(editingGroup?.group_type || 'custom');
    setSelectedVars(editingGroup?.variables || []);
    setSubGroups(editingGroup?.sub_groups || []);
  }, [editingGroup]);
  const [newSubGroupName, setNewSubGroupName] = useState('');

  const unselectedVars = availableVariables.filter(
    (v) => !selectedVars.includes(v)
  );
  const filteredAvailable = unselectedVars.filter((v) => {
    const search = filterText.toLowerCase();
    return v.toLowerCase().includes(search) || (variableLabels[v]?.toLowerCase().includes(search) ?? false);
  });

  const addVariable = (varName: string) => {
    setSelectedVars((prev) => [...prev, varName]);
  };

  const removeVariable = (varName: string) => {
    setSelectedVars((prev) => prev.filter((v) => v !== varName));
    setSubGroups((prev) =>
      prev.map((sg) => ({
        ...sg,
        variables: sg.variables.filter((v) => v !== varName),
      }))
    );
  };

  const addAllFiltered = () => {
    setSelectedVars((prev) => [...prev, ...filteredAvailable]);
  };

  const removeAll = () => {
    setSelectedVars([]);
    setSubGroups([]);
  };

  const addSubGroup = () => {
    if (!newSubGroupName.trim()) return;
    setSubGroups((prev) => [
      ...prev,
      { name: newSubGroupName.trim(), variables: [] },
    ]);
    setNewSubGroupName('');
  };

  const removeSubGroup = (index: number) => {
    setSubGroups((prev) => prev.filter((_, i) => i !== index));
  };

  const assignToSubGroup = (varName: string, subGroupIndex: number) => {
    setSubGroups((prev) =>
      prev.map((sg, i) => {
        if (i === subGroupIndex) {
          return sg.variables.includes(varName)
            ? sg
            : { ...sg, variables: [...sg.variables, varName] };
        }
        return { ...sg, variables: sg.variables.filter((v) => v !== varName) };
      })
    );
  };

  const unassignFromSubGroup = (varName: string, subGroupIndex: number) => {
    setSubGroups((prev) =>
      prev.map((sg, i) =>
        i === subGroupIndex
          ? { ...sg, variables: sg.variables.filter((v) => v !== varName) }
          : sg
      )
    );
  };

  const handleSave = async () => {
    const cleanedSubGroups = subGroups.filter(
      (sg) => sg.variables.length > 0
    );
    await onSave({
      name: name.trim(),
      group_type: groupType,
      description: description.trim() || null,
      variables: selectedVars,
      sub_groups: cleanedSubGroups.length > 0 ? cleanedSubGroups : null,
    });
    onOpenChange(false);
  };

  const canSave = name.trim().length > 0 && selectedVars.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] max-h-[750px] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle>
            {editingGroup
              ? groupingT?.editGroup || 'Editar grupo'
              : groupingT?.createGroup || 'Crear grupo de variables'}
          </DialogTitle>
          <DialogDescription>
            {groupingT?.manualDescription ||
              'Selecciona variables y organízalas en sub-grupos'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden px-4">
          <div className="space-y-4 h-full flex flex-col">
            {/* Name + Type row */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="space-y-1">
                <Label htmlFor="group-name">
                  {groupingT?.groupName || 'Nombre'}
                </Label>
                <Input
                  id="group-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'en' ? 'E.g.: Brand Awareness' : 'Ej: Conocimiento de Marcas'}
                  maxLength={255}
                />
              </div>
              <div className="space-y-1">
                <Label>{groupingT?.groupType || 'Tipo'}</Label>
                <Select 
                  value={groupType} 
                  onValueChange={(value) => {
                    if (GROUP_TYPES.includes(value as typeof GROUP_TYPES[number])) {
                      setGroupType(value as 'awareness' | 'custom' | 'grid' | 'ranking' | 'scale');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {GROUP_TYPE_LABELS[type]?.[language] || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1 shrink-0">
              <Label htmlFor="group-desc">
                {groupingT?.descriptionLabel || 'Descripción (opcional)'}
              </Label>
              <Input
                id="group-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'en' ? 'E.g.: Variables Q5_1 to Q5_15 from the brands section' : 'Ej: Variables Q5_1 a Q5_15 de la sección de marcas'}
              />
            </div>

            <Separator className="shrink-0" />

            {/* Variable picker: two columns */}
            <div className="flex-1 min-h-0 grid grid-cols-2 gap-3">
              {/* Available variables */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">
                    {groupingT?.available || 'Disponibles'} ({unselectedVars.length})
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={addAllFiltered}
                    disabled={filteredAvailable.length === 0}
                  >
                    {groupingT?.addAll || 'Agregar todas'}
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <Input
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder={t.common.search + '...'}
                  className="mb-1 h-8 text-sm"
                />
                <ScrollArea className="flex-1 border rounded-md p-1">
                  <div className="space-y-0.5">
                    {filteredAvailable.map((v) => (
                      <button
                        key={v}
                        className="w-full text-left px-2 py-1 text-xs font-mono rounded hover:bg-accent transition-colors"
                        onClick={() => addVariable(v)}
                        title={variableLabels[v] ? `${v} (${variableLabels[v]})` : v}
                      >
                        <span className="font-mono">{v}</span>
                        {variableLabels[v] && <span className="text-muted-foreground ml-1 font-sans truncate">({variableLabels[v]})</span>}
                      </button>
                    ))}
                    {filteredAvailable.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        {t.common.noResults}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Selected variables */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-muted-foreground">
                    {groupingT?.selected || 'Seleccionadas'} ({selectedVars.length})
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={removeAll}
                    disabled={selectedVars.length === 0}
                  >
                    <ChevronLeft className="mr-1 h-3 w-3" />
                    {groupingT?.removeAll || 'Quitar todas'}
                  </Button>
                </div>
                <ScrollArea className="flex-1 border rounded-md p-1">
                  <div className="space-y-0.5">
                    {selectedVars.map((v) => (
                      <div
                        key={v}
                        className="flex items-center justify-between px-2 py-1 rounded hover:bg-accent group"
                        title={variableLabels[v] ? `${v} (${variableLabels[v]})` : v}
                      >
                        <span className="text-xs font-mono shrink-0">{v}</span>
                        {variableLabels[v] && <span className="text-xs text-muted-foreground ml-1 truncate">({variableLabels[v]})</span>}
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeVariable(v)}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Sub-groups section */}
            {selectedVars.length > 0 && (
              <div className="shrink-0 space-y-2">
                <Separator />
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    {groupingT?.subGroups || 'Sub-grupos'} ({subGroups.length})
                  </Label>
                  <div className="flex gap-1 items-center">
                    <Input
                      value={newSubGroupName}
                      onChange={(e) => setNewSubGroupName(e.target.value)}
                      placeholder={groupingT?.subGroupName || 'Nombre del sub-grupo'}
                      className="h-7 text-xs w-40"
                      onKeyDown={(e) => e.key === 'Enter' && addSubGroup()}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7"
                      onClick={addSubGroup}
                      disabled={!newSubGroupName.trim()}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {subGroups.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {subGroups.map((sg, sgIndex) => (
                      <div
                        key={sgIndex}
                        className="border rounded-md p-2 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{sg.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => removeSubGroup(sgIndex)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {sg.variables.map((v) => (
                            <Badge
                              key={v}
                              variant="secondary"
                              className="text-xs font-mono cursor-pointer"
                              onClick={() => unassignFromSubGroup(v, sgIndex)}
                            >
                              {v} <X className="ml-1 h-2 w-2" />
                            </Badge>
                          ))}
                          <Select
                            onValueChange={(v) => assignToSubGroup(v, sgIndex)}
                          >
                            <SelectTrigger className="h-5 w-20 text-xs border-dashed">
                              <Plus className="h-3 w-3" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedVars
                                .filter(
                                  (v) =>
                                    !subGroups.some((s) =>
                                      s.variables.includes(v)
                                    )
                                )
                                .map((v) => (
                                  <SelectItem key={v} value={v} className="text-xs font-mono">
                                    {v}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-4 py-3 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
