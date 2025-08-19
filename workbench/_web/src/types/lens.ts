import type { Prediction, Token } from "@/types/models";

export interface LensConfigData { 
    model: string;
    prompt: string;
    token: Token;
    prediction?: Prediction;
}