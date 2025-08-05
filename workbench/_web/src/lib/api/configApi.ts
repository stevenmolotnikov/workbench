import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addConfig, deleteConfig, setConfig } from "@/lib/queries/configQueries";
import { NewConfig } from "@/db/schema";

export const useCreateChartConfig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ config }: { config: NewConfig }) => {
            await addConfig(config);
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
            await deleteConfig(configId);
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
        mutationFn: async ({ configId, config }: { configId: string; config: NewConfig }) => {
            await setConfig(configId, config);
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
