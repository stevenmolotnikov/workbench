import { create } from "zustand";
import { LineGraphAnnotation } from "@/types/workspace";

interface AnnotationState {
    annotations: LineGraphAnnotation[];
    pendingAnnotation: LineGraphAnnotation | null;
    emphasizedAnnotation: LineGraphAnnotation | null;

    // Pending annotations when creating a new annotation
    addPendingAnnotation: (annotation: LineGraphAnnotation) => void;
    setPendingAnnotation: (text: string) => void;
    cancelPendingAnnotation: () => void;
    deleteAnnotation: (id: string) => void;

    // Emphasize annotations on hover
    setEmphasizedAnnotation: (annotation: LineGraphAnnotation) => void;
    clearEmphasizedAnnotation: () => void;
}

export const useLineGraphAnnotations = create<AnnotationState>((set) => ({
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

            state.pendingAnnotation.text = text;

            return {
                annotations: [...state.annotations, state.pendingAnnotation],
                pendingAnnotation: null,
            };
        }),
    
    cancelPendingAnnotation: () => set({ pendingAnnotation: null }),

    deleteAnnotation: (id) =>
        set((state) => ({
            annotations: state.annotations.filter((a) => a.id !== id),
            emphasizedAnnotation: null,
        })),
}));
