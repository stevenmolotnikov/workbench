import { getModels } from "@/lib/api/modelsApi";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useWorkspace } from "@/stores/useWorkspace";

const useModels = () => {
    const { setSelectedModel } = useWorkspace();

    const { data: models = [], isLoading, isSuccess } = useQuery({
        queryKey: ['models'],
        queryFn: getModels,
        refetchInterval: 120000,
    });

    // On the first successful fetch, set the default model
    const initialized = useRef(false);
    useEffect(() => {
        if (isSuccess && !initialized.current) {
            const defaultModel = models[0];
            setSelectedModel(defaultModel);
            initialized.current = true;

            console.log("Default model set:", defaultModel);
        }
    }, [isSuccess, models, setSelectedModel]);

    return {
        models,
        isLoading,
        isSuccess,
    };
}

export default useModels;