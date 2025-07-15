import config from "@/lib/config";
import type { LineGraphData, LineData, ChartData } from "@/types/charts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LensCompletion, LensWorkspace } from "@/types/lens";
import { setChartData, createChart } from "@/lib/queries/chartQueries";
import sseService from "@/lib/sseProvider";
import type { WorkspaceData } from "@/types/workspace";
import { v4 as uuid } from "uuid";


const generateJobId = () => {
    return `job-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

const listenToSSE = <T>(url: string): Promise<T> => {
    return new Promise((resolve, reject) => {
        let result: T | null = null;
        
        const { onCancel } = sseService.createEventSource(
            url,
            (data: any) => {
                if (data.type === 'status') {
                    console.log('Status update:', data.message);
                } else if (data.type === 'result') {
                    result = data;
                } else if (data.type === 'error') {
                    reject(new Error(data.message));
                }
            },
            () => {
                if (result) {
                    resolve(result);
                } else {
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
        
        const jobInfo = await response.json();
        console.log('Job started:', jobInfo);
        
        // Listen for results
        const result = await listenToSSE<{ data: any; metadata: any }>(config.endpoints.listenLensLine + `/${jobId}`);
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
            const result = processChartData(response);

            // Update your database with the response
            await setChartData(lensRequest.chartId, result);

            return result;
        },
        onSuccess: (data, variables) => {
            console.log("Successfully fetched logit lens data");
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
        
        const jobInfo = await response.json();
        console.log('Grid job started:', jobInfo);
        
        // Listen for results
        const result = await listenToSSE<{ data: any }>(config.endpoints.listenLensGrid + `/${jobId}`);
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

            // Update your database with the response
            await setChartData(lensRequest.chartId, result);

            return result;
        },
        onSuccess: (data, variables) => {
            console.log("Successfully fetched logit lens data");
        },
        onError: (error, variables) => {
            console.error("Error fetching logit lens data:", error);
        },
    });
}

export const useCreateChart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ 
            workspaceId, 
            position, 
            chartType,
            workspaceType,
        }: { 
            workspaceId: string; 
            position: number; 
            chartType: "line" | "heatmap";
            workspaceType: "lens" | "patching";
        }) => {
            const newChart = {
                id: uuid(),
                chartData: null,
                annotations: [],
                workspaceData: null,
                position
            }
            await createChart(
                workspaceId,
                newChart,
                chartType,
                workspaceType
            );
            return newChart;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ 
                queryKey: ["lensCharts", variables.workspaceId] 
            });
            console.log("Successfully created chart:", data.id);
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
    data: Layer[];
    metadata: {
        maxLayer: number;
    };
}

function processChartData(data: LensLineResponse): LineGraphData {
    if (!data?.data?.length) return { chartData: [], chartConfig: {}, maxLayer: 0, lineData: {} };

    const transformedData: {
        [key: number]: { layer: number; [key: string]: number | string | null };
    } = {};
    const dynamicConfig: { [key: string]: { label: string; color: string } } = {};
    const maxLayer = data.metadata.maxLayer;
    const lineMaxLayers: LineData = {};

    // Make color config and transform data
    let colorIndex = 0;
    data.data.forEach((layerResult) => {
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