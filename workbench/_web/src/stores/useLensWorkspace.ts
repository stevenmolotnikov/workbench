import { create } from 'zustand';

interface LensWorkspaceState {
    // Lens Workspace Settings
    tokenizeOnEnter: boolean;
    graphOnTokenize: boolean;
    visibleChartId: string | null;

    setVisibleChartId: (visibleChartId: string | null) => void;
    setTokenizeOnEnter: (tokenizeOnEnter: boolean) => void;
    setGraphOnTokenize: (graphOnTokenize: boolean) => void;
}



export const useLensWorkspace = create<LensWorkspaceState>((set) => ({
    tokenizeOnEnter: true,
    graphOnTokenize: true,
    visibleChartId: null,

    setVisibleChartId: (visibleChartId) => set({ visibleChartId }),
    setTokenizeOnEnter: (tokenizeOnEnter) => set({ tokenizeOnEnter }),
    setGraphOnTokenize: (graphOnTokenize) => set({ graphOnTokenize }),
}));