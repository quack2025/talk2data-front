/**
 * DashboardWidgetRenderer — renders a widget's cached_result using the
 * appropriate chart component.
 *
 * Transforms backend cached_result format into the chart data format
 * expected by the existing chart components.
 *
 * Sprint 17a (Gap G4)
 */

import {
  VerticalBarChart,
  HorizontalBarChart,
  DonutChart,
  NpsGauge,
} from '@/components/charts';
import { CompareMeansChart } from '@/components/charts/CompareMeansChart';
import { CrosstabTable } from '@/components/charts/CrosstabTable';
import { getChartColor } from '@/lib/chartColors';
import type { DashboardWidget } from '@/types/dashboard';
import { Hash, AlertCircle } from 'lucide-react';

interface WidgetRendererProps {
  widget: DashboardWidget;
}

export function DashboardWidgetRenderer({ widget }: WidgetRendererProps) {
  const result = widget.cached_result;

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No data
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive text-sm gap-2">
        <AlertCircle className="h-5 w-5" />
        <span className="text-xs text-center px-2">{String(result.error)}</span>
      </div>
    );
  }

  const resultType = result.type as string;

  // --- KPI Card ---
  if (resultType === 'kpi') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-3">
        <p className="text-4xl font-bold text-primary">
          {result.value != null ? String(result.value) : '—'}
        </p>
        <p className="text-sm text-muted-foreground mt-1 text-center truncate max-w-full">
          {(result.label as string) || widget.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {(result.metric as string) || ''} · n={String(result.n || 0)}
        </p>
      </div>
    );
  }

  // --- Text Block ---
  if (resultType === 'text') {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none p-3 whitespace-pre-wrap overflow-auto h-full">
        {(result.text as string) || ''}
      </div>
    );
  }

  // --- NPS Gauge ---
  if (resultType === 'nps') {
    const npsData = {
      labels: ['Detractors', 'Passives', 'Promoters'],
      values: [
        Number(result.detractors_pct || 0),
        Number(result.passives_pct || 0),
        Number(result.promoters_pct || 0),
      ],
    };
    // If we only have percentages, provide the score directly
    if (result.nps_score != null) {
      return (
        <div className="h-full flex flex-col items-center justify-center">
          <NpsGauge data={{ labels: ['NPS'], values: [Number(result.nps_score)] }} />
          <p className="text-xs text-muted-foreground mt-1">
            n={String(result.total_n || 0)}
          </p>
        </div>
      );
    }
    return (
      <div className="h-full flex items-center justify-center">
        <NpsGauge data={npsData} />
      </div>
    );
  }

  // --- Frequency Chart ---
  if (resultType === 'frequency') {
    const items = (result.items as Array<Record<string, unknown>>) || [];
    const chartType = widget.analysis_config.chart_type || 'bar';
    const chartData = {
      labels: items.map((it) => String(it.label || it.value || '')),
      values: items.map((it) => Number(it.count || 0)),
      percentages: items.map((it) => Number(it.percentage || 0)),
      colors: items.map((_, i) => getChartColor(i)),
    };

    if (chartType === 'donut' || chartType === 'pie') {
      return <DonutChart data={chartData} />;
    }
    if (chartType === 'horizontal_bar') {
      return <HorizontalBarChart data={chartData} showPercentages />;
    }
    return <VerticalBarChart data={chartData} showPercentages />;
  }

  // --- Crosstab ---
  if (resultType === 'crosstab') {
    const table = result.table as Array<Record<string, unknown>> | undefined;
    if (!table || table.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          No crosstab data
        </div>
      );
    }

    // Transform backend table format to ChartTableData {columns, rows}
    const rowVar = result.row_variable as string;
    const colVar = result.col_variable as string;
    const firstRow = table[0];
    const colKeys = Object.keys(firstRow).filter(
      (k) => k !== 'value' && k !== 'label' && k !== '__total__'
    );

    const columns = [rowVar || 'Variable', ...colKeys.map((k) => String(k))];
    const rows = table.map((row) => [
      String(row.label || row.value || ''),
      ...colKeys.map((k) => {
        const cell = row[k];
        if (cell && typeof cell === 'object' && 'percentage' in (cell as Record<string, unknown>)) {
          return `${Number((cell as Record<string, unknown>).percentage || 0).toFixed(1)}%`;
        }
        return typeof cell === 'number' ? `${cell.toFixed(1)}%` : String(cell || '');
      }),
    ]);

    return (
      <div className="h-full overflow-auto">
        <CrosstabTable table={{ columns, rows }} />
      </div>
    );
  }

  // --- Compare Means ---
  if (resultType === 'compare_means') {
    const groups = (result.groups as Array<Record<string, unknown>>) || [];
    const chartData = {
      labels: groups.map((g) => String(g.label || g.value || '')),
      values: groups.map((g) => Number(g.mean || 0)),
      error_bars: groups.map((g) => Number(g.std_dev || g.std || 0)),
      colors: groups.map((_, i) => getChartColor(i)),
    };
    return <CompareMeansChart data={chartData} />;
  }

  // --- Fallback: JSON ---
  return (
    <div className="h-full overflow-auto p-2">
      <pre className="text-[10px] leading-tight text-muted-foreground">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
