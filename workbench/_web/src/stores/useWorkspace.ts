import { create } from 'zustand';
import type { Model } from '@/types/models';

interface WorkspaceState {
    jobStatus: string;
    setJobStatus: (jobStatus: string) => void;

    currentChartType: "heatmap" | "line" | null;
    setCurrentChartType: (chartType: "heatmap" | "line" | null) => void;

    selectedModel: Model | null;
    setSelectedModel: (model: Model | null) => void;
}

export const useWorkspace = create<WorkspaceState>()((set, get) => ({
    jobStatus: "idle",
    setJobStatus: (jobStatus: string) => set({ jobStatus }),

    currentChartType: null,
    setCurrentChartType: (chartType: "heatmap" | "line" | null) => set({ currentChartType: chartType }),

    selectedModel: null,
    setSelectedModel: (model: Model | null) => set({ selectedModel: model }),
}));