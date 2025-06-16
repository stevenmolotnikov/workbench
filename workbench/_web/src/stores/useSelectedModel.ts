import { create } from 'zustand';

interface SelectedModelState {
    modelName: string;
    modelType: "base" | "chat";
    setModelName: (name: string) => void;
    setModelType: (type: "base" | "chat") => void;
    handleModelChange: (name: string, baseModels: string[]) => void;
    initializeDefaultModel: (baseModels: string[], chatModels: string[]) => void;
}

export const useSelectedModel = create<SelectedModelState>((set, get) => ({
    modelName: "",
    modelType: "base",

    setModelName: (name) => set({ modelName: name }),

    setModelType: (type) => set({ modelType: type }),

    handleModelChange: (name, baseModels) => {
        set({
            modelName: name,
            modelType: baseModels.includes(name) ? "base" : "chat"
        });
    },

    initializeDefaultModel: (baseModels, chatModels) => {
        const { modelName } = get();
        if (!modelName && (baseModels.length > 0 || chatModels.length > 0)) {
            const defaultModel = baseModels[0] || chatModels[0] || "";
            set({
                modelName: defaultModel,
                modelType: baseModels.includes(defaultModel) ? "base" : "chat"
            });
        }
    }
})); 