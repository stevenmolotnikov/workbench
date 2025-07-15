import type { Annotation } from "@/types/annotations";
import type { WorkspaceData } from "@/types/workspace";

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

export interface LineData {
    [key: string]: number;
}

export interface LineGraphData {
    chartData: ChartDataPoint[];
    chartConfig: ChartConfig;
    maxLayer: number;
    lineData: LineData;
}

export type ChartData = {
    line: LineGraphData;
    heatmap: HeatmapData;
}

export interface Chart {
    id: string;
    chartData: ChartData[keyof ChartData];
    annotations: Annotation[];
    workspaceData: WorkspaceData[keyof WorkspaceData];
    position: number;
}