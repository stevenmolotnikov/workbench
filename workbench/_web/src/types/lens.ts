import type { Token } from "@/types/models";

export interface LensConfigData { 
    name: string;
    model: string;
    prompt: string;
    token: Token;
}