import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Table as TableIcon, Variable, AlertCircle, Hash, Users, FileWarning } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { ChartData } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types for backend data
interface TableData {
  columns: string[];
  rows: (string | number | null)[][];
  title?: string;
}

interface VariableInfo {
  name: string;
  label?: string;
  type?: string;
}

interface AnalysisMetadata {
  analysis_type?: string;
  variables_analyzed?: VariableInfo[];
  sample_size?: number;
  missing_values?: number;
  warnings?: string[];
  filters_applied?: Record<string, unknown>;
}

interface AnalysisPerformedItem {
  table_data?: TableData;
  analysis_metadata?: AnalysisMetadata;
  [key: string]: unknown;
}

interface ResultsPanelProps {
  hasResults: boolean;
  charts?: ChartData[];
  analysisPerformed?: AnalysisPerformedItem[];
}

export function ResultsPanel({ hasResults, charts, analysisPerformed }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState('result');
  const { t } = useLanguage();

  // Check what data is available - with defensive checks
  const hasCharts = charts && Array.isArray(charts) && charts.length > 0;
  const analysisArray = Array.isArray(analysisPerformed) ? analysisPerformed : [];
  const tablesData = analysisArray.filter(a => a && typeof a === 'object' && a.table_data);
  const metadataItems = analysisArray.filter(a => a && typeof a === 'object' && a.analysis_metadata);

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
              {metadataItems.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {metadataItems.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Result/Chart Tab - Shows charts from message.charts */}
        <TabsContent value="result" className="flex-1 p-6 overflow-auto">
          {hasCharts ? (
            <div className="space-y-6">
              {charts.map((chart, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      {chart.title || `Chart ${index + 1}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center">
                      <img
                        src={`data:image/png;base64,${chart.chart_base64}`}
                        alt={chart.title || `Chart ${index + 1}`}
                        className="max-w-full h-auto rounded-lg border"
                      />
                    </div>
                  </CardContent>
                </Card>
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

        {/* Table Tab - Shows table_data from analysis_performed */}
        <TabsContent value="table" className="flex-1 p-6 overflow-auto">
          {tablesData.length > 0 ? (
            <div className="space-y-6">
              {tablesData.map((analysis, index) => {
                const tableData = analysis.table_data!;
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
                                {row.map((cell, cellIndex) => (
                                  <TableCell key={cellIndex}>
                                    {cell === null || cell === undefined
                                      ? '-'
                                      : typeof cell === 'number'
                                        ? cell.toLocaleString(undefined, { maximumFractionDigits: 2 })
                                        : String(cell)}
                                  </TableCell>
                                ))}
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

        {/* Variables Tab - Shows analysis_metadata from analysis_performed */}
        <TabsContent value="variables" className="flex-1 p-6 overflow-auto">
          {metadataItems.length > 0 ? (
            <div className="space-y-4">
              {metadataItems.map((analysis, index) => {
                const metadata = analysis.analysis_metadata!;
                return (
                  <Card key={index}>
                    <CardContent className="py-4 space-y-4">
                      {/* Analysis Type */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Variable className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">
                            {metadata.analysis_type
                              ?.replace(/_/g, ' ')
                              .replace(/\b\w/g, l => l.toUpperCase()) || 'Analysis'}
                          </p>
                        </div>
                      </div>

                      {/* Variables Analyzed */}
                      {metadata.variables_analyzed && metadata.variables_analyzed.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Variables Analyzed
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {metadata.variables_analyzed.map((variable, vIndex) => (
                              <Badge key={vIndex} variant="secondary" className="text-sm">
                                {variable.name}
                                {variable.label && (
                                  <span className="ml-1 text-muted-foreground">
                                    ({variable.label})
                                  </span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        {metadata.sample_size !== undefined && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                            <Users className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Sample Size</p>
                              <p className="font-semibold">{metadata.sample_size.toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                        {metadata.missing_values !== undefined && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                            <Hash className="h-4 w-4 text-orange-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Missing Values</p>
                              <p className="font-semibold">{metadata.missing_values.toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Warnings */}
                      {metadata.warnings && metadata.warnings.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <p className="text-sm font-medium text-orange-600 flex items-center gap-1">
                            <FileWarning className="h-4 w-4" />
                            Warnings
                          </p>
                          <div className="space-y-1">
                            {metadata.warnings.map((warning, wIndex) => (
                              <div
                                key={wIndex}
                                className="flex items-start gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/30 p-2 rounded"
                              >
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>{warning}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Filters Applied */}
                      {metadata.filters_applied && Object.keys(metadata.filters_applied).length > 0 && (
                        <div className="space-y-2 pt-2">
                          <p className="text-sm font-medium text-muted-foreground">Filters Applied</p>
                          <div className="text-sm bg-muted/50 p-3 rounded-lg">
                            {Object.entries(metadata.filters_applied).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
    </div>
  );
}
