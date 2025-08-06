import { LensConfigData } from "./lens";
import { PatchingConfig } from "./patching";

interface Cell {
    x: number;
    y: number;
    label: string;
}

interface Row {
    id: string;
    data: Cell[];
}

export interface HeatmapData {
    rows: Row[];
}

interface Point {
    x: number;
    y: number;
}

interface Line {
    id: string;
    data: Point[];
}

export interface LineGraphData {
    lines: Line[];
}

export type ChartData = LineGraphData | HeatmapData;
export type ConfigData = LensConfigData | PatchingConfig;