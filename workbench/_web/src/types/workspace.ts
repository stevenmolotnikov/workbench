export type Layout = 0 | 1 | 2 | 3;

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
    isOrphaned?: boolean;
    originalChartIndex?: number;
    groupId?: string;
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