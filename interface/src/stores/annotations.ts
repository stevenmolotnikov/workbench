import { create } from "zustand";
import { Annotation } from "@/types/workspace";

interface AnnotationState {
    annotations: Annotation[];
    activeAnnotation: { x: number, y: number } | null;
    annotationText: string;
    setActiveAnnotation: (coords: { x: number, y: number } | null) => void;
    setAnnotationText: (text: string) => void;
    addAnnotation: () => void;
    cancelAnnotation: () => void;
    deleteAnnotation: (id: string) => void;
    setAnnotations: (annotations: Annotation[]) => void;
}

export const useAnnotations = create<AnnotationState>((set) => ({
    annotations: [],
    activeAnnotation: null,
    annotationText: "",
    
    setAnnotations: (annotations) => set({ annotations }),
    
    setActiveAnnotation: (coords) => set((state) => {
        if (coords) {
            // Remove the last annotation if it has no text
            const updated = [...state.annotations];
            if (updated.length > 0 && !updated[updated.length - 1].text) {
                updated.pop();
            }

            const newAnnotation: Annotation = {
                id: Date.now().toString(),
                x: coords.x,
                y: coords.y,
                text: "",
                timestamp: Date.now(),
            };

            return {
                annotations: [...updated, newAnnotation],
                activeAnnotation: coords
            };
        }
        return { activeAnnotation: coords };
    }),

    setAnnotationText: (text) => set({ annotationText: text }),

    addAnnotation: () => set((state) => {
        if (!state.annotationText.trim()) return state;

        const updated = [...state.annotations];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0) {
            updated[lastIndex] = {
                ...updated[lastIndex],
                text: state.annotationText.trim()
            };
        }

        return {
            annotations: updated,
            activeAnnotation: null,
            annotationText: ""
        };
    }),

    cancelAnnotation: () => set((state) => ({
        annotations: state.annotations.slice(0, -1),
        activeAnnotation: null,
        annotationText: ""
    })),

    deleteAnnotation: (id) => set((state) => ({
        annotations: state.annotations.filter(a => a.id !== id)
    }))
}));