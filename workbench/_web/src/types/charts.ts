import { LensConfigData } from "./lens";
import { PatchingConfig } from "./patching";

// Heatmap Data Types

export interface HeatmapCell {
    x: string | number;
    y: number | null;
    label?: string;
}

export interface HeatmapRow {
    id: string;
    data: HeatmapCell[];
}

export interface HeatmapData {
    rows: HeatmapRow[];
}

// Heatmap View Types

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

export type Range = [number, number];

// Line Data Types

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

// Line View Types

export interface SelectionBounds {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}

export interface LineView {
    bounds: SelectionBounds;
    selectedLineIds: string[];
}

// Combined Types

export type ChartData = LineGraphData | HeatmapData;
export type ChartView = HeatmapView | LineView;
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