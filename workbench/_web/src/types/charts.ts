import { LensConfigData } from "./lens";
import { PatchingConfig } from "./patching";

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

interface LineChartConfig {
    [key: string]: { label: string; color: string };
}

export interface LineData {
    [key: string]: number;
}

export interface LineGraphData {
    chartData: ChartDataPoint[];
    chartConfig: LineChartConfig;
    maxLayer: number;
    lineData: LineData;
}

export type ChartData = LineGraphData | HeatmapData;
export type ChartConfigData = LensConfigData | PatchingConfig;