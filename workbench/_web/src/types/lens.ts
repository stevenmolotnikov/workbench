import type { Completion, ChartMode, Annotation } from "@/types/workspace"
import { LensHeatmap, LensLineGraph } from "@/components/charts/types";
import type { Annotation as WorkspaceAnnotation } from "@/stores/useAnnotations";
import type { GridPosition } from "@/stores/useCharts";
import { ChartArea, Grid3X3 } from "lucide-react";

// Request Schema

export interface TokenCompletion {
    idx: number;
    target_id: number;
    target_text: string;
}

export interface LensCompletion extends Completion { 
    name: string;
    model: string;
    tokens: TokenCompletion[];
}

export interface LineGraphAnnotation extends Annotation { 
    lineId: string;
    layer: number;
    chartIndex: number;
}

export interface LineGraphRangeAnnotation extends Annotation { 
    lineId: string;
    start: number;
    end: number;
    chartIndex: number;
}

export interface CellPosition {
    row: number;
    col: number;
}


export interface HeatmapAnnotation extends Annotation { 
    positions: CellPosition[];
    chartIndex: number;
}

export interface LogitLensWorkspace { 
    id?: string;
    name: string;
    completions: LensCompletion[];
    graphData: GridPosition[];
    annotations: WorkspaceAnnotation[];
    groups?: any[]; // AnnotationGroup[] from useAnnotations
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
    input_strs: string[];
    probs: number[][];
    pred_strs: string[][];
}

// Chart Modes

export const LogitLensModes: ChartMode[] = [
    {
        name: "Target Token",
        description: "Probability of the target token per layer.",
        icon: ChartArea,
        component: LensLineGraph,
    },
    {
        name: "Prediction Grid",
        description: "Grid of the most probable token per layer.",
        icon: Grid3X3,
        component: LensHeatmap,
    },
]
