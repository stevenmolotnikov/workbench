import config from "@/lib/config";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setChartData, createChart, deleteChart } from "@/lib/queries/chartQueries";
import sseService from "@/lib/sseProvider";
import { LensConfigData } from "@/types/lens";
import { NewChart } from "@/db/schema";
import { useWorkspace } from "@/stores/useWorkspace";
import { LensLineResponse, LensGridResponse, processLineData, processHeatmapData } from "@/lib/chartUtils";

const getLensLine = async (lensRequest: { completions: LensConfigData[]; chartId: string }) => {
    try {
        const response = await fetch(config.getApiUrl(config.endpoints.getLensLine), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lensRequest),
        });

        if (!response.ok) throw new Error("Failed to start lens computation");
        const {job_id: jobId} = await response.json();
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
        mutationFn: async ({lensRequest, configId}: { lensRequest: { completions: LensConfigData[]; chartId: string }; configId: string }) => {
            const response = await getLensLine(lensRequest);
            const result = processLineData(response.data);
            await setChartData(lensRequest.chartId, configId, result);
            return result;
        },
        onSuccess: (data, variables) => {
            // Invalidate queries to refresh the UI with updated data
            queryClient.invalidateQueries({ 
                queryKey: ["lensCharts"] 
            });
            queryClient.invalidateQueries({ 
                queryKey: ["unlinkedCharts"] 
            });
            queryClient.invalidateQueries({ 
                queryKey: ["hasLinkedConfig"] 
            });
        },
        onError: (error, variables) => {
            console.error("Error fetching logit lens data:", error);
        },
    });
};

const getLensGrid = async (lensRequest: { completion: LensConfigData; chartId: string }) => {    
    try {
        const response = await fetch(config.getApiUrl(config.endpoints.getLensGrid), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lensRequest.completion),
        });

        if (!response.ok) throw new Error("Failed to start grid lens computation");
        const {job_id: jobId} = await response.json();
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
        mutationFn: async ({ lensRequest, configId }: { lensRequest: {completion: LensConfigData; chartId: string}; configId: string }) => {
            const response = await getLensGrid(lensRequest);
            const result = processHeatmapData(response.data);
            await setChartData(lensRequest.chartId, configId, result);
            return result;
        },
        onSuccess: (data, variables) => {
            // Invalidate queries to refresh the UI with updated data
            queryClient.invalidateQueries({ 
                queryKey: ["lensCharts"] 
            });
            queryClient.invalidateQueries({ 
                queryKey: ["unlinkedCharts"] 
            });
            queryClient.invalidateQueries({ 
                queryKey: ["hasLinkedConfig"] 
            });
        },
        onError: (error, variables) => {
            console.error("Error fetching logit lens data:", error);
        },
    });
}

export const useCreateChart = () => {
    const queryClient = useQueryClient();
    const { setActiveTab } = useWorkspace();

    return useMutation({
        mutationFn: async ({ chart }: { chart: NewChart }) => {
            return await createChart(chart);
        },
        onSuccess: (newChart) => {
            queryClient.invalidateQueries({ queryKey: ["lensCharts"]});
            queryClient.invalidateQueries({ queryKey: ["unlinkedCharts"]});
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
            queryClient.invalidateQueries({ queryKey: ["unlinkedCharts"] });
            queryClient.invalidateQueries({ queryKey: ["hasLinkedConfig"] });
        },
    });
};