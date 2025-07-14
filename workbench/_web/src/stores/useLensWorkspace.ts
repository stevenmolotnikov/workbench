import { create } from 'zustand';
import type { LensCompletion, Prompt } from '@/types/lens';
import type { ChartData } from '@/stores/useCharts';

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
    
    // Multi-prompt support
    addPrompt: (completionId: string) => void;
    removePrompt: (completionId: string, promptId: string) => void;
    updatePrompt: (completionId: string, promptId: string, updates: Partial<Prompt>) => void;
    selectPrompt: (completionId: string, promptId: string) => void;
    
    // Chart support
    setCompletionChartMode: (completionId: string, chartMode: number | undefined) => void;
    setCompletionChartData: (completionId: string, chartData: ChartData | undefined) => void;
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
            const firstPromptId = generateUniqueId();
            const newCompletion: LensCompletion = {
                name: generateCompletionCardName(state.activeCompletions),
                id: generateUniqueId(),
                prompt: "", // Legacy support
                model: model,
                tokens: [], // Legacy support
                prompts: [{
                    id: firstPromptId,
                    text: "",
                    name: "Prompt 1",
                    tokens: []
                }],
                selectedPromptId: firstPromptId,
                chartMode: undefined,
                chartData: undefined
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
            
            // Convert legacy completion to new format if needed
            let completion = completionToLoad;
            if (!completion.prompts || completion.prompts.length === 0) {
                const promptId = generateUniqueId();
                completion = {
                    ...completionToLoad,
                    prompts: [{
                        id: promptId,
                        text: completionToLoad.prompt || "",
                        name: "Prompt 1",
                        tokens: completionToLoad.tokens || []
                    }],
                    selectedPromptId: promptId
                };
            }
            
            return {
                activeCompletions: [...state.activeCompletions, completion]
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
    },
    
    // Multi-prompt support
    addPrompt: (completionId) => {
        set((state) => ({
            activeCompletions: state.activeCompletions.map(compl => {
                if (compl.id === completionId) {
                    const newPromptId = generateUniqueId();
                    const promptNumber = compl.prompts.length + 1;
                    return {
                        ...compl,
                        prompts: [...compl.prompts, {
                            id: newPromptId,
                            text: "",
                            name: `Prompt ${promptNumber}`,
                            tokens: []
                        }]
                    };
                }
                return compl;
            })
        }));
    },
    
    removePrompt: (completionId, promptId) => {
        set((state) => ({
            activeCompletions: state.activeCompletions.map(compl => {
                if (compl.id === completionId && compl.prompts.length > 1) {
                    const newPrompts = compl.prompts.filter(p => p.id !== promptId);
                    // If we're removing the selected prompt, select the first one
                    const newSelectedId = compl.selectedPromptId === promptId 
                        ? newPrompts[0]?.id 
                        : compl.selectedPromptId;
                    return {
                        ...compl,
                        prompts: newPrompts,
                        selectedPromptId: newSelectedId
                    };
                }
                return compl;
            })
        }));
    },
    
    updatePrompt: (completionId, promptId, updates) => {
        set((state) => ({
            activeCompletions: state.activeCompletions.map(compl => {
                if (compl.id === completionId) {
                    return {
                        ...compl,
                        prompts: compl.prompts.map(prompt =>
                            prompt.id === promptId
                                ? { ...prompt, ...updates }
                                : prompt
                        ),
                        // Update legacy fields if updating selected prompt
                        ...(compl.selectedPromptId === promptId && updates.text !== undefined
                            ? { prompt: updates.text }
                            : {}),
                        ...(compl.selectedPromptId === promptId && updates.tokens !== undefined
                            ? { tokens: updates.tokens }
                            : {})
                    };
                }
                return compl;
            })
        }));
    },
    
    selectPrompt: (completionId, promptId) => {
        set((state) => ({
            activeCompletions: state.activeCompletions.map(compl => {
                if (compl.id === completionId) {
                    const selectedPrompt = compl.prompts.find(p => p.id === promptId);
                    if (selectedPrompt) {
                        return {
                            ...compl,
                            selectedPromptId: promptId,
                            // Update legacy fields
                            prompt: selectedPrompt.text,
                            tokens: selectedPrompt.tokens || []
                        };
                    }
                }
                return compl;
            })
        }));
    },
    
    // Chart support
    setCompletionChartMode: (completionId, chartMode) => {
        set((state) => ({
            activeCompletions: state.activeCompletions.map(compl =>
                compl.id === completionId
                    ? { ...compl, chartMode, chartData: undefined } // Clear data when changing mode
                    : compl
            )
        }));
    },
    
    setCompletionChartData: (completionId, chartData) => {
        set((state) => ({
            activeCompletions: state.activeCompletions.map(compl =>
                compl.id === completionId
                    ? { ...compl, chartData }
                    : compl
            )
        }));
    }
})); 