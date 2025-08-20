import config from "@/lib/config";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    setChartData,
    deleteChart,
    createLensChartPair,
    createPatchChartPair,
    updateChartName,
    updateChartView,
    copyChart,
} from "@/lib/queries/chartQueries";
import { LensConfigData } from "@/types/lens";
import { PatchingConfig } from "@/types/patching";
import { useCapture } from "@/components/providers/CaptureProvider";
import { Line, HeatmapRow, ChartView } from "@/types/charts";
import { queryKeys } from "../queryKeys";
import { toast } from "sonner";
import { startAndPoll } from "../startAndPoll";
import { useHeatmapView, useLineView } from "@/components/charts/ViewProvider";

const getLensLine = async (lensRequest: { completion: LensConfigData; chartId: string }) => {
    return await startAndPoll<Line[]>(
        config.endpoints.startLensLine,
        lensRequest.completion,
        config.endpoints.resultsLensLine
    );
};

export const useLensLine = () => {
    const queryClient = useQueryClient();   
    const { clearView } = useLineView();
    const { captureChartThumbnail } = useCapture();

    return useMutation({
        mutationKey: ["lensLine"],
        mutationFn: async ({
            lensRequest,
            configId,
        }: {
            lensRequest: { completion: LensConfigData; chartId: string };
            configId: string;
        }) => {
            const response = await getLensLine(lensRequest);
            console.log("RESPONSE", response);
            await setChartData(lensRequest.chartId, response, "line");
            return response;
        },
        onSuccess: async (data, variables) => {
            await clearView();
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.charts.chart(variables.lensRequest.chartId),
                })
                .then(() => {
                    setTimeout(() => {
                        captureChartThumbnail(variables.lensRequest.chartId);
                    }, 500);
                });
        },
        onError: (error, variables) => {
            toast.error("Failed to compute lens line (timeout or error)");
        },
    });
};

const getLensGrid = async (lensRequest: { completion: LensConfigData; chartId: string }) => {
    return await startAndPoll<HeatmapRow[]>(
        config.endpoints.startLensGrid,
        lensRequest.completion,
        config.endpoints.resultsLensGrid
    );
};

export const useLensGrid = () => {
    const queryClient = useQueryClient();
    const { clearView } = useHeatmapView();
    const { captureChartThumbnail } = useCapture();

    return useMutation({
        mutationKey: ["lensGrid"],
        mutationFn: async ({
            lensRequest,
            configId,
        }: {
            lensRequest: { completion: LensConfigData; chartId: string };
            configId: string;
        }) => {
            const response = await getLensGrid(lensRequest);
            await setChartData(lensRequest.chartId, response, "heatmap");
            return response;
        },
        onSuccess: async (data, variables) => {
            await clearView();
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.charts.chart(variables.lensRequest.chartId),
                })
                .then(() => {
                    setTimeout(() => {
                        captureChartThumbnail(variables.lensRequest.chartId);
                    }, 500);
                });
        },
        onError: (error, variables) => {
            toast.error("Failed to compute grid lens (timeout or error)");
        },
    });
};

export const useUpdateChartName = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ chartId, name }: { chartId: string; name: string }) => {
            return await updateChartName(chartId, name);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.charts.chart(variables.chartId) });
        },
    });
};

export const useUpdateChartView = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ chartId, view }: { chartId: string; view: ChartView }) => {
            return await updateChartView(chartId, view);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.charts.chart(variables.chartId) });
        },
    });
};

export const useDeleteChart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (chartId: string) => deleteChart(chartId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.charts.sidebar() });
        },
    });
};

export const useCreateLensChartPair = () => {
    const queryClient = useQueryClient();

    const defaultConfig = {
        prompt: "",
        model: "",
        token: { idx: 0, id: 0, text: "", targetIds: [] },
    } as LensConfigData;

    return useMutation({
        mutationFn: async ({
            workspaceId,
            config = defaultConfig,
        }: {
            workspaceId: string;
            config?: LensConfigData;
        }) => {
            return await createLensChartPair(workspaceId, config);
        },
        onSuccess: ({ chart }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.charts.sidebar() });
        },
    });
};

// TODO(cadentj): FIX THIS
export const useCreatePatchChartPair = () => {
    const queryClient = useQueryClient();

    const defaultConfig = {
        edits: [],
        model: "",
        source: "",
        destination: "",
        submodule: "attn",
        correctId: 0,
        incorrectId: undefined,
        patchTokens: false,
    } as PatchingConfig;

    return useMutation({
        mutationFn: async ({
            workspaceId,
            config = defaultConfig,
        }: {
            workspaceId: string;
            config?: PatchingConfig;
        }) => {
            return await createPatchChartPair(workspaceId, config);
        },
        onSuccess: ({ chart }) => {
            // Refresh charts and configs
            queryClient.invalidateQueries({ queryKey: ["patchCharts"] });
            queryClient.invalidateQueries({ queryKey: ["chartConfig"] });
            queryClient.invalidateQueries({ queryKey: ["chartsForSidebar"] });
        },
    });
};

export const useCopyChart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (chartId: string) => copyChart(chartId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.charts.sidebar() });
        },
    });
};
