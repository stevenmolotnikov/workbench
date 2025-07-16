import type { Completion } from "@/types/workspace"

export interface TokenCompletion {
    idx: number;
    target_id?: number;
    target_text?: string;
}

export interface LensCompletion extends Completion { 
    name: string;
    model: string;
    prompt: string;
    tokens: TokenCompletion[];
}

export interface LensConfig {
    completions: LensCompletion[];
}