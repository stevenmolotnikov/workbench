import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAnnotation, deleteAnnotation, updateAnnotation } from "@/lib/queries/annotationQueries";
import { NewAnnotation } from "@/db/schema";
import type { AnnotationData } from "@/types/annotations";

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

export const useUpdateAnnotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, chartId, data }: { id: string, chartId: string, data: AnnotationData }) => {
            const annotation = await updateAnnotation(id, data);
            return annotation;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["annotations", variables.chartId] });
            console.log("Successfully updated annotation");
        },
        onError: (error) => {
            console.error("Error updating annotation:", error);
        },
    });
};