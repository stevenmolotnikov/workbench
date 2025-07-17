import { create } from 'zustand';

interface WorkspaceState {
    jobStatus: string;
    setJobStatus: (jobStatus: string) => void;
    
    activeTab: string | null;
    setActiveTab: (tabId: string | null) => void;
}

export const useWorkspace = create<WorkspaceState>((set) => ({
    jobStatus: "idle",
    setJobStatus: (jobStatus: string) => set({ jobStatus }),
    
    activeTab: null,
    setActiveTab: (tabId: string | null) => set({ activeTab: tabId }),
}));