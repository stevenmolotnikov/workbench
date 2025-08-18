import { create } from 'zustand';
import type { Model } from '@/types/models';

interface WorkspaceState {
    jobStatus: string;
    setJobStatus: (jobStatus: string) => void;

    currentChartType: "heatmap" | "line";
    setCurrentChartType: (chartType: "heatmap" | "line") => void;

    selectedModel: Model | null;
    setSelectedModel: (model: Model | null) => void;
}

export const useWorkspace = create<WorkspaceState>()((set, get) => ({
    jobStatus: "idle",
    setJobStatus: (jobStatus: string) => set({ jobStatus }),

    currentChartType: "heatmap",
    setCurrentChartType: (chartType: "heatmap" | "line") => set({ currentChartType: chartType }),

    selectedModel: null,
    setSelectedModel: (model: Model | null) => set({ selectedModel: model }),
}));