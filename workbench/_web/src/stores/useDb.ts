import { create } from 'zustand';
import { getWorkspaces, createWorkspace } from '@/lib/api';

interface DbState {
    // Loading states
    loading: boolean;
    error: string | null;
    
    // Data
    workspaces: Array<{
        id: number;
        name: string | null;
        public: boolean | null;
    }>;
    
    // Actions
    getWorkspaces: () => Promise<void>;
    createWorkspace: (name: string, isPublic?: boolean) => Promise<void>;
    clearError: () => void;
}

export const useDb = create<DbState>((set, get) => ({
    // Initial state
    loading: false,
    error: null,
    workspaces: [],

    // Clear error
    clearError: () => set({ error: null }),

    // Get all workspaces
    getWorkspaces: async () => {
        set({ loading: true, error: null });
        try {
            const workspaces = await getWorkspaces();
            console.log('Retrieved workspaces:', workspaces);
            
            set({ 
                loading: false, 
                workspaces 
            });
        } catch (error) {
            console.error('Failed to get workspaces:', error);
            set({ 
                loading: false, 
                error: error instanceof Error ? error.message : 'Failed to get workspaces' 
            });
        }
    },

    // Create a new workspace
    createWorkspace: async (name: string, isPublic = false) => {
        set({ loading: true, error: null });
        try {
            const workspace = await createWorkspace({
                name,
                public: isPublic
            });
            
            console.log('Created workspace:', workspace);
            
            // Refresh the workspaces list
            await get().getWorkspaces();
            
            set({ loading: false });
        } catch (error) {
            console.error('Failed to create workspace:', error);
            set({ 
                loading: false, 
                error: error instanceof Error ? error.message : 'Failed to create workspace' 
            });
        }
    },
}));