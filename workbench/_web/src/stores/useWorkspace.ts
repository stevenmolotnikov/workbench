import { create } from "zustand";
import type { LogitLensWorkspace } from "@/types/lens";
import type { ActivationPatchingWorkspace } from "@/types/patching";
import { getWorkspacesWithCharts, createWorkspace as apiCreateWorkspace, deleteWorkspace as apiDeleteWorkspace, type Workspace as ApiWorkspace } from "@/lib/api";

export type Workspace = LogitLensWorkspace | ActivationPatchingWorkspace;

interface WorkspaceState {
    // Auth state
    isLoading: boolean;
    error: Error | null;

    // Workspace state  
    workspaces: ApiWorkspace[];

    // Methods
    initialize: () => Promise<void>;
    createWorkspace: (name: string, isPublic?: boolean) => Promise<ApiWorkspace>;
    fetchWorkspaces: () => Promise<ApiWorkspace[]>;
    deleteWorkspace: (id: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
    // State
    isLoading: true,
    error: null,
    workspaces: [],

    // Methods
    initialize: async () => {
        try {
            const workspaces = await get().fetchWorkspaces();
            set({ 
                workspaces,
                isLoading: false 
            });
        } catch (error) {
            set({
                error: error as Error,
                isLoading: false,
            });
        }
    },

    createWorkspace: async (name: string, isPublic = false) => {
        try {
            const newWorkspace = await apiCreateWorkspace(name, isPublic);
            
            // Refresh workspaces list
            const workspaces = await get().fetchWorkspaces();
            set({ workspaces });
            
            return newWorkspace;
        } catch (error) {
            set({ error: error as Error });
            throw error;
        }
    },

    fetchWorkspaces: async () => {
        try {
            const workspaces = await getWorkspacesWithCharts();
            return workspaces;
        } catch (error) {
            set({ error: error as Error });
            throw error;
        }
    },

    deleteWorkspace: async (id: string) => {
        try {
            await apiDeleteWorkspace(id);
            
            // Update local state
            const { workspaces } = get();
            const filteredWorkspaces = workspaces.filter((workspace) => workspace.id !== id);
            set({ workspaces: filteredWorkspaces });
        } catch (error) {
            set({ error: error as Error });
            throw error;
        }
    },
}));
