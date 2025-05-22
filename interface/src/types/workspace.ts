export type Layout = "1x1" | "2x1";

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

export interface ChartMode {
    name: string;
    description: string;
    icon: React.ReactNode;
    chartType: "heatmap" | "line";
}


interface TokenPrediction {
    str_idxs: string[];
    values: number[];
    indices: number[];
}

export interface TokenPredictions {
    [token_index: number]: TokenPrediction;
}
