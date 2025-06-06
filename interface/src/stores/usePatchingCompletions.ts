import { create } from 'zustand';
import { PatchingCompletion, Connection } from '@/types/patching';

interface TokenReference {
    tokenId: number;
    counterId: number;
}

interface PatchingCompletionsState {
    source: PatchingCompletion;
    destination: PatchingCompletion;
    connections: Connection[];
    frozenTokens: TokenReference[];
    ablatedTokens: TokenReference[];
    setSource: (completion: PatchingCompletion) => void;
    setDestination: (completion: PatchingCompletion) => void;
    updateSource: (updates: Partial<PatchingCompletion>) => void;
    updateDestination: (updates: Partial<PatchingCompletion>) => void;
    setConnections: (connections: Connection[]) => void;
    addConnection: (connection: Connection) => void;
    removeConnection: (tokenIndex: number, counterIndex: number) => void;
    removeConnectionByIndex: (index: number) => void;
    clearConnections: () => void;
    addFrozenToken: (tokenId: number, counterId: number) => void;
    removeFrozenToken: (tokenId: number, counterId: number) => void;
    addAblatedToken: (tokenId: number, counterId: number) => void;
    removeAblatedToken: (tokenId: number, counterId: number) => void;
    clearFrozenTokens: () => void;
    clearAblatedTokens: () => void;
    resetCompletions: () => void;
}

const makeDefaultCompletion = (name: string): PatchingCompletion => ({
    id: name,
    prompt: "",
    tokens: [],
});

export const usePatchingCompletions = create<PatchingCompletionsState>((set, get) => ({
    source: makeDefaultCompletion("source"),
    destination: makeDefaultCompletion("destination"),
    connections: [],
    frozenTokens: [],
    ablatedTokens: [],

    setSource: (completion) => set({ source: completion }),

    setDestination: (completion) => set({ destination: completion }),

    updateSource: (updates) => set((state) => ({
        source: { ...state.source, ...updates }
    })),

    updateDestination: (updates) => set((state) => ({
        destination: { ...state.destination, ...updates }
    })),

    setConnections: (connections) => set({ connections }),

    addConnection: (connection) => set((state) => ({
        connections: [...state.connections, connection]
    })),

    removeConnection: (tokenIndex, counterIndex) => set((state) => ({
        connections: state.connections.filter(conn => 
            !conn.start.tokenIndices.includes(tokenIndex) && conn.start.counterIndex !== counterIndex
        )
    })),

    removeConnectionByIndex: (index) => set((state) => ({
        connections: state.connections.filter((_, i) => i !== index)
    })),

    clearConnections: () => set({ connections: [], frozenTokens: [], ablatedTokens: [] }),

    addFrozenToken: (tokenId, counterId) => set((state) => ({
        frozenTokens: [...state.frozenTokens.filter(t => !(t.tokenId === tokenId && t.counterId === counterId)), { tokenId, counterId }]
    })),

    removeFrozenToken: (tokenId, counterId) => set((state) => ({
        frozenTokens: state.frozenTokens.filter(t => !(t.tokenId === tokenId && t.counterId === counterId))
    })),

    addAblatedToken: (tokenId, counterId) => set((state) => ({
        ablatedTokens: [...state.ablatedTokens.filter(t => !(t.tokenId === tokenId && t.counterId === counterId)), { tokenId, counterId }]
    })),

    removeAblatedToken: (tokenId, counterId) => set((state) => ({
        ablatedTokens: state.ablatedTokens.filter(t => !(t.tokenId === tokenId && t.counterId === counterId))
    })),

    clearFrozenTokens: () => set({ frozenTokens: [] }),

    clearAblatedTokens: () => set({ ablatedTokens: [] }),

    resetCompletions: () => set({
        source: makeDefaultCompletion("source"),
        destination: makeDefaultCompletion("destination"),
        connections: [],
        frozenTokens: [],
        ablatedTokens: [],
    }),
}));
