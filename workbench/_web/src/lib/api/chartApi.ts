import config from "@/lib/config";
import type { LineGraphData, LineData } from "@/types/charts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LensCompletion } from "@/types/lens";
import { setChartData, createChart } from "@/lib/queries/chartQueries";
import sseService from "@/lib/sseProvider";
import { v4 as uuid } from "uuid";
import { useWorkspace } from "@/stores/useWorkspace";


interface SSEData {
    type: string;
    message: string;
    data: LensLineResponse | LensGridResponse;
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
            (data: unknown) => {
                const sseData = data as SSEData;
                console.log('Received data:', sseData);
                if (sseData.type === 'status') {
                    console.log('Status update:', sseData.message);
                    setJobStatus(sseData.message);
                } else if (sseData.type === 'result') {
                    console.log('Received result:', sseData);
                    result = sseData as T;
                } else if (sseData.type === 'error') {
                    setJobStatus(`Error: ${sseData.message}`);
                    reject(new Error(sseData.message));
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

const getLensLine = async (lensRequest: { completions: LensCompletion[]; chartId: string }) => {
    try {
        const jobId = generateJobId();
        const requestWithJobId = { ...lensRequest, job_id: jobId };
        
        // Start the job
        const response = await fetch(config.getApiUrl(config.endpoints.getLensLine), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestWithJobId),
        });

        if (!response.ok) throw new Error("Failed to start lens computation");
        
        // Listen for results
        const result = await listenToSSE<{ data: LensLineResponse }>(config.endpoints.listenLensLine + `/${jobId}`);

        console.log(result)
        return result;
    } catch (error) {
        console.error("Error fetching logit lens data:", error);
        throw error;
    }
}

export const useLensLine = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (lensRequest: { completions: LensCompletion[]; chartId: string }) => {
            const response = await getLensLine(lensRequest);
            const result = processChartData(response.data);

            // Update the database with the chart data after receiving results
            await setChartData(lensRequest.chartId, result);

            return result;
        },
        onSuccess: (data, variables) => {
            console.log("Successfully fetched logit lens data");
            // Invalidate queries to refresh the UI with updated data
            queryClient.invalidateQueries({ 
                queryKey: ["lensCharts"] 
            });
        },
        onError: (error, variables) => {
            console.error("Error fetching logit lens data:", error);
        },
    });
};

const getLensGrid = async (lensRequest: { completions: LensCompletion[]; chartId: string }) => {    
    try {
        const jobId = generateJobId();
        // Grid endpoint expects a single completion, not an array
        const requestWithJobId = { 
            completion: lensRequest.completions[0], 
            job_id: jobId 
        };
        
        // Start the job
        const response = await fetch(config.getApiUrl(config.endpoints.getLensGrid), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestWithJobId),
        });

        if (!response.ok) throw new Error("Failed to start grid lens computation");
        
        // Listen for results
        const result = await listenToSSE<{ data: LensGridResponse }>(config.endpoints.listenLensGrid + `/${jobId}`);
        return result.data;
    } catch (error) {
        console.error("Error fetching grid lens data:", error);
        throw error;
    }
}


export const useLensGrid = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (lensRequest: { completions: LensCompletion[]; chartId: string }) => {
            const response = await getLensGrid(lensRequest);
            const result = processHeatmapData(response);

            // Update the database with the chart data after receiving results
            await setChartData(lensRequest.chartId, result);

            return result;
        },
        onSuccess: (data, variables) => {
            console.log("Successfully fetched logit lens data");
            // Invalidate queries to refresh the UI with updated data
            queryClient.invalidateQueries({ 
                queryKey: ["lensCharts"] 
            });
        },
        onError: (error, variables) => {
            console.error("Error fetching logit lens data:", error);
        },
    });
}

export const useCreateLensChart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ 
            workspaceId, 
            position, 
            type,
        }: { 
            workspaceId: string; 
            position: number; 
            type: "lensLine" | "lensHeatmap";
        }) => {
            const newChart = {
                workspaceId,
                position,
                type,
            }
            await createChart(newChart);
            return newChart;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ 
                queryKey: ["lensCharts"] 
            });
            console.log("Successfully created chart");
        },
        onError: (error) => {
            console.error("Error creating chart:", error);
        },
    });
}

const defaultColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
];

interface Point {
    name: string;
    prob: number;
}

interface Layer {
    layer: number;
    points: Point[];
}

export interface LensLineResponse {
    layerResults: Layer[];
    maxLayer: number;
}

function processChartData(data: LensLineResponse): LineGraphData {
    if (!data?.layerResults?.length) return { chartData: [], chartConfig: {}, maxLayer: 0, lineData: {} };

    const transformedData: {
        [key: number]: { layer: number; [key: string]: number | string | null };
    } = {};
    const dynamicConfig: { [key: string]: { label: string; color: string } } = {};
    const maxLayer = data.maxLayer;
    const lineMaxLayers: LineData = {};

    // Make color config and transform data
    let colorIndex = 0;
    data.layerResults.forEach((layerResult) => {
        const layerValue = layerResult.layer;
        if (!transformedData[layerValue]) {
            transformedData[layerValue] = { layer: layerValue };
        }
        layerResult.points.forEach((point) => {
            const lineKey = point.name;
            if (!dynamicConfig[lineKey]) {
                dynamicConfig[lineKey] = {
                    label: lineKey,
                    color: defaultColors[colorIndex % defaultColors.length],
                };
                colorIndex++;
            }
            transformedData[layerValue][lineKey] = point.prob;

            // Track max layer for each line
            if (!lineMaxLayers[lineKey] || layerValue > lineMaxLayers[lineKey]) {
                lineMaxLayers[lineKey] = layerValue;
            }
        });
    });

    const sortedData = Object.values(transformedData).sort((a, b) => a.layer - b.layer);

    return {
        chartData: sortedData,
        chartConfig: dynamicConfig,
        maxLayer,
        lineData: lineMaxLayers,
    } as LineGraphData;
}

export interface LensGridResponse {
    layer: number;
    input_strs: string[];
    probs: number[][];
    pred_strs: string[][];
}

function processHeatmapData(data: LensGridResponse) {
    const { layer, probs, pred_strs, input_strs } = data;

    const yTickLabels = Array.from({ length: pred_strs.length }, (_, i) => i);

    return {
        data: probs,
        labels: pred_strs,
        yTickLabels: yTickLabels,
        yAxisLabel: "Layers",
        xAxisLabel: "Tokens",
        xTickLabels: input_strs
    };
}