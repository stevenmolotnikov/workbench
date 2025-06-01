import { Completion, Annotation, ChartMode } from "@/types/workspace"
import { LineGraphData } from "@/types/charts";
import { LensHeatmap, LensLineGraph } from "@/components/charts/types";

// Request Schema

export interface TokenCompletion {
    idx: number;
    target_id: number;
    target_text?: string;
}

export interface LensCompletion extends Completion { 
    name: string;
    model: string;
    tokens: TokenCompletion[];
}

export interface LineGraphAnnotation extends Annotation { 
    lineId: string;
    layer: number;
}

export interface LineGraphRangeAnnotation extends Annotation { 
    lineId: string;
    start: number;
    end: number;
}

export interface CellPosition {
    row: number;
    col: number;
}


export interface HeatmapAnnotation extends Annotation { 
    positions: CellPosition[];
}

export interface LogitLensWorkspace { 
    id?: string;
    name: string;
    completions: LensCompletion[];
    graphData: LineGraphData | null;
    annotations: LineGraphAnnotation[];
}

// Line Chart Data Schema

interface Point {
    name: string;
    prob: number;
}

interface Layer {
    layer: number;
    points: Point[];
}

export interface LensLineResponse {
    data: Layer[];
    metadata: {
        maxLayer: number;
    };
}

// Grid Chart Data Schema

export interface LensGridResponse {
    layer: number;
    probs: number[][];
    pred_strs: string[][];
}

// Chart Modes

export const LogitLensModes: ChartMode[] = [
    {
        name: "Target Token",
        description: "Probability of the target token per layer.",
        icon: "chart-area",
        component: LensLineGraph,
    },
    {
        name: "Prediction Grid",
        description: "Grid of the most probable token per layer.",
        icon: "grid-3x3",
        component: LensHeatmap,
    },
]
