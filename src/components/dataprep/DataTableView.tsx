import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Loader2, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useDataTable } from '@/hooks/useDataTable';
import { ColumnDistributionSheet } from './ColumnDistributionSheet';
import type { ColumnMeta } from '@/hooks/useDataTable';

export interface RulePrefill {
  rule_type: string;
  config: Record<string, unknown>;
}

interface DataTableViewProps {
  projectId: string;
  onCreateRule: (prefill: RulePrefill) => void;
}

const LIMIT = 50;

export function DataTableView({ projectId, onCreateRule }: DataTableViewProps) {
  const { t } = useLanguage();
  const dt = (t.dataPrep as Record<string, unknown>).dataTab as Record<string, string> | undefined;

  const {
    tableData,
    isLoading,
    error,
    distributionData,
    isDistLoading,
    fetchData,
    fetchDistribution,
    clearDistribution,
  } = useDataTable(projectId);

  const [offset, setOffset] = useState(0);
  const [prepared, setPrepared] = useState(false);
  const [distOpen, setDistOpen] = useState(false);

  useEffect(() => {
    fetchData(offset, LIMIT, prepared);
  }, [fetchData, offset, prepared]);

  const handleViewDistribution = useCallback(
    async (colName: string) => {
      await fetchDistribution(colName);
      setDistOpen(true);
    },
    [fetchDistribution]
  );

  const totalRows = tableData?.total_rows || 0;
  const totalCols = tableData?.columns.length || 0;
  const currentEnd = Math.min(offset + LIMIT, totalRows);

  const renderCellValue = (row: Record<string, unknown>, col: ColumnMeta) => {
    const raw = row[col.name];
    const label = row[`${col.name}__label`] as string | undefined;

    if (raw == null || raw === '' || (typeof raw === 'number' && isNaN(raw))) {
      return <span className="italic text-muted-foreground">—</span>;
    }

    if (col.type === 'categorical' && label) {
      return (
        <span>
          {label}{' '}
          <span className="text-muted-foreground">({String(raw)})</span>
        </span>
      );
    }

    return <span>{String(raw)}</span>;
  };

  if (error) {
    return (
      <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="prepared-toggle" className="text-sm cursor-pointer">
              {prepared
                ? (dt?.preparedData || 'Prepared Data')
                : (dt?.originalData || 'Original Data')}
            </Label>
            <Switch
              id="prepared-toggle"
              checked={prepared}
              onCheckedChange={(v) => { setPrepared(v); setOffset(0); }}
            />
          </div>
          {totalRows > 0 && (
            <Badge variant="outline" className="text-xs">
              {totalRows.toLocaleString()} {dt?.rows || 'rows'} × {totalCols} {dt?.columns || 'columns'}
            </Badge>
          )}
        </div>

        {/* Pagination */}
        {totalRows > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {dt?.showing || 'Showing'} {(offset + 1).toLocaleString()}-{currentEnd.toLocaleString()} {dt?.of || 'of'} {totalRows.toLocaleString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={offset + LIMIT >= totalRows}
              onClick={() => setOffset(offset + LIMIT)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tableData && tableData.rows.length > 0 ? (
        <ScrollArea className="border rounded-md" style={{ maxHeight: 'calc(100vh - 340px)' }}>
          <div className="min-w-max">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-background border-b">
                <tr>
                  {tableData.columns.map((col) => (
                    <ContextMenu key={col.name}>
                      <ContextMenuTrigger asChild>
                        <th className="px-3 py-2 text-left whitespace-nowrap cursor-context-menu hover:bg-muted/50 transition-colors">
                          <div className="font-semibold">{col.name}</div>
                          {col.label && (
                            <div className="text-xs text-muted-foreground font-normal">{col.label}</div>
                          )}
                        </th>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => handleViewDistribution(col.name)}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          {dt?.viewDistribution || 'View Distribution'}
                        </ContextMenuItem>
                        <ContextMenuSub>
                          <ContextMenuSubTrigger>
                            {dt?.createCleaningRule || 'Create Cleaning Rule'}
                          </ContextMenuSubTrigger>
                          <ContextMenuSubContent>
                            <ContextMenuItem
                              onClick={() =>
                                onCreateRule({
                                  rule_type: 'cleaning',
                                  config: { variable: col.name, operator: 'is_null', action: 'drop' },
                                })
                              }
                            >
                              {dt?.dropNull || 'Drop null rows'}
                            </ContextMenuItem>
                            <ContextMenuItem
                              onClick={() =>
                                onCreateRule({
                                  rule_type: 'cleaning',
                                  config: { variable: col.name, operator: 'is_duplicate', action: 'drop' },
                                })
                              }
                            >
                              {dt?.dropDuplicate || 'Drop duplicate rows'}
                            </ContextMenuItem>
                          </ContextMenuSubContent>
                        </ContextMenuSub>
                        <ContextMenuItem
                          onClick={() =>
                            onCreateRule({
                              rule_type: 'net',
                              config: { variable: col.name },
                            })
                          }
                        >
                          {dt?.createNet || 'Create Net/Top Box'}
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() =>
                            onCreateRule({
                              rule_type: 'recode',
                              config: { variable: col.name },
                            })
                          }
                        >
                          {dt?.createRecode || 'Create Recode'}
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? '' : 'bg-muted/30'}>
                    {tableData.columns.map((col) => (
                      <ContextMenu key={col.name}>
                        <ContextMenuTrigger asChild>
                          <td
                            className={`px-3 py-1.5 whitespace-nowrap cursor-context-menu ${
                              col.type === 'numeric' ? 'text-right font-mono' : ''
                            }`}
                          >
                            {renderCellValue(row, col)}
                          </td>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          {row[col.name] != null && (
                            <>
                              <ContextMenuItem
                                onClick={() =>
                                  onCreateRule({
                                    rule_type: 'cleaning',
                                    config: {
                                      variable: col.name,
                                      operator: 'equals',
                                      value: row[col.name],
                                      action: 'filter',
                                    },
                                  })
                                }
                              >
                                {dt?.keepOnly || 'Keep only'} &quot;{String(row[`${col.name}__label`] || row[col.name])}&quot;
                              </ContextMenuItem>
                              <ContextMenuItem
                                onClick={() =>
                                  onCreateRule({
                                    rule_type: 'cleaning',
                                    config: {
                                      variable: col.name,
                                      operator: 'equals',
                                      value: row[col.name],
                                      action: 'drop',
                                    },
                                  })
                                }
                              >
                                {dt?.exclude || 'Exclude'} &quot;{String(row[`${col.name}__label`] || row[col.name])}&quot;
                              </ContextMenuItem>
                            </>
                          )}
                          <ContextMenuItem onClick={() => handleViewDistribution(col.name)}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            {dt?.viewDistribution || 'View Distribution'}
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {dt?.noData || 'No data available'}
        </div>
      )}

      {/* Distribution sheet */}
      <ColumnDistributionSheet
        open={distOpen}
        onOpenChange={(open) => { setDistOpen(open); if (!open) clearDistribution(); }}
        data={distributionData}
        isLoading={isDistLoading}
      />
    </div>
  );
}
