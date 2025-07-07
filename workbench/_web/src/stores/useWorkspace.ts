import { create } from "zustand";
import type { LogitLensWorkspace } from "@/types/lens";
import type { ActivationPatchingWorkspace } from "@/types/patching";
import { getWorkspaces, createWorkspace as apiCreateWorkspace, deleteWorkspace as apiDeleteWorkspace, type Workspace as ApiWorkspace } from "@/lib/api";

export type Workspace = LogitLensWorkspace | ActivationPatchingWorkspace;

interface WorkspaceState {
    // Auth state
    isLoading: boolean;
    error: Error | null;

    // Workspace state  
    workspaces: any[]; // Using any[] to match the API return type

    // Methods
    initialize: () => Promise<void>;
    createWorkspace: (name: string, type: "logit_lens" | "patching", isPublic?: boolean, initialData?: Record<string, unknown>) => Promise<any>;
    fetchWorkspaces: () => Promise<any[]>;
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

    createWorkspace: async (name: string, type: "logit_lens" | "patching", isPublic = false, initialData?: Record<string, unknown>) => {
        try {
            const newWorkspace = await apiCreateWorkspace(name, type, isPublic, initialData);
            
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
            const workspaces = await getWorkspaces();
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

// Initialize when this module is imported
useWorkspaceStore.getState().initialize();
