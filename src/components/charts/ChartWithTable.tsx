import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, ZoomIn, PieChart, TrendingUp, Gauge, TableIcon } from 'lucide-react';
import { DonutChart } from './DonutChart';
import { HorizontalBarChart } from './HorizontalBarChart';
import { VerticalBarChart } from './VerticalBarChart';
import { LineChart } from './LineChart';
import { NpsGauge } from './NpsGauge';
import { CompareMeansChart } from './CompareMeansChart';
import { DataTableWithProgress } from './DataTableWithProgress';
import { CrosstabTable } from './CrosstabTable';
import type { ChartData } from '@/types/database';
import { useLanguage } from '@/i18n/LanguageContext';

interface ChartWithTableProps {
  chart: ChartData;
  index: number;
  onZoom: () => void;
}

export function ChartWithTable({ chart, index, onZoom }: ChartWithTableProps) {
  const { t } = useLanguage();
  const hasInteractiveData = chart.data && chart.data.labels && chart.data.values;
  const hasTable = chart.table && chart.table.columns && chart.table.rows;

  const renderChart = () => {
    if (!hasInteractiveData) {
      // Fallback to base64 image
      if (chart.chart_base64) {
        return (
          <div 
            className="flex justify-center cursor-pointer group"
            onClick={onZoom}
          >
            <div className="relative">
              <img
                src={`data:image/png;base64,${chart.chart_base64}`}
                alt={chart.title || `Chart ${index + 1}`}
                className="max-w-full h-auto rounded-lg border transition-opacity group-hover:opacity-90"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-lg">
                <div className="bg-background/90 text-foreground px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 shadow-lg">
                  <ZoomIn className="h-4 w-4" />
                  {t.chat.clickToZoom}
                </div>
              </div>
            </div>
          </div>
        );
      }
      return null;
    }

    // Render interactive chart based on type
    switch (chart.chart_type) {
      case 'donut':
      case 'pie':
        return <DonutChart data={chart.data!} title={chart.title} />;
      case 'horizontal_bar':
        return <HorizontalBarChart data={chart.data!} title={chart.title} />;
      case 'bar':
      case 'vertical_bar':
        return <VerticalBarChart data={chart.data!} title={chart.title} />;
      case 'line':
        return <LineChart data={chart.data!} title={chart.title} />;
      case 'nps_gauge':
        return <NpsGauge data={chart.data!} title={chart.title} />;
      case 'compare_means':
        return <CompareMeansChart data={chart.data!} title={chart.title} />;
      case 'crosstab':
        // Crosstab renders as a table, not a chart
        return null;
      default:
        // Default to horizontal bar for unknown types
        return <HorizontalBarChart data={chart.data!} title={chart.title} />;
    }
  };

  const getChartIcon = () => {
    switch (chart.chart_type) {
      case 'donut':
      case 'pie':
        return <PieChart className="h-5 w-5 text-primary" />;
      case 'line':
        return <TrendingUp className="h-5 w-5 text-primary" />;
      case 'nps_gauge':
        return <Gauge className="h-5 w-5 text-primary" />;
      case 'compare_means':
        return <BarChart3 className="h-5 w-5 text-primary" />;
      case 'crosstab':
        return <TableIcon className="h-5 w-5 text-primary" />;
      default:
        return <BarChart3 className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getChartIcon()}
            {chart.title || `Chart ${index + 1}`}
          </span>
          {chart.chart_base64 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoom}
              className="text-muted-foreground hover:text-primary"
            >
              <ZoomIn className="h-4 w-4 mr-1" />
              {t.chat.fullscreen}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        {renderChart()}

        {/* Table with progress bars or crosstab */}
        {hasTable && (
          <div className={chart.chart_type !== 'crosstab' ? 'pt-4 border-t' : ''}>
            {chart.chart_type === 'crosstab' ? (
              <CrosstabTable
                table={chart.table!}
              />
            ) : (
              <DataTableWithProgress
                columns={chart.table!.columns}
                rows={chart.table!.rows}
                colors={chart.data?.colors}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
