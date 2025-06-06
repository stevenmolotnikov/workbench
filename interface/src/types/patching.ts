import { Annotation, Completion, ChartMode } from "@/types/workspace";
import { Grid3X3 } from "lucide-react";
import { PatchingHeatmap } from "@/components/charts/types/PatchingHeatmap";

// Token completion for patching - similar to lens TokenCompletion
export interface PatchingTokenCompletion {
    idx: number;
    highlighted: boolean;
}

// Extended completion interface for patching that includes tokens
export interface PatchingCompletion extends Completion {
    tokens: PatchingTokenCompletion[];
}

export interface ActivationPatchingRequest {
    connections: Connection[];
    model: string;
    source: PatchingCompletion;
    destination: PatchingCompletion;
    submodule: string;
    correct_id: number;
    incorrect_id: number;
    patch_tokens: boolean;
}

export interface ActivationPatchingResponse {
    results: number[][];
    rowLabels: string[];
    colLabels: string[];
}

export interface ActivationPatchingWorkspace {
    id?: string;
    name: string;
    request: ActivationPatchingRequest;
    annotations: Annotation[];
    graphData: ActivationPatchingResponse;
}

export interface Connection {
    start: { 
        x: number; 
        y: number; 
        tokenIndices: number[]; // Array of token indices in the group
        counterIndex: number; // 0 for first counter, 1 for second counter
    };
    end: { 
        x: number; 
        y: number; 
        tokenIndices: number[]; // Array of token indices in the group
        counterIndex: number; // 0 for first counter, 1 for second counter
    };
}

export const ActivationPatchingModes: ChartMode[] = [
    {
        name: "Patching Heatmap",
        description: "Visualize patching heatmap.",
        icon: Grid3X3,
        component: PatchingHeatmap
    },
]
