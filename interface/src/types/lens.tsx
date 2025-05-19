import { Completion, Annotation, ChartMode } from "@/types/workspace"
import { BarChart } from "lucide-react";

interface Token { 
    target_token: string;
    token_idx: number;
}

export interface LensCompletion extends Completion { 
    model: string;
    tokens: Token[];
}

interface ModelResults {
    model_name: string;
    layer_results: LayerResults[];
}

interface LayerResults {
    layer_idx: number;
    pred_probs: number[];
    preds: string[];
}

export interface LogitLensResponse {
    model_results: ModelResults[];
}

export interface LogitLensWorkspace { 
    completions: LensCompletion[];
    graphData: LogitLensResponse;
    annotations: Annotation[];
}

export const LogitLensModes: ChartMode[] = [
    {
        name: "Token Analysis",
        description: "Probability of the target token per layer.",
        icon: <BarChart className="h-6 w-6" />,
        chartType: "line"
    },
]
