import { useState } from "react";
import type { Prediction } from "@/types/models";
import type { LensConfig } from "@/types/lens";
import { useExecuteSelected } from "@/lib/api/modelsApi";

function usePredictions(config: LensConfig) {
    // Predictions for the current config's prompt
    const [predictions, setPredictions] = useState<Prediction[] | null>(null);

    // Show the prediction display by default if, on load, there are saved tokens
    const [showPredictionDisplay, setShowPredictionDisplay] = useState(config.tokens.length > 0);

    const { mutateAsync: getExecuteSelected, isPending: loadingPredictions } = useExecuteSelected();

    // const updateConfigTokens = () => {
    //     const existingIndices = new Set(config.tokens.map((t) => t.idx));

    //     // Create new tokens only for indices that don't already exist
    //     const newTokens = config.tokens
    //         .filter((t) => !existingIndices.has(t.idx))
    //         .map((t) => ({
    //             idx: t.idx,
    //         }));

    //     const updatedConfig = {
    //         ...config,
    //         tokens: [...config.tokens, ...newTokens],
    //     }

    //     return updatedConfig;
    // }

    const runPredictions = async (lastTokenIndex?: number) => {
        // const updatedCompletion = updateConfigTokens();

        // Add the last token if provided   
        if (lastTokenIndex) {
            config.tokens = [...config.tokens, { idx: lastTokenIndex }];
        }

        try {
            const data = await getExecuteSelected(config);
            setShowPredictionDisplay(true);

            // await updateChartConfigMutation.mutateAsync({
            //     configId: chartConfig.id,
            //     config: {
            //         workspaceId: chartConfig.workspaceId,
            //         data: updatedCompletion,
            //         type: "lens",
            //     }
            // });
            setPredictions(data);
        } catch (error) {
            console.error("Error sending request:", error);
        }
    };

    return {
        predictions,
        loadingPredictions,
        showPredictionDisplay,
        runPredictions,
        setPredictions,
        setShowPredictionDisplay,
    };
}

export default usePredictions;