import config from "@/lib/config";
import type { LensConfigData } from "@/types/lens";
import type { Model, Token } from "@/types/models";
import { startAndPoll } from "../startAndPoll";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface Prediction {
    idx: number;
    ids: number[];
    probs: number[];
    texts: string[];
}

export const executeSelected = async (request: LensConfigData): Promise<Prediction[]> => {
    return await startAndPoll<Prediction[]>(
        config.endpoints.startExecuteSelected,
        request,
        config.endpoints.resultsExecuteSelected
    );
};


export const useExecuteSelected = () => {
    return useMutation({
        mutationFn: executeSelected,
        onError: (error, variables, context) => {
            toast.error(`Error: ${error}`);
        },
    });
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