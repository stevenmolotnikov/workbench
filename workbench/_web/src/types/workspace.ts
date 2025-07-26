export interface Prediction {
    id: string;
    indices: number[];
    str_indices: string[];
}

export interface Model {
    name: string;
    type: "chat" | "base";
}

export interface Workspace {
    id: string;
    name: string;
    public: boolean;
}