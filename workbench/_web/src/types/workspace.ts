export type Layout = "1x1" | "2x1" | "2x2";

export interface Prediction {
    id: string;
    indices: number[];
    str_indices: string[];
}

export interface Completion { 
    id: string;
    prompt: string;
}

export interface Model {
    name: string;
    type: "chat" | "base";
}

export interface Annotation {
    id: string;
    text: string;
}

export type ChartType = "heatmap" | "lineGraph";

export interface ChartMode {
    name: string;
    description: string;
    icon: React.ElementType;
    component: React.ComponentType<{ index: number }>;
}

// Types for top-k predictions
interface TokenPrediction {
    ids: number[];
    values: number[];
}

export interface TokenPredictions {
    [token_index: number]: TokenPrediction;
}