import { create } from 'zustand';
import type { Completion } from '@/types/workspace';
import type { Token } from '@/types/tokenizer';

interface PatchingCompletionsState {
    source: string;
    destination: string;
    correctToken: Token | null;
    incorrectToken: Token | null;
    
    setSource: (completion: string) => void;
    setDestination: (completion: string) => void;

    setCorrectToken: (token: Token | null) => void;
    setIncorrectToken: (token: Token | null) => void;
}

export const usePatchingCompletions = create<PatchingCompletionsState>((set, get) => ({
    source: "",
    destination: "",
    correctToken: null,
    incorrectToken: null,

    setSource: (source) => set({ source }),

    setDestination: (destination) => set({ destination }),

    setCorrectToken: (token) => set({ correctToken: token }),
    setIncorrectToken: (token) => set({ incorrectToken: token }),

}));
