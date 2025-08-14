import { LensConfigData } from "./lens";
import { PatchingConfig } from "./patching";

export interface HeatmapCell {
    x: string | number;
    y: number | null;
    label?: string;
}

export interface HeatmapRow {
    id: string;
    data: HeatmapCell[];
}

export interface HeatmapBounds {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
}

export interface HeatmapView { 
    bounds: HeatmapBounds;
    xStep: number;
}

export interface HeatmapData {
    rows: HeatmapRow[];
}

export interface Position {
    x: number;
    y: number;
}

export interface Line {
    id: string;
    data: Position[];
}

export interface LineGraphData {
    lines: Line[];
}

export type ChartData = LineGraphData | HeatmapData;
export type ChartView = HeatmapView;
export type ConfigData = LensConfigData | PatchingConfig;

export type ChartType = "line" | "heatmap";
export type ToolType = "lens" | "patch";

export type ChartMetadata = {
    id: string;
    name: string | null;
    chartType: ChartType | null;
    toolType: ToolType | null;
    updatedAt: Date;
    thumbnailUrl?: string | null;
};