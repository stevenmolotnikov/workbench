import { Completion, Annotation, ChartMode } from "@/types/workspace"
import { BarChart, Grid3x3 } from "lucide-react";

// Request Schema

export interface TokenCompletion {
    idx: number;
    target_id: number;
    target_text?: string;
}

export interface LensCompletion extends Completion { 
    model: string;
    tokens: TokenCompletion[];
}

// Response Schema

interface Point {
    id: string;
    prob: number;
}

interface LayerResults {
    layer: number;
    points: Point[];
}

export interface LogitLensResponse {
    data: LayerResults[];
    metadata: {
        maxLayer: number;
    };
}

export interface LineGraphAnnotation extends Annotation { 
    lineId: string;
    layer: number;
}

export interface LogitLensWorkspace { 
    id?: string;
    name: string;
    completions: LensCompletion[];
    graphData: LineGraphData | null;
    annotations: LineGraphAnnotation[];
}

// Processed Chart Data Schema

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

// Grid Chart Data Schema

export interface GridChartData {
    layer: number;
    probs: number[][];
    pred_strs: string[][];
}

// Chart Modes

export const LogitLensModes: ChartMode[] = [
    {
        name: "Target Token",
        description: "Probability of the target token per layer.",
        icon: <BarChart className="h-6 w-6" />,
        chartType: "line"
    },
    {
        name: "Prediction Grid",
        description: "Grid of the most probable token per layer.",
        icon: <Grid3x3 className="h-6 w-6" />,
        chartType: "heatmap"
    },
]
