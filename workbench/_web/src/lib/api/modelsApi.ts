import config from "@/lib/config";
import sseService from "@/lib/sseProvider";
import type { LensConfigData } from "@/types/lens";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Model, Token } from "@/types/models";

interface Prediction {
    idx: number;
    ids: number[];
    probs: number[];
    texts: string[];
}

export const getExecuteSelected = async (request: LensConfigData): Promise<Prediction[]> => {
    const response = await fetch(config.getApiUrl(config.endpoints.getExecuteSelected), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });

    if (!response.ok) throw new Error("Failed to start computation");
    const { job_id: jobId } = await response.json();

    const result = await sseService.listenToSSE<Prediction[]>(
        config.endpoints.listenExecuteSelected + `/${jobId}`
    );
    return result;
};

export const useExecuteSelected = () => {
    return useMutation({
        mutationFn: getExecuteSelected,
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

export const getGenerate = async (request: Completion): Promise<GenerationResponse> => {
    const response = await fetch(config.getApiUrl(config.endpoints.getGenerate), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });

    if (!response.ok) throw new Error("Failed to start computation");
    const { job_id: jobId } = await response.json();

    const result = await sseService.listenToSSE<GenerationResponse>(
        config.endpoints.listenGenerate + `/${jobId}`
    );
    return result;
}

export const useGenerate = () => {
    return useMutation({
        mutationFn: getGenerate,
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