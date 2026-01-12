// Chart color palette for consistent visualizations
export const CHART_PALETTE = [
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#64748B', // Slate
  '#EF4444', // Red
  '#84CC16', // Lime
];

export const getChartColor = (index: number): string => 
  CHART_PALETTE[index % CHART_PALETTE.length];

export const getChartColors = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => getChartColor(i));
