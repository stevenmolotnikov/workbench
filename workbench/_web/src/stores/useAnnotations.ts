import { create } from 'zustand';
import type { AnnotationData, LineAnnotation, BaseAnnotation } from '@/types/annotations';

interface AnnotationsState {
    pendingAnnotation: AnnotationData | null;

    setPendingAnnotation: (annotation: AnnotationData | null) => void;
}

export const useAnnotations = create<AnnotationsState>()((set) => ({
    pendingAnnotation: null,

    setPendingAnnotation: (annotation: AnnotationData | null) => set({ pendingAnnotation: annotation }),
}));