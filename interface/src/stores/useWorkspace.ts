import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { LogitLensWorkspace } from "@/types/lens";
import { ActivationPatchingWorkspace } from "@/types/patching";

export type Workspace = LogitLensWorkspace | ActivationPatchingWorkspace;

interface WorkspaceState {
    // Auth state
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    error: Error | null;

    // Workspace state
    workspaces: Workspace[];

    // Auth methods
    initialize: () => Promise<void>;

    // Workspace methods
    createWorkspace: (workspace: Workspace) => Promise<any>;
    fetchWorkspaces: () => Promise<any[]>;
    deleteWorkspace: (id: string) => Promise<void>;
}

const dataToWorkspace = (data: any): Workspace => {
    if ("completions" in data) {
        const { id, workspace_data, ...rest } = data;
        workspace_data.id = id;
        return workspace_data as LogitLensWorkspace;
    } else {
        const { id, workspace_data, ...rest } = data;
        workspace_data.id = id;
        return workspace_data as ActivationPatchingWorkspace;
    }
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
    // Auth state
    session: null,
    user: null,
    isLoading: true,
    error: null,

    // Workspace state
    workspaces: [],

    // Auth methods
    initialize: async () => {
        try {
            const supabase = createClient();

            // Get initial session
            const {
                data: { session },
            } = await supabase.auth.getSession();
            set({
                session,
                user: session?.user || null,
                isLoading: false,
            });

            // Set up auth state change listener
            supabase.auth.onAuthStateChange((_event, session) => {
                set({
                    session,
                    user: session?.user || null,
                    isLoading: false,
                });
            });

            // Fetch workspaces
            const workspaces = await get().fetchWorkspaces();
            set({ workspaces: workspaces.map(dataToWorkspace) });
        } catch (error) {
            set({
                error: error as Error,
                isLoading: false,
            });
        }
    },

    // Workspace methods
    createWorkspace: async (workspace) => {
        const { session, workspaces } = get();
        if (!session) throw new Error("Not authenticated");

        const supabase = createClient();

        if ("completions" in workspace) {
            const { data, error } = await supabase
                .from("lens_workspaces")
                .insert({
                    workspace_data: workspace,
                    user_id: session.user.id,
                })
                .select()
                .single();

            if (error) throw error;

            set({ workspaces: [...workspaces, workspace] });
            return data;
        } else {
            // It's an ActivationPatchingWorkspace
            throw new Error("Saving activation patching workspaces is not yet implemented");
        }
    },

    fetchWorkspaces: async () => {
        const { session } = get();
        if (!session) return [];

        const supabase = createClient();
        const { data, error } = await supabase
            .from("lens_workspaces")
            .select("*")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false });

        console.log(data);

        if (error) throw error;
        return data || [];
    },

    deleteWorkspace: async (id: string) => {
        const { session, workspaces } = get();
        if (!session) throw new Error("Not authenticated");

        const supabase = createClient();
        const { error } = await supabase
            .from("lens_workspaces")
            .delete()
            .eq("id", id)
            .eq("user_id", session.user.id);

        const filteredWorkspaces = workspaces.filter((workspace) => workspace.id !== id);
        set({ workspaces: filteredWorkspaces });

        if (error) throw error;
    },
}));

// Initialize auth state immediately when this module is imported
useWorkspaceStore.getState().initialize();
