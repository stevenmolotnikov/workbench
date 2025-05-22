import { create } from 'zustand';
import { LensCompletion } from '@/types/lens';

interface LensCompletionsState {
    activeCompletions: LensCompletion[];
    setActiveCompletions: (completions: LensCompletion[]) => void;
    handleNewCompletion: (model: string) => void;
    handleLoadCompletion: (completionToLoad: LensCompletion) => void;
    handleDeleteCompletion: (id: string) => void;
    handleUpdateCompletion: (id: string, updates: Partial<LensCompletion>) => void;
}

// Generate a unique ID
const generateUniqueId = (): string => {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
};

export const useLensCompletions = create<LensCompletionsState>((set) => ({
    activeCompletions: [],

    setActiveCompletions: (completions) => set({ activeCompletions: completions }),

    handleNewCompletion: (model) => {
        const newCompletion: LensCompletion = {
            id: generateUniqueId(),
            prompt: "The capital of France is",
            model: model,
            tokens: [{
                target_id: -1,
                idx: -1
            }]
        };
        set((state) => ({
            activeCompletions: [...state.activeCompletions, newCompletion]
        }));
    },

    handleLoadCompletion: (completionToLoad) => {
        set((state) => {
            if (state.activeCompletions.some(compl => compl.id === completionToLoad.id)) {
                return state;
            }
            return {
                activeCompletions: [...state.activeCompletions, completionToLoad]
            };
        });
    },

    handleDeleteCompletion: (id) => {
        set((state) => ({
            activeCompletions: state.activeCompletions.filter(compl => compl.id !== id)
        }));
    },

    handleUpdateCompletion: (id, updates) => {
        set((state) => ({
            activeCompletions: state.activeCompletions.map(compl =>
                compl.id === id
                    ? { ...compl, ...updates }
                    : compl
            )
        }));
    }
})); 