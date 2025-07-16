import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWorkspace } from "@/lib/queries/workspaceQueries";
import { setChartConfig } from "@/lib/queries/chartQueries";
import { ChartConfigData } from "@/types/charts";

export const useCreateWorkspace = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ name }: { name: string }) => {
            // This calls the server action which handles authentication
            const newWorkspace = await createWorkspace(name);
            return newWorkspace;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            console.log("Successfully created workspace");
        },
        onError: (error) => {
            console.error("Error creating workspace:", error);
        },
    });
};

export const useUpdateChartConfig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ chartId, config }: { chartId: string; config: ChartConfigData }) => {
            await setChartConfig(chartId, config);
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