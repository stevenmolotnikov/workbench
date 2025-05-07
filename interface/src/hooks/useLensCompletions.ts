// hooks/useCompletions.js
import { useState } from 'react';
import { LensCompletion } from '@/types/lens';

export function useLensCompletions() {
    const [activeCompletions, setActiveCompletions] = useState<LensCompletion[]>([]);

    // Generate a unique ID
    const generateUniqueId = (): string => {
        return Math.random().toString(16).slice(2) + Date.now().toString(16);
    };

    // Make a new completion
    const handleNewCompletion = (model: string) => {
        const newCompletion: LensCompletion = {
            id: generateUniqueId(),
            name: "Untitled",
            prompt: "The capital of France is",
            model: model,
            selectedTokenIndices: [-1]
        }
        handleLoadCompletion(newCompletion);
    }

    // Load a completion if it's not already active
    const handleLoadCompletion = (completionToLoad: LensCompletion) => {
        if (activeCompletions.some(compl => compl.id === completionToLoad.id)) {
            return;
        }
        setActiveCompletions(prev => [...prev, completionToLoad]);
    };

    // Delete a completion
    const handleDeleteCompletion = (id: string) => {
        setActiveCompletions(prev => prev.filter(compl => compl.id !== id));
    };

    // Update a completion
    const handleUpdateCompletion = (id: string, updates: Partial<LensCompletion>) => {
        setActiveCompletions(prev => prev.map(compl =>
            compl.id === id
                ? { ...compl, ...updates }
                : compl
        ));
    };

    return {
        activeCompletions,
        setActiveCompletions,
        handleNewCompletion,
        handleLoadCompletion,
        handleDeleteCompletion,
        handleUpdateCompletion,
    };
}