import { create } from 'zustand';
import type { Model, Token } from '@/types/models';
import type { SelectedComponent } from '@/components/transformer/InteractiveTransformer';

interface LensWorkspaceState {
    tokenData: Token[];
    setTokenData: (tokenData: Token[]) => void;

    clickedComponent: SelectedComponent | null;
    setClickedComponent: (clickedComponent: SelectedComponent | null) => void;
}

export const useLensWorkspace = create<LensWorkspaceState>()((set) => ({
    tokenData: [],
    setTokenData: (tokenData: Token[]) => set({ tokenData }),

    clickedComponent: null,
    setClickedComponent: (clickedComponent: SelectedComponent | null) => set({ clickedComponent }),
}));