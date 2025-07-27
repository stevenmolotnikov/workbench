import config from "@/lib/config";
import sseService from "@/lib/sseProvider";
import type { LensConfigData } from "@/types/lens";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

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