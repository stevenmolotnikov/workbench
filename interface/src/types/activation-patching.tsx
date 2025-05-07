import { Annotation, Completion, ChartMode } from "@/types/workspace";
import { Smile  } from "lucide-react";

export interface ActivationPatchingRequest {
    connections: Connection[];
    model: string;
    source: Completion;
    destination: Completion;
    submodule: string;
    correct_id: number;
    incorrect_id: number;
    patch_tokens: boolean;
}

export interface ActivationPatchingWorkspace extends ActivationPatchingRequest {
    annotations: Annotation[];
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
        name: "Attention Heads",
        description: "Visualize attention patterns across transformer heads.",
        icon: <Smile className="h-6 w-6" />
    },
    {
        name: "Transformer Blocks",
        description: "Visualize attention patterns across transformer heads.",
        icon: <Smile className="h-6 w-6" />
    },
    {
        name: "MLP Outputs",
        description: "Visualize attention patterns across transformer heads.",
        icon: <Smile className="h-6 w-6" />
    },
    {
        name: "Attention Outputs",
        description: "Visualize attention patterns across transformer heads.",
        icon: <Smile className="h-6 w-6" />
    },
]
