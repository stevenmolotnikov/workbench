import config from "@/lib/config";
import type { LensConfigData } from "@/types/lens";
import type { Model, Token } from "@/types/models";
import { startAndPoll } from "../startAndPoll";

interface Prediction {
    idx: number;
    ids: number[];
    probs: number[];
    texts: string[];
}

export const executeSelected = async (request: LensConfigData): Promise<Prediction[]> => {
    try {
        const result = await startAndPoll<Prediction[]>(
            config.endpoints.startExecuteSelected,
            request,
            config.endpoints.resultsExecuteSelected
        );
        return result;
    } catch (error) {
        throw error;
    }
};

interface Completion {
    prompt: string;
    max_new_tokens: number;
    model: string;
}

export interface GenerationResponse {
    completion: Token[];
    last_token_prediction: Prediction;
}

export const generate = async (request: Completion): Promise<GenerationResponse> => {
    try {
        const result = await startAndPoll<GenerationResponse>(
            config.endpoints.startGenerate,
            request,
            config.endpoints.resultsGenerate
        );

        console.log(result);
        return result;
    } catch (error) {
        throw error;
    }
}

export const getModels = async (): Promise<Model[]> => {
    const response = await fetch(config.getApiUrl(config.endpoints.models));
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
};