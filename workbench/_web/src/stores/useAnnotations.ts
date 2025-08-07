import { create } from 'zustand';
import type { AnnotationData } from '@/types/annotations';

interface AnnotationsState {
    pendingAnnotation: AnnotationData | null;

    setPendingAnnotation: (annotation: AnnotationData | null) => void;

    selectedCells: string[];

    setSelectedCells: (cells: string[]) => void;
}

export const useAnnotations = create<AnnotationsState>()((set) => ({
    pendingAnnotation: null,

    setPendingAnnotation: (annotation: AnnotationData | null) => set({ pendingAnnotation: annotation }),

    selectedCells: [],

    setSelectedCells: (cells: string[]) => set({ selectedCells: cells }),
}));