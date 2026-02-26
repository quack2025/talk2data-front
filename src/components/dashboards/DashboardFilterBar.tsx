/**
 * DashboardFilterBar — filter controls for dashboard viewers.
 *
 * Renders dropdown/multi-select controls based on the dashboard's
 * global_filters configuration.  Calls onFilterChange when values change.
 *
 * Sprint 18a (Global filters)
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import type { GlobalFilterConfig } from '@/types/dashboard';

interface FilterValue {
  value: unknown;
  label: string;
}

interface DashboardFilterBarProps {
  filters: GlobalFilterConfig[];
  filterOptions: Record<string, FilterValue[]>;
  onFilterChange: (activeFilters: Array<{ variable: string; values: unknown[] }>) => void;
  isLoading?: boolean;
}

export function DashboardFilterBar({
  filters,
  filterOptions,
  onFilterChange,
  isLoading,
}: DashboardFilterBarProps) {
  const [selected, setSelected] = useState<Record<string, unknown[]>>({});

  const handleSelect = useCallback(
    (variable: string, value: string, filterType: string) => {
      setSelected((prev) => {
        const next = { ...prev };

        if (filterType === 'multi_select') {
          const current = prev[variable] || [];
          if (current.includes(value)) {
            next[variable] = current.filter((v) => v !== value);
          } else {
            next[variable] = [...current, value];
          }
        } else {
          // dropdown: single value
          if (prev[variable]?.[0] === value) {
            delete next[variable];
          } else {
            next[variable] = [value];
          }
        }

        return next;
      });
    },
    [],
  );

  const handleClear = useCallback(() => {
    setSelected({});
  }, []);

  // Trigger filter change when selection changes
  useEffect(() => {
    const activeFilters = Object.entries(selected)
      .filter(([, vals]) => vals.length > 0)
      .map(([variable, values]) => ({ variable, values }));
    onFilterChange(activeFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  if (filters.length === 0) return null;

  const hasActive = Object.values(selected).some((v) => v.length > 0);

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 border rounded-lg bg-muted/20">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
        <Filter className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Filters</span>
      </div>

      {filters.map((filter) => {
        const options = filterOptions[filter.variable] || [];
        const currentValues = selected[filter.variable] || [];

        if (filter.filter_type === 'multi_select') {
          return (
            <div key={filter.variable} className="space-y-1">
              <span className="text-[10px] text-muted-foreground">{filter.label}</span>
              <div className="flex flex-wrap gap-1">
                {options.map((opt) => {
                  const isActive = currentValues.includes(String(opt.value));
                  return (
                    <Badge
                      key={String(opt.value)}
                      variant={isActive ? 'default' : 'outline'}
                      className="text-[10px] cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() =>
                        handleSelect(filter.variable, String(opt.value), 'multi_select')
                      }
                    >
                      {opt.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          );
        }

        // Default: dropdown
        return (
          <div key={filter.variable} className="min-w-[140px]">
            <Select
              value={currentValues[0] != null ? String(currentValues[0]) : ''}
              onValueChange={(v) => handleSelect(filter.variable, v, 'dropdown')}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem
                    key={String(opt.value)}
                    value={String(opt.value)}
                    className="text-xs"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}

      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1 text-muted-foreground"
          onClick={handleClear}
          disabled={isLoading}
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}

      {isLoading && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}
    </div>
  );
}
