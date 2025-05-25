export interface HeatmapData {
    data: number[][];
    labels?: string[][];
    xTickLabels?: (string | number)[];
    yTickLabels?: (string | number)[];
    xAxisLabel?: string;
    yAxisLabel?: string;
    cellSize?: number;
    fontSize?: number;
}

interface ChartDataPoint {
    layer: number;
    [key: string]: number | string | null;
}

interface ChartConfig {
    [key: string]: { label: string; color: string };
}

export interface LineGraphData {
    chartData: ChartDataPoint[];
    chartConfig: ChartConfig;
    maxLayer: number;
}