import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart3, Table as TableIcon, Variable } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { ChartData, TableData, VariableInfo } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChartWithTable } from '@/components/charts';
import { ProgressBar } from '@/components/charts/ProgressBar';
import { getChartColor } from '@/lib/chartColors';

interface ResultsPanelProps {
  hasResults: boolean;
  charts?: ChartData[];
  tables?: TableData[];
  variablesAnalyzed?: VariableInfo[];
  analysisPerformed?: Record<string, unknown>[];
}

export function ResultsPanel({ hasResults, charts, tables, variablesAnalyzed, analysisPerformed }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState('result');
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null);
  const { t } = useLanguage();

  // Use direct tables prop; fall back to extracting from analysisPerformed for backward compat
  const tablesData: TableData[] = (() => {
    if (tables && tables.length > 0) return tables;
    if (!Array.isArray(analysisPerformed)) return [];
    return analysisPerformed
      .filter(a => a && typeof a === 'object' && a.table_data)
      .map(a => a.table_data as TableData);
  })();

  // Use direct variablesAnalyzed prop; fall back to analysisPerformed metadata
  const variables: VariableInfo[] = (() => {
    if (variablesAnalyzed && variablesAnalyzed.length > 0) return variablesAnalyzed;
    if (!Array.isArray(analysisPerformed)) return [];
    const vars: VariableInfo[] = [];
    for (const a of analysisPerformed) {
      const meta = a?.analysis_metadata as { variables_analyzed?: VariableInfo[] } | undefined;
      if (meta?.variables_analyzed) {
        vars.push(...meta.variables_analyzed);
      }
    }
    return vars;
  })();

  const hasCharts = charts && Array.isArray(charts) && charts.length > 0;

  if (!hasResults) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {t.chat.noResultsYet}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            {t.chat.sendQuestion}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-muted/30">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b bg-card px-4">
          <TabsList className="h-12 bg-transparent gap-4">
            <TabsTrigger
              value="result"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {t.chat.result}
              {hasCharts && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {charts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
            >
              <TableIcon className="h-4 w-4" />
              {t.chat.table}
              {tablesData.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {tablesData.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="variables"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
            >
              <Variable className="h-4 w-4" />
              {t.chat.variables}
              {variables.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {variables.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Result/Chart Tab */}
        <TabsContent value="result" className="flex-1 p-6 overflow-auto">
          {hasCharts ? (
            <div className="space-y-6">
              {charts.map((chart, index) => (
                <ChartWithTable
                  key={index}
                  chart={chart}
                  index={index}
                  onZoom={() => setSelectedChart(chart)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>{t.chat.noVisualization}</p>
                  <p className="text-sm mt-1">{t.chat.askToSeeAnalysis}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Table Tab */}
        <TabsContent value="table" className="flex-1 p-6 overflow-auto">
          {tablesData.length > 0 ? (
            <div className="space-y-6">
              {tablesData.map((tableData, index) => {
                const percentColIndex = tableData.columns.findIndex(col =>
                  col.toLowerCase().includes('percent') || col === '%'
                );

                return (
                  <Card key={index}>
                    {tableData.title && (
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TableIcon className="h-5 w-5 text-primary" />
                          {tableData.title}
                        </CardTitle>
                      </CardHeader>
                    )}
                    <CardContent className={tableData.title ? "pt-0" : "pt-6"}>
                      <ScrollArea className="max-h-[500px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {tableData.columns.map((col, colIndex) => (
                                <TableHead key={colIndex} className="font-semibold">
                                  {col}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tableData.rows.map((row, rowIndex) => (
                              <TableRow key={rowIndex}>
                                {row.map((cell, cellIndex) => {
                                  const isPercentCell = cellIndex === percentColIndex;
                                  const color = getChartColor(rowIndex);

                                  let percentValue = 0;
                                  if (isPercentCell && cell !== null && cell !== undefined) {
                                    if (typeof cell === 'string') {
                                      percentValue = parseFloat(cell.replace('%', '')) || 0;
                                    } else if (typeof cell === 'number') {
                                      percentValue = cell;
                                    }
                                  }

                                  return (
                                    <TableCell key={cellIndex}>
                                      {isPercentCell ? (
                                        <ProgressBar value={percentValue} color={color} />
                                      ) : (
                                        cell === null || cell === undefined
                                          ? '-'
                                          : typeof cell === 'number'
                                            ? cell.toLocaleString(undefined, { maximumFractionDigits: 2 })
                                            : String(cell)
                                      )}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <TableIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>{t.chat.noTableData}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Variables Tab */}
        <TabsContent value="variables" className="flex-1 p-6 overflow-auto">
          {variables.length > 0 ? (
            <Card>
              <CardContent className="py-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Variable className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{t.chat.variablesAnalyzed}</p>
                      <p className="text-sm text-muted-foreground">
                        {variables.length} {t.chat.variables.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {variables.map((variable, vIndex) => (
                      <div key={vIndex} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{variable.name}</span>
                          {variable.label && (
                            <span className="text-xs text-muted-foreground">{variable.label}</span>
                          )}
                        </div>
                        {(variable.analysis_type || variable.type) && (
                          <Badge variant="outline" className="text-xs">
                            {variable.analysis_type || variable.type}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Variable className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>{t.chat.noVariablesAnalyzed}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Fullscreen Chart Modal */}
      <Dialog open={!!selectedChart} onOpenChange={(open) => !open && setSelectedChart(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2 border-b">
            <DialogTitle className="flex items-center gap-2 pr-8">
              <BarChart3 className="h-5 w-5 text-primary" />
              {selectedChart?.title || 'Chart'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 overflow-auto max-h-[calc(95vh-80px)] flex items-center justify-center bg-muted/30">
            {selectedChart && (
              <img
                src={`data:image/png;base64,${selectedChart.chart_base64}`}
                alt={selectedChart.title || 'Chart'}
                className="max-w-full max-h-[calc(95vh-120px)] h-auto rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
