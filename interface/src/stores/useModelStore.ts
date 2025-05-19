import { create } from 'zustand';
import type { ModelLoadStatus } from '@/types/workbench';
import type { Model } from '@/types/workspace';
import config from '@/lib/config';

interface ModelState {
    modelLoadStatus: ModelLoadStatus;
    setModelLoadStatus: (status: ModelLoadStatus) => void;
    baseModels: string[];
    chatModels: string[];
    fetchModels: () => Promise<void>;
    modelName: string;
    modelType: "base" | "chat";
    setModelName: (name: string) => void;
    handleModelChange: (name: string) => void;
}

export const useModelStore = create<ModelState>((set, get) => ({
    modelLoadStatus: 'loading',
    baseModels: [],
    chatModels: [],
    modelName: "",
    modelType: "base",
    setModelLoadStatus: (status) => set({ modelLoadStatus: status }),
    setModelName: (name) => set({ modelName: name }),
    handleModelChange: (name: string) => {
        set((state) => ({
            modelName: name,
            modelType: state.baseModels.includes(name) ? "base" : "chat"
        }));
    },
    fetchModels: async () => {
        try {
            const response = await fetch(config.getApiUrl(config.endpoints.models));

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: Model[] = await response.json();

            // Extract base and chat models
            const baseModels = data
                .filter(model => model.type === "base")
                .map(model => model.name);

            const chatModels = data
                .filter(model => model.type === "chat")
                .map(model => model.name);

            // Set default model if none is selected
            const currentModelName = get().modelName;
            if (!currentModelName || (!baseModels.includes(currentModelName) && !chatModels.includes(currentModelName))) {
                const defaultModel = baseModels[0] || chatModels[0] || "";
                set({ 
                    modelName: defaultModel,
                    modelType: baseModels.includes(defaultModel) ? "base" : "chat"
                });
            }

            set({ 
                baseModels,
                chatModels,
                modelLoadStatus: 'success'
            });
        } catch (error) {
            console.error("Error fetching models:", error);
            set({ modelLoadStatus: 'error' });
        }
    }
}));
