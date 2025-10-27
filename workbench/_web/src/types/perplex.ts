export interface TokenProbability {
    token: string;
    probability: number;
    rank: number;
    top_alternatives: Array<{
        token: string;
        probability: number;
    }>;
}

export interface PerplexConfigData {
    prompt: string;
    output: string;
    model: string;
    top_k?: number;
}

export interface PerplexResults {
    prompt: string;
    vocab_size: number;
    model_name: string;
    prompt_tokens: TokenProbability[];
    output_tokens: TokenProbability[];
}

