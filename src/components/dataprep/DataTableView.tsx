import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Loader2, ChevronLeft, ChevronRight, BarChart3, Columns3, Check, Search, Download, Tags, EyeOff, FileSpreadsheet, FolderOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/i18n/LanguageContext';
import { useDataTable } from '@/hooks/useDataTable';
import { ColumnDistributionSheet } from './ColumnDistributionSheet';
import type { ColumnMeta } from '@/hooks/useDataTable';
import type { ExploreVariableGroup } from '@/types/explore';

export interface RulePrefill {
  rule_type: string;
  config: Record<string, unknown>;
}

interface DataTableViewProps {
  projectId: string;
  groups?: ExploreVariableGroup[];
  onCreateRule: (prefill: RulePrefill) => void;
}

const LIMIT = 50;

export function DataTableView({ projectId, groups = [], onCreateRule }: DataTableViewProps) {
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
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [pendingHiddenCols, setPendingHiddenCols] = useState<Set<string> | null>(null);
  const [colSearch, setColSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [groupFilter, setGroupFilter] = useState<string>('all');

  const allColumns = tableData?.columns ?? [];
  const visibleColumns = allColumns.filter(c => {
    if (hiddenCols.has(c.name)) return false;
    if (groupFilter !== 'all') {
      const group = groups.find((g) => g.name === groupFilter);
      if (group && !group.variables.includes(c.name)) return false;
    }
    return true;
  });
  const filteredColumns = allColumns.filter(col => {
    const q = colSearch.toLowerCase();
    return col.name.toLowerCase().includes(q) || (col.label && col.label.toLowerCase().includes(q));
  });

  const editingHiddenCols = pendingHiddenCols ?? hiddenCols;

  const toggleColumn = (colName: string) => {
    const base = pendingHiddenCols ?? new Set(hiddenCols);
    const next = new Set(base);
    if (next.has(colName)) next.delete(colName);
    else next.add(colName);
    setPendingHiddenCols(next);
  };

  const applyColumnSelection = () => {
    if (pendingHiddenCols) {
      setHiddenCols(pendingHiddenCols);
      setPendingHiddenCols(null);
    }
  };

  const cancelColumnSelection = () => {
    setPendingHiddenCols(null);
  };

  const showAllColumns = () => setPendingHiddenCols(new Set());

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

  const handleExportExcel = useCallback(async (labelFormat: 'value' | 'label' | 'both') => {
    setIsExporting(true);
    try {
      const blob = await api.downloadBlob(
        `/projects/${projectId}/data-prep/export-excel?prepared=${prepared}&label_format=${labelFormat}`,
        'GET'
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data_${prepared ? 'prepared' : 'original'}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(dt?.exportSuccess || 'Excel file downloaded');
    } catch (e) {
      toast.error(dt?.exportError || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [projectId, prepared, dt]);

  const totalRows = tableData?.total_rows || 0;
  const totalCols = tableData?.columns.length || 0;
  const currentEnd = Math.min(offset + LIMIT, totalRows);

  const renderCellValue = (row: Record<string, unknown>, col: ColumnMeta) => {
    const raw = row[col.name];
    if (raw == null || raw === '' || (typeof raw === 'number' && isNaN(raw))) {
      return <span className="italic text-muted-foreground">—</span>;
    }

    if (showLabels) {
      let label = row[`${col.name}__label`] as string | undefined;
      if (!label && col.value_labels && raw != null) {
        label = col.value_labels[String(raw)];
      }
      if (label) {
        return (
          <span>
            {label}{' '}
            <span className="text-muted-foreground">({String(raw)})</span>
          </span>
        );
      }
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
          <div className="flex items-center gap-2">
            <Switch
              id="labels-toggle"
              checked={showLabels}
              onCheckedChange={setShowLabels}
            />
            <Label htmlFor="labels-toggle" className="text-sm cursor-pointer flex items-center gap-1">
              <Tags className="h-3.5 w-3.5" />
              {dt?.valueLabels || 'Value Labels'}
            </Label>
          </div>
          {totalRows > 0 && (
            <Badge variant="outline" className="text-xs">
              {totalRows.toLocaleString()} {dt?.rows || 'rows'} × {totalCols} {dt?.columns || 'columns'}
            </Badge>
          )}
          {/* Group filter */}
          {groups.length > 0 && (
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="h-7 w-auto min-w-[140px] text-xs gap-1.5">
                <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                <SelectValue placeholder={dt?.allGroups || 'All groups'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dt?.allGroups || 'All groups'}</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.name} value={g.name}>
                    {g.name} ({g.variables.length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {/* Column selector */}
          {allColumns.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                  <Columns3 className="h-3.5 w-3.5" />
                  {dt?.columnSelector || 'Column Selector'}
                  {hiddenCols.size > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {allColumns.length - hiddenCols.size}/{allColumns.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64" onCloseAutoFocus={() => { setColSearch(''); cancelColumnSelection(); }}>
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-1.5 rounded-md border border-input bg-background px-2 h-7">
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <input
                      className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                      placeholder={dt?.searchColumns || 'Search columns...'}
                      value={colSearch}
                      onChange={(e) => setColSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="flex items-center justify-between py-1">
                  <span className="text-xs">{dt?.selectColumns || 'Select columns'}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-xs px-1.5"
                      onClick={() => {
                        const base = pendingHiddenCols ?? new Set(hiddenCols);
                        const inverted = new Set(allColumns.filter(c => !base.has(c.name)).map(c => c.name));
                        setPendingHiddenCols(inverted);
                      }}
                    >
                      {dt?.invertSelection || 'Invert'}
                    </Button>
                    {editingHiddenCols.size > 0 && (
                      <Button variant="ghost" size="sm" className="h-5 text-xs px-1.5" onClick={showAllColumns}>
                        {dt?.showAll || 'Show all'}
                      </Button>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-60 overflow-y-auto">
                  {filteredColumns.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                      {dt?.noColumnsFound || 'No columns found'}
                    </div>
                  ) : (
                    filteredColumns.map((col) => (
                      <DropdownMenuCheckboxItem
                        key={col.name}
                        checked={!editingHiddenCols.has(col.name)}
                        onCheckedChange={() => toggleColumn(col.name)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <span className="font-mono text-xs">{col.name}</span>
                        {col.label && (
                          <span className="ml-1.5 text-muted-foreground text-xs truncate max-w-[140px]">
                            {col.label}
                          </span>
                        )}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </div>
                {pendingHiddenCols && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="flex items-center justify-end gap-1.5 px-2 py-1.5">
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={cancelColumnSelection}>
                        {dt?.cancel || 'Cancel'}
                      </Button>
                      <Button size="sm" className="h-6 text-xs px-2" onClick={applyColumnSelection}>
                        <Check className="h-3 w-3 mr-1" />
                        {dt?.apply || 'Apply'}
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* Export to Excel */}
          {totalRows > 0 && (
            <DropdownMenu open={exportMenuOpen} onOpenChange={setExportMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {dt?.exportExcel || 'Export to Excel'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-xs">{dt?.exportFormat || 'Export format'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={false}
                  onSelect={() => { setExportMenuOpen(false); handleExportExcel('value'); }}
                >
                  <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />
                  {dt?.exportValues || 'Values only'} <span className="ml-1 text-muted-foreground text-xs">(1, 2, 3)</span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={false}
                  onSelect={() => { setExportMenuOpen(false); handleExportExcel('label'); }}
                >
                  <Tags className="mr-2 h-3.5 w-3.5" />
                  {dt?.exportLabels || 'Labels only'} <span className="ml-1 text-muted-foreground text-xs">(Masculino)</span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={false}
                  onSelect={() => { setExportMenuOpen(false); handleExportExcel('both'); }}
                >
                  <Tags className="mr-2 h-3.5 w-3.5" />
                  {dt?.exportBoth || 'Labels + Values'} <span className="ml-1 text-muted-foreground text-xs">(Masculino (2))</span>
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        <div className="border rounded-md overflow-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
            <table className="w-full text-sm min-w-max">
              <thead className="sticky top-0 z-10 bg-background border-b">
                <tr>
                  {visibleColumns.map((col) => (
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
                        <ContextMenuItem
                          onClick={() =>
                            onCreateRule({
                              rule_type: 'exclude_columns',
                              config: { columns: [col.name] },
                            })
                          }
                        >
                          <EyeOff className="mr-2 h-4 w-4" />
                          {dt?.excludeColumn || 'Exclude Column'}
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? '' : 'bg-muted/30'}>
                    {visibleColumns.map((col) => (
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
