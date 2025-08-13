import { create } from 'zustand';
import type { Model } from '@/types/models';

interface WorkspaceState {
    jobStatus: string;
    setJobStatus: (jobStatus: string) => void;

    selectedModel: Model | null;
    setSelectedModel: (model: Model | null) => void;
}

export const useWorkspace = create<WorkspaceState>()((set, get) => ({
    jobStatus: "idle",
    setJobStatus: (jobStatus: string) => set({ jobStatus }),

    selectedModel: null,
    setSelectedModel: (model: Model | null) => set({ selectedModel: model }),
}));