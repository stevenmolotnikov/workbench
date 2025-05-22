import { Completion, Annotation, ChartMode } from "@/types/workspace"
import { BarChart } from "lucide-react";

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

// Chart Modes

export const LogitLensModes: ChartMode[] = [
    {
        name: "Token Analysis",
        description: "Probability of the target token per layer.",
        icon: <BarChart className="h-6 w-6" />,
        chartType: "line"
    },
]
