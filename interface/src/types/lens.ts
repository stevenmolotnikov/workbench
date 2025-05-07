import { Completion, Annotation } from "@/types/workspace"

export interface LensCompletion extends Completion { 
    model: string;
    name: string;
    selectedTokenIndices: number[];
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