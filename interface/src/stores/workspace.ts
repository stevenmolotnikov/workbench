import { create } from 'zustand'
import { LogitLensWorkspace } from '@/types/lens'
import { ActivationPatchingWorkspace } from '@/types/activation-patching'

type Workspace = LogitLensWorkspace | ActivationPatchingWorkspace

interface WorkspaceState {
    savedWorkspaces: Workspace[]
    exportWorkspace: (workspace: Workspace) => void
    loadWorkspace: (workspace: Workspace) => void
    deleteWorkspace: (index: number) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
    savedWorkspaces: [],
    exportWorkspace: (workspace: Workspace) => {
        set((state) => ({
            savedWorkspaces: [workspace, ...state.savedWorkspaces].slice(0, 5)
        }))
    },
    loadWorkspace: (workspace: Workspace) => {
        // This is just a placeholder - the actual state updates will be handled by the component
        // since they depend on component-specific state
        return workspace
    },
    deleteWorkspace: (index: number) => {
        set((state) => ({
            savedWorkspaces: state.savedWorkspaces.filter((_, i) => i !== index)
        }))
    }
}))
