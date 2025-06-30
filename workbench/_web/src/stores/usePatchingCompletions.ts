import { create } from 'zustand';
import type { Completion } from '@/types/workspace';
import type { Token } from '@/types/tokenizer';

interface PatchingCompletionsState {
    source: Completion;
    destination: Completion;
    correctToken: Token | null;
    incorrectToken: Token | null;
    
    setSource: (completion: Completion) => void;
    setDestination: (completion: Completion) => void;
    updateSource: (updates: Partial<Completion>) => void;
    updateDestination: (updates: Partial<Completion>) => void;
    setCorrectToken: (token: Token) => void;
    setIncorrectToken: (token: Token) => void;
}

const makeDefaultCompletion = (name: string): Completion => ({
    id: name,
    prompt: "",
});

export const usePatchingCompletions = create<PatchingCompletionsState>((set, get) => ({
    source: makeDefaultCompletion("source"),
    destination: makeDefaultCompletion("destination"),
    correctToken: null,
    incorrectToken: null,

    setSource: (completion) => set({ source: completion }),

    setDestination: (completion) => set({ destination: completion }),

    updateSource: (updates) => set((state) => ({
        source: { ...state.source, ...updates }
    })),

    updateDestination: (updates) => set((state) => ({
        destination: { ...state.destination, ...updates }
    })),

    setCorrectToken: (token) => set({ correctToken: token }),
    setIncorrectToken: (token) => set({ incorrectToken: token }),

}));
