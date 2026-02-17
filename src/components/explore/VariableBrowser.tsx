import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Star } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { ExploreVariable, ExploreVariableGroup } from '@/types/explore';

interface VariableBrowserProps {
  variables: ExploreVariable[];
  groups: ExploreVariableGroup[];
  banners: string[];
  selectedVariable: string | null;
  onSelectVariable: (variable: ExploreVariable) => void;
}

const TYPE_COLORS: Record<string, string> = {
  numeric: 'bg-blue-100 text-blue-700',
  categorical: 'bg-purple-100 text-purple-700',
  string: 'bg-green-100 text-green-700',
  date: 'bg-orange-100 text-orange-700',
};

export function VariableBrowser({
  variables,
  groups,
  banners,
  selectedVariable,
  onSelectVariable,
}: VariableBrowserProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  const filteredVariables = useMemo(() => {
    let result = variables;

    // Group filter
    if (groupFilter !== 'all') {
      const group = groups.find((g) => g.name === groupFilter);
      if (group) {
        const groupVars = new Set(group.variables);
        result = result.filter((v) => groupVars.has(v.name));
      }
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.label && v.label.toLowerCase().includes(q)) ||
          (v.question_text && v.question_text.toLowerCase().includes(q))
      );
    }

    return result;
  }, [variables, groups, groupFilter, search]);

  const bannerSet = useMemo(() => new Set(banners), [banners]);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 space-y-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.explore?.searchVariables || 'Buscar variables...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {groups.length > 0 && (
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={t.explore?.allGroups || 'Todos los grupos'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.explore?.allGroups || 'Todos los grupos'}</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.name} value={g.name}>
                  {g.name} ({g.variables.length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Variable count */}
      <div className="px-3 py-1.5 text-xs text-muted-foreground border-b">
        {filteredVariables.length} / {variables.length} {t.explore?.variables || 'variables'}
      </div>

      {/* Variable list */}
      <ScrollArea className="flex-1">
        <div className="p-1">
          {filteredVariables.map((v) => (
            <button
              key={v.name}
              onClick={() => onSelectVariable(v)}
              className={`w-full text-left p-2.5 rounded-md mb-0.5 transition-colors text-sm ${
                selectedVariable === v.name
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-medium truncate">
                  {v.name}
                </span>
                {bannerSet.has(v.name) && (
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                )}
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1 py-0 ml-auto flex-shrink-0 ${
                    TYPE_COLORS[v.type] || ''
                  }`}
                >
                  {v.detected_type || v.type}
                </Badge>
              </div>
              {v.label && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {v.label}
                </p>
              )}
              {v.pct_missing > 0 && (
                <span className="text-[10px] text-orange-600">
                  {v.pct_missing.toFixed(1)}% missing
                </span>
              )}
            </button>
          ))}

          {filteredVariables.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              {t.common?.noResults || 'No se encontraron resultados'}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
