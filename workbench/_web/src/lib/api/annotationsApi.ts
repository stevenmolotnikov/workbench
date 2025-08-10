import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAnnotation, deleteAnnotation } from "@/lib/queries/annotationQueries";
import { NewAnnotation } from "@/db/schema";

export const useCreateAnnotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newAnnotation: NewAnnotation) => {
            const annotation = await createAnnotation(newAnnotation);
            return annotation;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["annotations", variables.chartId] });
            console.log("Successfully created annotation");
        },
        onError: (error) => {
            console.error("Error creating annotation:", error);
        },
    });
};

export const useDeleteAnnotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        // Pass chartId to invalidate the correct query
        mutationFn: async ({ id, chartId }: { id: string, chartId: string }) => {
            await deleteAnnotation(id);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["annotations", variables.chartId] });
            console.log("Successfully deleted annotation");
        },
        onError: (error) => {
            console.error("Error deleting annotation:", error);
        },
    });
};