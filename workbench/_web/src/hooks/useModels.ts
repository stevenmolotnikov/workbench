import { getModels } from "@/lib/api/modelsApi";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useWorkspace } from "@/stores/useWorkspace";

const useModels = () => {
    const { setSelectedModel } = useWorkspace();

    const { data: models = [], isLoading, isSuccess } = useQuery({
        queryKey: ['models'],
        queryFn: getModels,
        refetchInterval: 120000,
    });

    useEffect(() => {
        if (isSuccess) {
            const defaultModel = models[0];
            setSelectedModel(defaultModel);
        }
    }, [isSuccess, models, setSelectedModel]);

    return {
        models,
        isLoading,
        isSuccess,
    };
}

export default useModels;