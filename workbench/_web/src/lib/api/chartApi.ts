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
import { LineGraphData, HeatmapData, ChartData, ChartView } from "@/types/charts";
import { queryKeys } from "../queryKeys";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 15000;

async function startJob(startPath: string, body: unknown): Promise<string> {
    const response = await fetch(config.getApiUrl(startPath), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Failed to start job");
    const jobId = await response.json();
    if (typeof jobId !== "string") throw new Error("Invalid job id response");
    return jobId;
}

async function pollUntilCompleted<T>(pollPathBase: string, jobId: string): Promise<T> {
    const startedAt = Date.now();
    while (true) {
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
            throw new Error("Timed out waiting for job to complete");
        }

        const pollResp = await fetch(config.getApiUrl(`${pollPathBase}/${jobId}`));
        if (!pollResp.ok) throw new Error("Polling failed");
        const data = await pollResp.json();
        const status = data?.status as string | undefined;

        if (status === "COMPLETED") {
            return data as T;
        }

        // For non-terminal statuses, wait and try again
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
}

const getLensLine = async (lensRequest: { completion: LensConfigData; chartId: string }) => {
    try {
        const jobId = await startJob("/lens/start-line", lensRequest.completion);
        const result = await pollUntilCompleted<{ lines: LineGraphData["lines"]; status: string }>(
            "/lens/poll-line",
            jobId
        );
        return { data: { lines: result.lines } as LineGraphData };
    } catch (error) {
        throw error;
    }
};

export const useLensLine = () => {
    const queryClient = useQueryClient();
    const { captureChartThumbnail } = useCapture();

    return useMutation({
        mutationFn: async ({
            lensRequest,
            configId,
        }: {
            lensRequest: { completion: LensConfigData; chartId: string };
            configId: string;
        }) => {
            const response = await getLensLine(lensRequest);
            await setChartData(lensRequest.chartId, response.data, "line");
            return response.data;
        },
        onSuccess: (data, variables) => {
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
    try {
        const jobId = await startJob("/lens/start-grid", lensRequest.completion);
        const result = await pollUntilCompleted<{ rows: HeatmapData["rows"]; status: string }>(
            "/lens/poll-grid",
            jobId
        );
        return { data: { rows: result.rows } as HeatmapData };
    } catch (error) {
        throw error;
    }
};

export const useLensGrid = () => {
    const queryClient = useQueryClient();
    const { captureChartThumbnail } = useCapture();

    return useMutation({
        mutationFn: async ({
            lensRequest,
            configId,
        }: {
            lensRequest: { completion: LensConfigData; chartId: string };
            configId: string;
        }) => {
            const response = await getLensGrid(lensRequest);
            await setChartData(lensRequest.chartId, response.data, "heatmap");
            return response.data;
        },
        onSuccess: (data, variables) => {
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
