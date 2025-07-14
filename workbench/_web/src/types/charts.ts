import type { WorkspaceAnnotation } from "@/types/annotations";
import type { LensCompletion } from "./lens";
import type { PatchingCompletion } from "./patching";

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

export interface Chart {
    data: LineGraphData | HeatmapData;
    annotations: WorkspaceAnnotation[];
    config: LensCompletion | PatchingCompletion;
}