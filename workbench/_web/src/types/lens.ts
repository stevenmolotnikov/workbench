import type { Token } from "@/types/models";

export interface LensConfigData { 
    model: string;
    prompt: string;
    token: Token;
}