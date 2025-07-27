import config from "@/lib/config";
import sseService from "@/lib/sseProvider";
import { useWorkspace } from "@/stores/useWorkspace";
import type { LensConfig } from "@/types/lens";
import type { Token } from "@/types/tokenizer";

interface ExecuteSelectedRequest {
    completion: LensConfig;
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

interface SSEData {
    type: string;
    message: string;
    data: TokenPredictions | PairPredictions;
}

const listenToSSE = <T>(url: string): Promise<T> => {
    return new Promise((resolve, reject) => {
        let result: T | null = null;
        const { setJobStatus } = useWorkspace.getState();
        
        const { onCancel } = sseService.createEventSource(
            url,
            (data: unknown) => {
                const sseData = data as SSEData;
                console.log('Received data:', sseData);
                if (sseData.type === 'status') {
                    console.log('Status update:', sseData.message);
                    setJobStatus(sseData.message);
                } else if (sseData.type === 'result') {
                    console.log('Received result:', sseData);
                    result = sseData.data as T;
                } else if (sseData.type === 'error') {
                    setJobStatus(`Error: ${sseData.message}`);
                    reject(new Error(sseData.message));
                }
            },
            () => {
                if (result) {
                    console.log("RECEIVED RESULT", result);
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
        // Start the job
        const response = await fetch(config.getApiUrl(config.endpoints.getExecuteSelected), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
        });

        if (!response.ok) throw new Error("Failed to start computation");
        
        const jobId = (await response.json()).job_id;   

        console.log("JOB ID", jobId);

        // Listen for results
        const result = await listenToSSE<TokenPredictions>(
            config.endpoints.listenExecuteSelected + `/${jobId}`
        );
        

        console.log("STUFF", result);
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