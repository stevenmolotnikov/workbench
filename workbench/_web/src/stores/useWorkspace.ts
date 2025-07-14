import { create } from "zustand";
import type { Workspace } from "@/types/workspace";
import type { LensCompletion } from "@/types/lens";
import type { PatchingCompletion } from "@/types/patching";
import { 
  getWorkspacesWithCharts, 
  createWorkspace as apiCreateWorkspace, 
  deleteWorkspace as apiDeleteWorkspace, 
  getLensWorkspace,
  setLensWorkspace,
  getLensCompletion,
  setLensCompletion,
  getPatchingWorkspace,
  setPatchingWorkspace,
  getPatchingCompletion,
  setPatchingCompletion,
  type Workspace as ApiWorkspace 
} from "@/lib/api";

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
    
    // Lens workspace operations
    getLensWorkspace: (workspaceId: string) => Promise<Workspace | null>;
    setLensWorkspace: (workspaceId: string, lensData: Workspace) => Promise<void>;
    getLensCompletion: (workspaceId: string) => Promise<LensCompletion | null>;
    setLensCompletion: (workspaceId: string, completion: LensCompletion) => Promise<void>;
    
    // Patching workspace operations
    getPatchingWorkspace: (workspaceId: string) => Promise<Workspace | null>;
    setPatchingWorkspace: (workspaceId: string, patchingData: Workspace) => Promise<void>;
    getPatchingCompletion: (workspaceId: string) => Promise<PatchingCompletion | null>;
    setPatchingCompletion: (workspaceId: string, completion: PatchingCompletion) => Promise<void>;
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
    
    // Lens workspace operations
    getLensWorkspace: async (workspaceId: string) => {
        try {
            return await getLensWorkspace(workspaceId);
        } catch (error) {
            set({ error: error as Error });
            throw error;
        }
    },
    
    setLensWorkspace: async (workspaceId: string, lensData: Workspace) => {
        try {
            await setLensWorkspace(workspaceId, lensData);
            
            // Refresh workspaces list
            const workspaces = await get().fetchWorkspaces();
            set({ workspaces });
        } catch (error) {
            set({ error: error as Error });
            throw error;
        }
    },
    
    getLensCompletion: async (workspaceId: string) => {
        try {
            return await getLensCompletion(workspaceId);
        } catch (error) {
            set({ error: error as Error });
            throw error;
        }
    },
    
    setLensCompletion: async (workspaceId: string, completion: LensCompletion) => {
        try {
            await setLensCompletion(workspaceId, completion);
            
            // Refresh workspaces list
            const workspaces = await get().fetchWorkspaces();
            set({ workspaces });
        } catch (error) {
            set({ error: error as Error });
            throw error;
        }
    },
    
    // Patching workspace operations
    getPatchingWorkspace: async (workspaceId: string) => {
        try {
            return await getPatchingWorkspace(workspaceId);
        } catch (error) {
            set({ error: error as Error });
            throw error;
        }
    },
    
    setPatchingWorkspace: async (workspaceId: string, patchingData: Workspace) => {
        try {
            await setPatchingWorkspace(workspaceId, patchingData);
            
            // Refresh workspaces list
            const workspaces = await get().fetchWorkspaces();
            set({ workspaces });
        } catch (error) {
            set({ error: error as Error });
            throw error;
        }
    },
    
    getPatchingCompletion: async (workspaceId: string) => {
        try {
            return await getPatchingCompletion(workspaceId);
        } catch (error) {
            set({ error: error as Error });
            throw error;
        }
    },
    
    setPatchingCompletion: async (workspaceId: string, completion: PatchingCompletion) => {
        try {
            await setPatchingCompletion(workspaceId, completion);
            
            // Refresh workspaces list
            const workspaces = await get().fetchWorkspaces();
            set({ workspaces });
        } catch (error) {
            set({ error: error as Error });
            throw error;
        }
    },
}));
