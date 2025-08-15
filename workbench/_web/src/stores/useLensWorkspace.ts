import { create } from 'zustand';
import type { Token } from '@/types/models';

interface LensWorkspaceState {
    tokenData: Token[];
    setTokenData: (tokenData: Token[]) => void;

    highlightedLineIds: Set<string>;
    setHighlightedLineIds: (highlightedLineIds: Set<string>) => void;

    toggleLineHighlight: (lineId: string) => void;
    clearHighlightedLineIds: () => void;
}

export const useLensWorkspace = create<LensWorkspaceState>()((set) => ({
    tokenData: [],
    setTokenData: (tokenData: Token[]) => set({ tokenData }),

    highlightedLineIds: new Set(),
    setHighlightedLineIds: (highlightedLineIds: Set<string>) => set({ highlightedLineIds }),

    toggleLineHighlight: (lineId: string) => set((state) => {
        const newHighlightedLineIds = new Set(state.highlightedLineIds);
        if (state.highlightedLineIds.has(lineId)) {
            newHighlightedLineIds.delete(lineId);
        } else {
            newHighlightedLineIds.add(lineId);
        }
        return { highlightedLineIds: newHighlightedLineIds };
    }),

    clearHighlightedLineIds: () => set({ highlightedLineIds: new Set() }),
}));