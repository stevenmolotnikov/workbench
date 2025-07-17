export interface TokenCompletion {
    idx: number;
    target_id?: number;
    target_text?: string;
}

export interface LensConfig { 
    name: string;
    model: string;
    prompt: string;
    tokens: TokenCompletion[];
}