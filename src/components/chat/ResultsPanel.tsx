import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Table as TableIcon, Variable, FileText, PieChart } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { QueryResponse } from '@/types/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';

interface ResultsPanelProps {
  hasResults: boolean;
  lastAnalysis?: QueryResponse | null;
}

// Colores para gráficos
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(220, 70%, 50%)',
  'hsl(160, 60%, 45%)',
  'hsl(30, 80%, 55%)',
  'hsl(280, 60%, 50%)',
  'hsl(340, 70%, 50%)',
  'hsl(190, 70%, 45%)',
];

export function ResultsPanel({ hasResults, lastAnalysis }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState('result');
  const { t } = useLanguage();

  // Parsear visualizaciones del análisis
  const visualizations = lastAnalysis?.visualizations;
  const analysisPerformed = lastAnalysis?.analysis_performed ?? [];

  // Extraer datos de tablas si existen
  const tableData = extractTableData(analysisPerformed);
  const chartData = extractChartData(visualizations);

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
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
            >
              <TableIcon className="h-4 w-4" />
              {t.chat.table}
            </TabsTrigger>
            <TabsTrigger
              value="variables"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
            >
              <Variable className="h-4 w-4" />
              {t.chat.variables}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Result/Chart Tab */}
        <TabsContent value="result" className="flex-1 p-6 overflow-auto">
          {chartData.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  {chartData[0].title || 'Visualización'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartData[0].type === 'pie' ? (
                      <RechartsPieChart>
                        <Pie
                          data={chartData[0].data}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {chartData[0].data.map((_: unknown, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    ) : (
                      <BarChart data={chartData[0].data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ) : lastAnalysis ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Análisis Completado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-muted-foreground">
                    {lastAnalysis.answer || 'Análisis procesado correctamente.'}
                  </p>
                  {analysisPerformed.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Análisis realizados:</p>
                      <ul className="text-sm text-muted-foreground">
                        {analysisPerformed.map((analysis, index) => (
                          <li key={index}>
                            {JSON.stringify(analysis)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sin visualización disponible</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">
                    Realiza una pregunta para ver el análisis
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Table Tab */}
        <TabsContent value="table" className="flex-1 p-6 overflow-auto">
          <Card>
            <CardContent className="p-0">
              {tableData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(tableData[0]).map((key) => (
                        <TableHead key={key}>{key}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row, index) => (
                      <TableRow key={index}>
                        {Object.values(row).map((value, cellIndex) => (
                          <TableCell key={cellIndex}>
                            {typeof value === 'number' 
                              ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                              : String(value)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No hay datos tabulares disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variables Tab */}
        <TabsContent value="variables" className="flex-1 p-6 overflow-auto">
          <div className="grid gap-4">
            {analysisPerformed.length > 0 ? (
              analysisPerformed.map((analysis, index) => {
                const analysisObj = analysis as Record<string, unknown>;
                const variables = (analysisObj.variables as string[]) ?? [];
                const type = (analysisObj.type as string) ?? 'Análisis';
                
                return (
                  <Card key={index}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-3">
                        <Variable className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{type}</p>
                          <p className="text-sm text-muted-foreground">
                            {variables.length > 0 
                              ? `Variables: ${variables.join(', ')}` 
                              : 'Sin variables específicas'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay variables analizadas
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helpers para extraer datos
function extractTableData(analysisPerformed: Record<string, unknown>[]): Record<string, unknown>[] {
  for (const analysis of analysisPerformed) {
    if (analysis.table && Array.isArray(analysis.table)) {
      return analysis.table as Record<string, unknown>[];
    }
    if (analysis.data && Array.isArray(analysis.data)) {
      return analysis.data as Record<string, unknown>[];
    }
  }
  return [];
}

function extractChartData(visualizations: Record<string, unknown> | undefined): Array<{
  type: 'bar' | 'pie';
  title: string;
  data: Array<{ name: string; value: number }>;
}> {
  if (!visualizations) return [];

  const charts: Array<{
    type: 'bar' | 'pie';
    title: string;
    data: Array<{ name: string; value: number }>;
  }> = [];

  // Intentar parsear diferentes formatos de visualización
  if (visualizations.chart) {
    const chart = visualizations.chart as Record<string, unknown>;
    charts.push({
      type: (chart.type as 'bar' | 'pie') || 'bar',
      title: (chart.title as string) || 'Visualización',
      data: (chart.data as Array<{ name: string; value: number }>) || [],
    });
  }

  if (visualizations.charts && Array.isArray(visualizations.charts)) {
    for (const chart of visualizations.charts as Array<Record<string, unknown>>) {
      charts.push({
        type: (chart.type as 'bar' | 'pie') || 'bar',
        title: (chart.title as string) || 'Visualización',
        data: (chart.data as Array<{ name: string; value: number }>) || [],
      });
    }
  }

  // Si hay datos directos en formato de frecuencias
  if (visualizations.frequencies) {
    const freqs = visualizations.frequencies as Record<string, number>;
    charts.push({
      type: 'bar',
      title: 'Distribución de Frecuencias',
      data: Object.entries(freqs).map(([name, value]) => ({ name, value })),
    });
  }

  return charts;
}
