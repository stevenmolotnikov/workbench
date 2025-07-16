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
        }: {
            prompt: string;
            model: string;
            chartId: string;
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

            await setChartConfig(chartId, { data: { completions: updatedCompletions } as LensConfig });

            console.log("updatedCompletions", updatedCompletions);
            console.log("chartid", chartId);

            return newCompletion;
        },
        onSuccess: (data, variables) => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ["lensCharts"] });
            queryClient.invalidateQueries({ queryKey: ["lensChartConfig"] });
            console.log("Successfully created new completion");
        },
        onError: (error) => {
            console.error("Error generating completion:", error);
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
            const chartConfig = await getChartConfig(chartId);

            const updatedCompletions = chartConfig?.data?.completions.filter(
                (completion: LensCompletion, index: number) => index !== completionIndex
            );
            await setChartConfig(chartId, { data: { completions: updatedCompletions } as LensConfig });

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
