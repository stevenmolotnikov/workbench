import { create } from "zustand";
import type { LineGraphAnnotation, HeatmapAnnotation, LineGraphRangeAnnotation } from "@/types/lens";
import type { Annotation as WorkspaceAnnotation } from "@/types/workspace";
import { nanoid } from 'nanoid';

export type Annotation =
    | { type: "lineGraph"; data: LineGraphAnnotation }
    | { type: "lineGraphRange"; data: LineGraphRangeAnnotation }
    | { type: "heatmap"; data: HeatmapAnnotation }
    | { type: "token"; data: WorkspaceAnnotation };

export interface AnnotationGroup {
    id: string;
    name: string;
    annotations: Annotation[];
    isExpanded: boolean;
    createdAt: Date;
}

export type AnnotationItem = Annotation | AnnotationGroup;

interface AnnotationState {
    isOpen: boolean;
    annotations: Annotation[];
    groups: AnnotationGroup[];
    pendingAnnotation: Annotation | null;
    emphasizedAnnotation: Annotation | null;

    // Pending annotations when creating a new annotation
    addPendingAnnotation: (annotation: Annotation) => void;
    setPendingAnnotation: (text: string) => void;
    cancelPendingAnnotation: () => void;
    deleteAnnotation: (id: string) => void;
    setAnnotations: (annotations: Annotation[]) => void;

    // Group management
    createGroup: (name: string, annotations: Annotation[]) => void;
    addAnnotationToGroup: (annotationId: string, groupId: string) => void;
    removeAnnotationFromGroup: (annotationId: string, groupId: string) => void;
    deleteGroup: (groupId: string) => void;
    toggleGroupExpansion: (groupId: string) => void;
    updateGroupName: (groupId: string, name: string) => void;

    // Emphasize annotations on hover
    setEmphasizedAnnotation: (annotation: Annotation) => void;
    clearEmphasizedAnnotation: () => void;

    // Helper functions
    getUngroupedAnnotations: () => Annotation[];
    findAnnotationById: (id: string) => { annotation: Annotation; groupId?: string } | null;
}

export const useAnnotations = create<AnnotationState>((set, get) => ({
    isOpen: false,
    annotations: [],
    groups: [],
    pendingAnnotation: null,
    emphasizedAnnotation: null,

    addPendingAnnotation: (annotation) => set((state) => {
        if (!state.isOpen) return state;
        return { pendingAnnotation: annotation };
    }),

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
        set((state) => {
            // Remove from ungrouped annotations
            const newAnnotations = state.annotations.filter((a) => a.data.id !== id);
            
            // Remove from groups and update groups
            const newGroups = state.groups.map((group) => ({
                ...group,
                annotations: group.annotations.filter((a) => a.data.id !== id),
            })).filter((group) => group.annotations.length > 0); // Remove empty groups

            return {
                annotations: newAnnotations,
                groups: newGroups,
                emphasizedAnnotation: null,
            };
        }),

    createGroup: (name, annotations) =>
        set((state) => {
            const groupId = nanoid();
            const newGroup: AnnotationGroup = {
                id: groupId,
                name,
                annotations,
                isExpanded: true,
                createdAt: new Date(),
            };

            // Remove annotations from ungrouped list
            const annotationIds = annotations.map((a) => a.data.id);
            const newAnnotations = state.annotations.filter(
                (a) => !annotationIds.includes(a.data.id)
            );

            // Remove annotations from other groups
            const newGroups = state.groups.map((group) => ({
                ...group,
                annotations: group.annotations.filter(
                    (a) => !annotationIds.includes(a.data.id)
                ),
            })).filter((group) => group.annotations.length > 0);

            return {
                annotations: newAnnotations,
                groups: [...newGroups, newGroup],
            };
        }),

    addAnnotationToGroup: (annotationId, groupId) =>
        set((state) => {
            const annotation = get().findAnnotationById(annotationId);
            if (!annotation) return state;

            // Remove from current location
            const newAnnotations = state.annotations.filter((a) => a.data.id !== annotationId);
            const newGroups = state.groups.map((group) => {
                if (group.id === groupId) {
                    return {
                        ...group,
                        annotations: [...group.annotations, annotation.annotation],
                    };
                }
                return {
                    ...group,
                    annotations: group.annotations.filter((a) => a.data.id !== annotationId),
                };
            }).filter((group) => group.annotations.length > 0);

            return {
                annotations: newAnnotations,
                groups: newGroups,
            };
        }),

    removeAnnotationFromGroup: (annotationId, groupId) =>
        set((state) => {
            const group = state.groups.find((g) => g.id === groupId);
            if (!group) return state;

            const annotation = group.annotations.find((a) => a.data.id === annotationId);
            if (!annotation) return state;

            const newGroups = state.groups.map((g) => {
                if (g.id === groupId) {
                    return {
                        ...g,
                        annotations: g.annotations.filter((a) => a.data.id !== annotationId),
                    };
                }
                return g;
            }).filter((group) => group.annotations.length > 0);

            return {
                annotations: [...state.annotations, annotation],
                groups: newGroups,
            };
        }),

    deleteGroup: (groupId) =>
        set((state) => {
            const group = state.groups.find((g) => g.id === groupId);
            if (!group) return state;

            // Move all annotations back to ungrouped
            const newAnnotations = [...state.annotations, ...group.annotations];
            const newGroups = state.groups.filter((g) => g.id !== groupId);

            return {
                annotations: newAnnotations,
                groups: newGroups,
            };
        }),

    toggleGroupExpansion: (groupId) =>
        set((state) => ({
            groups: state.groups.map((group) =>
                group.id === groupId
                    ? { ...group, isExpanded: !group.isExpanded }
                    : group
            ),
        })),

    updateGroupName: (groupId, name) =>
        set((state) => ({
            groups: state.groups.map((group) =>
                group.id === groupId ? { ...group, name } : group
            ),
        })),

    getUngroupedAnnotations: () => {
        const state = get();
        return state.annotations.filter((annotation) => annotation.data.text !== "");
    },

    findAnnotationById: (id) => {
        const state = get();
        
        // Check ungrouped annotations
        const ungroupedAnnotation = state.annotations.find((a) => a.data.id === id);
        if (ungroupedAnnotation) {
            return { annotation: ungroupedAnnotation };
        }

        // Check grouped annotations
        for (const group of state.groups) {
            const annotation = group.annotations.find((a) => a.data.id === id);
            if (annotation) {
                return { annotation, groupId: group.id };
            }
        }

        return null;
    },
}));
