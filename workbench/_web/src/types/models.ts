export interface Token {
    // Index of the token in the prompt
    idx: number;
    id: number;
    text: string;
    prob?: number;
    targetId?: number;
    targetText?: string;
}

export interface Prediction {
    // Index of the token in the prompt
    idx: number;
    ids: number[];
    probs: number[];
    texts: string[];
}
