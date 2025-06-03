import { useQuery } from '@tanstack/react-query';
import config from '@/lib/config';
import type { Model } from '@/types/workspace';

const fetchModels = async (): Promise<Model[]> => {
    const response = await fetch(config.getApiUrl(config.endpoints.models));
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
};

export function useModels() {
    const { data: models = [], isLoading, error } = useQuery({
        queryKey: ['models'],
        queryFn: fetchModels,
    });

    const baseModels = models
        .filter(model => model.type === "base")
        .map(model => model.name);

    const chatModels = models
        .filter(model => model.type === "chat")
        .map(model => model.name);

    return {
        models,
        baseModels,
        chatModels,
        isLoading,
        error,
    };
} 