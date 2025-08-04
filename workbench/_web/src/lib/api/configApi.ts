import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addChartConfig, deleteChartConfig, setChartConfig } from "@/lib/queries/configQueries";
import { NewChartConfig } from "@/db/schema";

export const useCreateChartConfig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ chartConfig }: { chartConfig: NewChartConfig }) => {
            await addChartConfig(chartConfig);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lensCharts"] });
        },
        onError: (error) => {
            console.error("Error generating completion:", error);
        },
    });
};

export const useDeleteChartConfig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ configId }: { configId: string }) => {
            await deleteChartConfig(configId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lensCharts"] });
        },
        onError: (error) => {
            console.error("Error deleting completion:", error);
        },
    });
};

export const useUpdateChartConfig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ configId, config }: { configId: string; config: NewChartConfig }) => {
            await setChartConfig(configId, config);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["lensCharts"] });
            console.log("Successfully updated chart config");
        },
        onError: (error) => {
            console.error("Error updating workspace:", error);
        },
    });
};
