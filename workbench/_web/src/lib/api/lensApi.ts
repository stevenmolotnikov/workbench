import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LensCompletion } from "@/types/lens";
import { setWorkspaceData, getWorkspaceData } from "@/lib/queries/chartQueries";

export const useCreateLensCompletion = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ prompt, model, chartId }: { 
            prompt: string; 
            model: string; 
            chartId: string;
        }) => {
            // Generate a new completion
            const newCompletion: LensCompletion = {
                id: `completion-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
                name: `New Completion`,
                model: model,
                prompt: prompt || "",
                tokens: [],
            };

            // Get current workspace data
            const workspaceData = await getWorkspaceData(chartId) as { completions: LensCompletion[] };

            // Add new completion
            const updatedCompletions = [...(workspaceData?.completions || []), newCompletion];
            await setWorkspaceData(chartId, { completions: updatedCompletions });

            return newCompletion;
        },
        onSuccess: (data, variables) => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['lensCharts'] });
            console.log("Successfully created new completion");
        },
        onError: (error) => {
            console.error("Error generating completion:", error);
        },
    });
}

export const useDeleteLensCompletion = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ chartId, completionId }: { chartId: string; completionId: string }) => {
            const workspaceData = await getWorkspaceData(chartId) as { completions: LensCompletion[] };

            const updatedCompletions = workspaceData.completions.filter(completion => completion.id !== completionId);
            await setWorkspaceData(chartId, { completions: updatedCompletions });

            return updatedCompletions;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['lensCharts'] });
            console.log("Successfully deleted completion");
        },
        onError: (error) => {
            console.error("Error deleting completion:", error);
        },
    });
}