import { create } from 'zustand';
import type { Layout } from '@/types/workspace';

interface WorkspaceState {
    jobStatus: string;
    setJobStatus: (jobStatus: string) => void;
    
    layout: Layout;
    setLayout: (layout: Layout) => void;
}

export const useWorkspace = create<WorkspaceState>((set) => ({
    jobStatus: "idle",
    setJobStatus: (jobStatus: string) => set({ jobStatus }),
    
    layout: 1,
    setLayout: (layout: Layout) => set({ layout }),
}));