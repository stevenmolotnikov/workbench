import { create } from 'zustand';
import type { LensCompletion } from '@/types/lens';

interface LensWorkspaceState {
    // Lens Workspace Settings
    tokenizeOnEnter: boolean;
    graphOnTokenize: boolean;
    setTokenizeOnEnter: (tokenizeOnEnter: boolean) => void;
    setGraphOnTokenize: (graphOnTokenize: boolean) => void;

    // Lens Completions State
    completions: LensCompletion[];
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

    completions: [],
    emphasizedCompletions: [],

    setActiveCompletions: (completions) => set({ completions: completions }),
    setEmphasizedCompletions: (indices) => set({ emphasizedCompletions: indices }),

    handleNewCompletion: (model) => {
        set((state) => {
            const newCompletion: LensCompletion = {
                name: generateCompletionCardName(state.completions),
                id: generateUniqueId(),
                prompt: "",
                model: model,
                tokens: [],
            };
            return {
                completions: [...state.completions, newCompletion]
            };
        });
    },

    handleLoadCompletion: (completionToLoad) => {
        set((state) => {
            if (state.completions.some(compl => compl.id === completionToLoad.id)) {
                return state;
            }
            return {
                completions: [...state.completions, completionToLoad]
            };
        });
    },

    handleDeleteCompletion: (id) => {
        set((state) => ({
            completions: state.completions.filter(compl => compl.id !== id)
        }));
    },

    handleUpdateCompletion: (id, updates) => {
        set((state) => ({
            completions: state.completions.map(compl =>
                compl.id === id
                    ? { ...compl, ...updates }
                    : compl
            )
        }));
    }
})); 