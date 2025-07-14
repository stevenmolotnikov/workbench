import { create } from 'zustand';
import type { LensCompletion } from '@/types/lens';

interface LensWorkspaceState {
    // Lens Workspace Settings
    tokenizeOnEnter: boolean;
    graphOnTokenize: boolean;
    setTokenizeOnEnter: (tokenizeOnEnter: boolean) => void;
    setGraphOnTokenize: (graphOnTokenize: boolean) => void;

    // Lens Completions State
    activeCompletions: LensCompletion[];
    emphasizedCompletions: number[];
    setActiveCompletions: (completions: LensCompletion[]) => void;
    setEmphasizedCompletions: (indices: number[]) => void;
    handleNewCompletion: (model: string) => void;
    handleLoadCompletion: (completionToLoad: LensCompletion) => void;
    handleDeleteCompletion: (id: string) => void;
    handleUpdateCompletion: (id: string, updates: Partial<LensCompletion>) => void;
}

// Generate a unique ID
const generateUniqueId = (): string => {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
};

// Generate a unique name in the format "Untitled n"
const generateCompletionCardName = (existingCompletions: LensCompletion[]): string => {
    const existingNames = existingCompletions.map(completion => completion.name);
    let counter = 1;
    let name = `Untitled ${counter}`;
    
    while (existingNames.includes(name)) {
        counter++;
        name = `Untitled ${counter}`;
    }
    
    return name;
};

export const useLensWorkspace = create<LensWorkspaceState>((set) => ({
    tokenizeOnEnter: true,
    graphOnTokenize: true,

    setTokenizeOnEnter: (tokenizeOnEnter) => set({ tokenizeOnEnter }),
    setGraphOnTokenize: (graphOnTokenize) => set({ graphOnTokenize }),

    activeCompletions: [],
    emphasizedCompletions: [],

    setActiveCompletions: (completions) => set({ activeCompletions: completions }),
    setEmphasizedCompletions: (indices) => set({ emphasizedCompletions: indices }),

    handleNewCompletion: (model) => {
        set((state) => {
            const newCompletion: LensCompletion = {
                name: generateCompletionCardName(state.activeCompletions),
                id: generateUniqueId(),
                prompt: "",
                model: model,
                tokens: [],
            };
            return {
                activeCompletions: [...state.activeCompletions, newCompletion]
            };
        });
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