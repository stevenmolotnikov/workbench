import { create } from 'zustand';
import type { LensCompletion } from '@/types/lens';

interface LensWorkspaceState {
    // Lens Workspace Settings
    tokenizeOnEnter: boolean;
    graphOnTokenize: boolean;
    setTokenizeOnEnter: (tokenizeOnEnter: boolean) => void;
    setGraphOnTokenize: (graphOnTokenize: boolean) => void;
}

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
}));