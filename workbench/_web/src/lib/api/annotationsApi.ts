import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAnnotation, deleteAnnotation } from "@/lib/queries/annotationQueries";
import { AnnotationData } from "@/types/annotations";

export const useCreateAnnotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ chartId, type, data }: { chartId: string; type: "line" | "heatmap"; data: AnnotationData }) => {
            const newAnnotation = await createAnnotation(chartId, type, data);
            return newAnnotation;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["annotations"] });
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
        mutationFn: async ({ id, chartId }: { id: string; chartId: string }) => {
            await deleteAnnotation(id);
            return { id, chartId };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["annotations"] });
            console.log("Successfully deleted annotation");
        },
        onError: (error) => {
            console.error("Error deleting annotation:", error);
        },
    });
};