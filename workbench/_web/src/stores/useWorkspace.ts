import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkspaceState {
    jobStatus: string;
    setJobStatus: (jobStatus: string) => void;
    
    activeTab: string | null;
    setActiveTab: (tabId: string | null) => void;
    
    userMode: 'learn' | 'experiment' | null;
    setUserMode: (mode: 'learn' | 'experiment') => void;
}

export const useWorkspace = create<WorkspaceState>()(
    persist(
        (set) => ({
            jobStatus: "idle",
            setJobStatus: (jobStatus: string) => set({ jobStatus }),
            
            activeTab: null,
            setActiveTab: (tabId: string | null) => set({ activeTab: tabId }),
            
            userMode: null,
            setUserMode: (mode: 'learn' | 'experiment') => set({ userMode: mode }),
        }),
        {
            name: 'workspace-storage',
            // Only persist userMode
            partialize: (state) => ({ 
                userMode: state.userMode
            }),
        }
    )
);