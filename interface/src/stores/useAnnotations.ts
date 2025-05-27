import { create } from "zustand";
import { LineGraphAnnotation, HeatmapAnnotation } from "@/types/lens";

export type Annotation =
    | { type: "lineGraph"; data: LineGraphAnnotation }
    | { type: "heatmap"; data: HeatmapAnnotation };


interface AnnotationState {
    annotations: Annotation[];
    pendingAnnotation: Annotation | null;
    emphasizedAnnotation: Annotation | null;

    // Pending annotations when creating a new annotation
    addPendingAnnotation: (annotation: Annotation) => void;
    setPendingAnnotation: (text: string) => void;
    cancelPendingAnnotation: () => void;
    deleteAnnotation: (id: string) => void;
    setAnnotations: (annotations: Annotation[]) => void;

    // Emphasize annotations on hover
    setEmphasizedAnnotation: (annotation: Annotation) => void;
    clearEmphasizedAnnotation: () => void;
}

export const useAnnotations = create<AnnotationState>((set) => ({
    annotations: [],
    pendingAnnotation: null,
    emphasizedAnnotation: null,
    addPendingAnnotation: (annotation) => set({ pendingAnnotation: annotation }),

    setEmphasizedAnnotation: (annotation) => set({ emphasizedAnnotation: annotation }),
    clearEmphasizedAnnotation: () => set({ emphasizedAnnotation: null }),

    setPendingAnnotation: (text) =>
        set((state) => {
            if (!state.pendingAnnotation) {
                return state;
            }

            state.pendingAnnotation.data.text = text;

            return {
                annotations: [...state.annotations, state.pendingAnnotation],
                pendingAnnotation: null,
            };
        }),
    
    cancelPendingAnnotation: () => set({ pendingAnnotation: null }),

    setAnnotations: (annotations) => set({ annotations }),

    deleteAnnotation: (id) =>
        set((state) => ({
            annotations: state.annotations.filter((a) => a.data.id !== id),
            emphasizedAnnotation: null,
        })),
}));
