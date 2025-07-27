import config from "@/lib/config";
import type { LineGraphData, LineData } from "@/types/charts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setChartData, createChart, deleteChart } from "@/lib/queries/chartQueries";
import sseService from "@/lib/sseProvider";
import { LensConfigData } from "@/types/lens";
import { NewChart } from "@/db/schema";
import { addChartConfigLink } from "../queries/configQueries";
import { useWorkspace } from "@/stores/useWorkspace";

const getLensLine = async (lensRequest: { completions: LensConfigData[]; chartId: string }) => {
    try {
        // Start the job
        const response = await fetch(config.getApiUrl(config.endpoints.getLensLine), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lensRequest),
        });

        if (!response.ok) throw new Error("Failed to start lens computation");

        const jobId = (await response.json()).job_id;
        
        // Listen for results
        const result = await sseService.listenToSSE<LensLineResponse>(config.endpoints.listenLensLine + `/${jobId}`);
        return { data: result };
    } catch (error) {
        console.error("Error fetching logit lens data:", error);
        throw error;
    }
}

export const useLensLine = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (lensRequest: { completions: LensConfigData[]; chartId: string }) => {
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

const getLensGrid = async (lensRequest: { completions: LensConfigData[]; chartId: string }) => {    
    try {

        const fixedLensRequest = {
            ...lensRequest.completions[0],
        }

        // Start the job
        const response = await fetch(config.getApiUrl(config.endpoints.getLensGrid), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fixedLensRequest),
        });

        if (!response.ok) throw new Error("Failed to start grid lens computation");

        const jobId = (await response.json()).job_id;
        
        // Listen for results
        const result = await sseService.listenToSSE<LensGridResponse>(config.endpoints.listenLensGrid + `/${jobId}`);
        return { data: result };
    } catch (error) {
        console.error("Error fetching grid lens data:", error);
        throw error;
    }
}


export const useLensGrid = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (lensRequest: {completions: LensConfigData[]; chartId: string}) => {
            const response = await getLensGrid(lensRequest);

            const result = processHeatmapData(response.data);

            // Update the database with the chart data after receiving results
            // await setChartData(lensRequest.chartId, result);

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
    input_strs: string[];
    probs: number[][];
    pred_strs: string[][];
}

function processHeatmapData(data: LensGridResponse) {
    const { probs, pred_strs, input_strs } = data;

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

export const useCreateChart = () => {
    const queryClient = useQueryClient();
    const { setActiveTab } = useWorkspace();

    return useMutation({
        mutationFn: async ({ configId, chart }: { configId: string; chart: NewChart }) => {
            const newChart = await createChart(chart);
            await addChartConfigLink(configId, newChart.id);
            return newChart;
        },
        onSuccess: (newChart, variables) => {
            queryClient.invalidateQueries({ queryKey: ["lensCharts", variables.chart.workspaceId] });
            setActiveTab(newChart.id);
        },
    });
};

export const useDeleteChart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (chartId: string) => deleteChart(chartId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lensCharts"] });
        },
    });
};