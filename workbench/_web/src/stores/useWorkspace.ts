import { create } from 'zustand';

interface WorkspaceState {
    jobStatus: string;
    setJobStatus: (jobStatus: string) => void;
}

export const useWorkspace = create<WorkspaceState>((set) => ({
    jobStatus: "idle",

    setJobStatus: (jobStatus: string) => set({ jobStatus }),
}));