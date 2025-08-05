import { create } from 'zustand';
import type { Model } from '@/types/models';

interface WorkspaceState {
    jobStatus: string;
    setJobStatus: (jobStatus: string) => void;
    
    activeTab: string | null;
    setActiveTab: (tabId: string | null) => void;

    selectedModel: Model | null;
    setSelectedModel: (model: Model | null) => void;
}

export const useWorkspace = create<WorkspaceState>()((set) => ({
    jobStatus: "idle",
    setJobStatus: (jobStatus: string) => set({ jobStatus }),
    
    activeTab: null,
    setActiveTab: (tabId: string | null) => set({ activeTab: tabId }),

    selectedModel: null,
    setSelectedModel: (model: Model | null) => set({ selectedModel: model }),
}));