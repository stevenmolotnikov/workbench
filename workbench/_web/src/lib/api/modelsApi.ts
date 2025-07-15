import config from "@/lib/config";
import sseService from "@/lib/sseProvider";
import { useWorkspace } from "@/stores/useWorkspace";
import type { LensCompletion } from "@/types/lens";
import type { Token } from "@/types/tokenizer";

interface ExecuteSelectedRequest {
    completion: LensCompletion;
    model: string;
    tokens: Token[];
}

interface ExecutePairRequest {
    source: { prompt: string };
    destination: { prompt: string };
    model: string;
}

interface TokenPredictions {
    [tokenIdx: number]: {
        ids: number[];
        values: number[];
    };
}

interface PairPredictions {
    source: {
        ids: number[];
        values: number[];
    };
    destination: {
        ids: number[];
        values: number[];
    };
}

const generateJobId = () => {
    return `job-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

const listenToSSE = <T>(url: string): Promise<T> => {
    return new Promise((resolve, reject) => {
        let result: T | null = null;
        const { setJobStatus } = useWorkspace.getState();
        
        const { onCancel } = sseService.createEventSource(
            url,
            (data: any) => {
                console.log('Received data:', data);
                if (data.type === 'status') {
                    console.log('Status update:', data.message);
                    setJobStatus(data.message);
                } else if (data.type === 'result') {
                    console.log('Received result:', data);
                    result = data.data as T;
                } else if (data.type === 'error') {
                    setJobStatus(`Error: ${data.message}`);
                    reject(new Error(data.message));
                }
            },
            () => {
                if (result) {
                    setJobStatus('idle');
                    resolve(result);
                } else {
                    setJobStatus('Error: No result received');
                    reject(new Error('No result received'));
                }
            }
        );
    });
};

export const getExecuteSelected = async (request: ExecuteSelectedRequest): Promise<TokenPredictions> => {
    try {
        const jobId = generateJobId();
        const requestWithJobId = { ...request, job_id: jobId };
        
        // Start the job
        const response = await fetch(config.getApiUrl(config.endpoints.getExecuteSelected), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestWithJobId),
        });

        if (!response.ok) throw new Error("Failed to start computation");
        
        // Listen for results
        const result = await listenToSSE<TokenPredictions>(
            config.endpoints.listenExecuteSelected + `/${jobId}`
        );
        
        return result;
    } catch (error) {
        console.error("Error executing selected tokens:", error);
        throw error;
    }
};

export const getExecutePair = async (request: ExecutePairRequest): Promise<PairPredictions> => {
    try {
        const jobId = generateJobId();
        const requestWithJobId = { ...request, job_id: jobId };
        
        // Start the job
        const response = await fetch(config.getApiUrl(config.endpoints.getExecutePair), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestWithJobId),
        });

        if (!response.ok) throw new Error("Failed to start pair computation");
        
        // Listen for results
        const result = await listenToSSE<PairPredictions>(
            config.endpoints.listenExecutePair + `/${jobId}`
        );
        
        return result;
    } catch (error) {
        console.error("Error executing pair:", error);
        throw error;
    }
};