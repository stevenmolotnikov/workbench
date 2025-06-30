import type { Annotation, Completion, ChartMode } from "@/types/workspace";
import { Grid3X3 } from "lucide-react";
import { PatchingHeatmap } from "@/components/charts/types/PatchingHeatmap";


export interface ActivationPatchingRequest {
    edits: Edit[];
    model: string;
    source: Completion;
    destination: Completion;
    submodule: "attn" | "mlp" | "blocks" | "heads";
    correctId: number;
    incorrectId: number | undefined;
    patchTokens: boolean;
    jobId: string;
}

export interface ActivationPatchingResponse {
    results: number[][];
    rowLabels?: string[];
    colLabels?: string[];
}

export interface ActivationPatchingWorkspace {
    id?: string;
    name: string;
    request: ActivationPatchingRequest;
    annotations: Annotation[];
    graphData: ActivationPatchingResponse;
}

type Edit = Connection;

interface Point {
    x: number;
    y: number;
    tokenIndices: number[]; // Array of token indices in the group
    counterIndex: number; // 0 for first counter, 1 for second counter
}

export interface Connection {
    start: Point;
    end: Point;
}

export const ActivationPatchingModes: ChartMode[] = [
    {
        name: "Patching Heatmap",
        description: "Visualize patching heatmap.",
        icon: Grid3X3,
        component: PatchingHeatmap
    },
]
