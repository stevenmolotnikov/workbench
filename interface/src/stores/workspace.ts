import { create } from 'zustand'
import { LogitLensWorkspace } from '@/types/lens'

interface WorkspaceState {
    savedWorkspaces: LogitLensWorkspace[] 
    exportWorkspace: (workspace: LogitLensWorkspace) => void
    loadWorkspace: (workspace: LogitLensWorkspace) => void
    deleteWorkspace: (index: number) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
    savedWorkspaces: [],
    exportWorkspace: (workspace: LogitLensWorkspace) => {
        set((state) => ({
            savedWorkspaces: [workspace, ...state.savedWorkspaces].slice(0, 5)
        }))
    },
    loadWorkspace: (workspace: LogitLensWorkspace) => {
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
