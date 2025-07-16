import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LensCompletion, LensConfig } from "@/types/lens";
import { getChartConfig, getLensChartConfig, setChartConfig } from "@/lib/queries/chartQueries";

export const useCreateLensCompletion = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            prompt,
            model,
            chartId,
            workspaceId,
            sectionIdx,
        }: {
            prompt: string;
            model: string;
            chartId: string;
            workspaceId: string;
            sectionIdx: number;
        }) => {
            // Generate a new completion
            const newCompletion: LensCompletion = {
                name: `New Completion`,
                model: model,
                prompt: prompt || "",
                tokens: [],
            };

            // Get current workspace data
            const chartConfig = await getLensChartConfig(chartId);

            const existingCompletions = chartConfig?.data?.completions || [];
            const updatedCompletions = [...existingCompletions, newCompletion];

            await setChartConfig(chartId, { data: { completions: updatedCompletions } });

            return { newCompletion, updatedCompletions };
        },
        onMutate: async ({ chartId, workspaceId, sectionIdx, model, prompt }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["lensChartConfig", workspaceId, sectionIdx] });

            // Snapshot the previous value
            const previousConfig = queryClient.getQueryData(["lensChartConfig", workspaceId, sectionIdx]);

            // Optimistically update to the new value
            queryClient.setQueryData(["lensChartConfig", workspaceId, sectionIdx], (old: any) => {
                if (!old) return old;
                const newCompletion: LensCompletion = {
                    name: `New Completion`,
                    model: model,
                    prompt: prompt || "",
                    tokens: [],
                };
                return {
                    ...old,
                    data: {
                        ...old.data,
                        completions: [...(old.data?.completions || []), newCompletion]
                    }
                };
            });

            // Return a context with the previous config
            return { previousConfig, workspaceId, sectionIdx };
        },
        onError: (error, variables, context) => {
            // If the mutation fails, use the context to roll back
            if (context?.previousConfig) {
                queryClient.setQueryData(
                    ["lensChartConfig", context.workspaceId, context.sectionIdx],
                    context.previousConfig
                );
            }
            console.error("Error generating completion:", error);
        },
        onSettled: (data, error, variables) => {
            // Always refetch after error or success
            queryClient.invalidateQueries({ queryKey: ["lensChartConfig", variables.workspaceId, variables.sectionIdx] });
        },
    });
};

export const useDeleteLensCompletion = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            chartId,
            completionIndex,
        }: {
            chartId: string;
            completionIndex: number;
        }) => {
            const chartConfig = await getLensChartConfig(chartId);

            if (!chartConfig) {
                throw new Error("Chart config not found");
            }

            const updatedCompletions = chartConfig?.data?.completions.filter(
                (completion: LensCompletion, index: number) => index !== completionIndex
            );
            await setChartConfig(chartId, { data: { completions: updatedCompletions } });

            return updatedCompletions;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["lensCharts"] });
            console.log("Successfully deleted completion");
        },
        onError: (error) => {
            console.error("Error deleting completion:", error);
        },
    });
};
