import config from "@/lib/config";
import type { LensConfigData } from "@/types/lens";
import type { Model, Token } from "@/types/models";
import { startAndPoll } from "../startAndPoll";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkspace } from "@/stores/useWorkspace";

interface Prediction {
    idx: number;
    ids: number[];
    probs: number[];
    texts: string[];
}

const getPrediction = async (request: LensConfigData): Promise<Prediction> => {
    return await startAndPoll<Prediction>(
        config.endpoints.startPrediction,
        request,
        config.endpoints.resultsPrediction
    );
};


export const usePrediction = () => {
    return useMutation({
        mutationFn: getPrediction,
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

const generate = async (request: Completion): Promise<GenerationResponse> => {
    return await startAndPoll<GenerationResponse>(
        config.endpoints.startGenerate,
        request,
        config.endpoints.resultsGenerate
    );
}

export const useGenerate = () => {
    return useMutation({
        mutationFn: generate,
        onError: (error, variables, context) => {
            toast.error(`Error: ${error}`);
        },
    });
};


export const getModels = async (): Promise<Model[]> => {
    const response = await fetch(config.getApiUrl(config.endpoints.models));
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
};