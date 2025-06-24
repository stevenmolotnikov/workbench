import { create } from 'zustand';
import { Connection } from '@/types/patching';
import { Completion } from '@/types/workspace';

interface TokenReference {
    tokenId: number;
    counterId: number;
}

interface PatchingCompletionsState {
    source: Completion;
    destination: Completion;
    targetTokens: {
        correct?: string;
        incorrect?: string;
    };
    activeTokenType: 'correct' | 'incorrect' | null;
    connections: Connection[];
    frozenTokens: TokenReference[];
    ablatedTokens: TokenReference[];
    setSource: (completion: Completion) => void;
    setDestination: (completion: Completion) => void;
    updateSource: (updates: Partial<Completion>) => void;
    updateDestination: (updates: Partial<Completion>) => void;
    setCorrectToken: (token: string) => void;
    setIncorrectToken: (token: string) => void;
    clearCorrectToken: () => void;
    clearIncorrectToken: () => void;
    setActiveTokenType: (type: 'correct' | 'incorrect' | null) => void;
    // Legacy methods for backward compatibility
    setTargetToken: (token: string) => void;
    clearTargetToken: () => void;
    targetToken: string;
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

const makeDefaultCompletion = (name: string): Completion => ({
    id: name,
    prompt: "",
});

export const usePatchingCompletions = create<PatchingCompletionsState>((set, get) => ({
    source: makeDefaultCompletion("source"),
    destination: makeDefaultCompletion("destination"),
    targetTokens: {},
    activeTokenType: null,
    connections: [],
    frozenTokens: [],
    ablatedTokens: [],

    // Legacy getter for backward compatibility
    get targetToken() {
        const state = get();
        return state.targetTokens.correct || state.targetTokens.incorrect || "";
    },

    setSource: (completion) => set({ source: completion }),

    setDestination: (completion) => set({ destination: completion }),

    updateSource: (updates) => set((state) => ({
        source: { ...state.source, ...updates }
    })),

    updateDestination: (updates) => set((state) => ({
        destination: { ...state.destination, ...updates }
    })),

    setCorrectToken: (token) => set((state) => ({
        targetTokens: { ...state.targetTokens, correct: token },
        activeTokenType: null
    })),

    setIncorrectToken: (token) => set((state) => ({
        targetTokens: { ...state.targetTokens, incorrect: token },
        activeTokenType: null
    })),

    clearCorrectToken: () => set((state) => ({
        targetTokens: { ...state.targetTokens, correct: undefined }
    })),

    clearIncorrectToken: () => set((state) => ({
        targetTokens: { ...state.targetTokens, incorrect: undefined }
    })),

    setActiveTokenType: (type) => set({ activeTokenType: type }),

    // Legacy methods for backward compatibility
    setTargetToken: (token) => set((state) => {
        const activeType = state.activeTokenType || 'correct';
        return {
            targetTokens: { ...state.targetTokens, [activeType]: token },
            activeTokenType: null
        };
    }),

    clearTargetToken: () => set({ targetTokens: {}, activeTokenType: null }),

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
        targetTokens: {},
        activeTokenType: null,
        connections: [],
        frozenTokens: [],
        ablatedTokens: [],
    }),
}));
