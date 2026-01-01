import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Table as TableIcon, Variable, FileText } from 'lucide-react';

interface ResultsPanelProps {
  hasResults: boolean;
}

export function ResultsPanel({ hasResults }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState('result');

  if (!hasResults) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">
            Los resultados aparecerán aquí
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
              Resultado
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
            >
              <TableIcon className="h-4 w-4" />
              Tabla
            </TabsTrigger>
            <TabsTrigger
              value="variables"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
            >
              <Variable className="h-4 w-4" />
              Variables
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="result" className="flex-1 p-6 overflow-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribución por género</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">
                  [Visualización del gráfico]
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="flex-1 p-6 overflow-auto">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variable</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="text-right">Frecuencia</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Género</TableCell>
                    <TableCell>Masculino</TableCell>
                    <TableCell className="text-right">245</TableCell>
                    <TableCell className="text-right">48.5%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Género</TableCell>
                    <TableCell>Femenino</TableCell>
                    <TableCell className="text-right">260</TableCell>
                    <TableCell className="text-right">51.5%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="flex-1 p-6 overflow-auto">
          <div className="grid gap-4">
            {['Q1_Satisfaccion', 'Q2_Recomendacion', 'Q3_Edad', 'Q4_Genero'].map((variable) => (
              <Card key={variable}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <Variable className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{variable}</p>
                      <p className="text-sm text-muted-foreground">
                        Escala 1-5 · n=505
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
