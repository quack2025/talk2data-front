import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Lightbulb,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { PrepSuggestion, PrepSuggestionsResponse } from '@/types/dataPrep';
import { toast } from 'sonner';

interface SuggestionsPanelProps {
  projectId: string;
  getSuggestions: (studyType?: string) => Promise<PrepSuggestionsResponse>;
  applySuggestions: (ids: string[]) => Promise<any>;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500/10 text-red-600 border-red-200',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-200',
  low: 'bg-blue-500/10 text-blue-600 border-blue-200',
};

const CATEGORY_COLORS: Record<string, string> = {
  qc: 'bg-red-100 text-red-700',
  net: 'bg-green-100 text-green-700',
  recode: 'bg-purple-100 text-purple-700',
  cleaning: 'bg-orange-100 text-orange-700',
  weight: 'bg-blue-100 text-blue-700',
  computed: 'bg-amber-100 text-amber-700',
};

export function SuggestionsPanel({
  projectId,
  getSuggestions,
  applySuggestions,
}: SuggestionsPanelProps) {
  const { t } = useLanguage();
  const dpT = t.dataPrep as any;

  const [data, setData] = useState<PrepSuggestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await getSuggestions();
      setData(res);
      // Auto-select high priority
      const highIds = res.suggestions
        .filter((s) => s.priority === 'high')
        .map((s) => s.id);
      setSelected(new Set(highIds));
    } catch {
      // handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!data) return;
    setSelected(new Set(data.suggestions.map((s) => s.id)));
  };

  const selectNone = () => setSelected(new Set());

  const handleApply = async () => {
    if (selected.size === 0) return;
    setIsApplying(true);
    try {
      const res = await applySuggestions(Array.from(selected));
      toast.success(
        dpT?.suggestionsApplied
          ? `${res.rules_created} ${dpT.suggestionsApplied}`
          : `${res.rules_created} rules created`
      );
      if (res.warnings?.length) {
        res.warnings.forEach((w: string) => toast.warning(w));
      }
      // Reload suggestions (some may no longer apply)
      await load();
    } catch {
      toast.error(dpT?.suggestionsError || 'Error applying suggestions');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          {dpT?.analyzingData || 'Analyzing data...'}
        </span>
      </div>
    );
  }

  if (!data || data.suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
          <p className="text-sm text-muted-foreground">
            {dpT?.noSuggestions || 'No suggestions — your data is ready!'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with counts */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">
            {data.total_suggestions} {dpT?.suggestionsFound || 'suggestions'}
          </span>
          {Object.entries(data.by_category).map(([cat, count]) =>
            count > 0 ? (
              <Badge key={cat} variant="outline" className={`text-xs ${CATEGORY_COLORS[cat] || ''}`}>
                {cat} ({count})
              </Badge>
            ) : null
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={selectAll}>
            {dpT?.selectAll || 'All'}
          </Button>
          <Button variant="ghost" size="sm" onClick={selectNone}>
            {dpT?.selectNone || 'None'}
          </Button>
        </div>
      </div>

      {/* Suggestion list */}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-2 pr-2">
          {data.suggestions.map((s) => (
            <Card
              key={s.id}
              className={`transition-colors ${selected.has(s.id) ? 'border-primary/50 bg-primary/5' : ''}`}
            >
              <CardHeader className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selected.has(s.id)}
                    onCheckedChange={() => toggleSelect(s.id)}
                  />
                  <button
                    className="flex items-center gap-2 flex-1 text-left min-w-0"
                    onClick={() => toggleExpand(s.id)}
                  >
                    {expanded.has(s.id) ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate">{s.title}</span>
                  </button>
                  <Badge variant="outline" className={`text-xs shrink-0 ${PRIORITY_COLORS[s.priority] || ''}`}>
                    {s.priority}
                  </Badge>
                  <Badge variant="outline" className={`text-xs shrink-0 ${CATEGORY_COLORS[s.category] || ''}`}>
                    {s.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {Math.round(s.confidence * 100)}%
                  </span>
                </div>
              </CardHeader>
              {expanded.has(s.id) && (
                <CardContent className="pt-0 pb-3 px-3 pl-9">
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                  <p className="text-xs text-muted-foreground mt-1 italic">{s.reasoning}</p>
                  {s.affected_variable && (
                    <p className="text-xs mt-1">
                      <code className="bg-muted px-1 py-0.5 rounded">{s.affected_variable}</code>
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Apply button */}
      <Button
        className="w-full"
        disabled={selected.size === 0 || isApplying}
        onClick={handleApply}
      >
        {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {dpT?.applySuggestions || 'Apply selected'} ({selected.size})
      </Button>
    </div>
  );
}
