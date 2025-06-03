import { useState, useEffect } from 'react';
import { useModels } from './useModels';

export function useSelectedModel() {
    const { baseModels, chatModels, isLoading } = useModels();
    const [modelName, setModelName] = useState<string>("");
    const [modelType, setModelType] = useState<"base" | "chat">("base");

    // Set default model when models are loaded
    useEffect(() => {
        if (!isLoading && !modelName && (baseModels.length > 0 || chatModels.length > 0)) {
            const defaultModel = baseModels[0] || chatModels[0] || "";
            setModelName(defaultModel);
            setModelType(baseModels.includes(defaultModel) ? "base" : "chat");
        }
    }, [baseModels, chatModels, isLoading, modelName]);

    const handleModelChange = (name: string) => {
        setModelName(name);
        setModelType(baseModels.includes(name) ? "base" : "chat");
    };

    return {
        modelName,
        modelType,
        handleModelChange,
        setModelName,
    };
} 