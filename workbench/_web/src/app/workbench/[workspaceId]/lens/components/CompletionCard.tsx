"use client";

import { ChartLine, Grid3x3, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TokenArea } from "./TokenArea";
import { useState, useEffect, useRef } from "react";
import { useExecuteSelected } from "@/lib/api/modelsApi";
import type { Prediction } from "@/types/models";
import type { LensConfigData } from "@/types/lens";

import { PredictionBadges } from "./PredictionBadges";

import { encodeText } from "@/actions/tokenize";
import { useUpdateChartConfig } from "@/lib/api/configApi";
import { useParams } from "next/navigation";
import { useLensCharts } from "@/hooks/useLensCharts";
import { cn } from "@/lib/utils";
import { useLensWorkspace } from "@/stores/useLensWorkspace";

interface CompletionCardProps {
    config: LensConfigData;
    setConfig: (config: LensConfigData) => void;
    configId: string;
}

export function CompletionCard({ config, setConfig, configId }: CompletionCardProps) {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { tokenData, setTokenData } = useLensWorkspace();

    const [predictions, setPredictions] = useState<Prediction[]>([]);

    // Workspace display state
    const [showTokenArea, setShowTokenArea] = useState(false);
    const [isSelectingToken, setIsSelectingToken] = useState(false);

    const { mutateAsync: getExecuteSelected, isPending: isExecuting } = useExecuteSelected();
    const { mutateAsync: updateChartConfigMutation } = useUpdateChartConfig();
    const { handleCreateLineChart, handleCreateHeatmap } = useLensCharts({ config, configId });


    const init = useRef(false);
    useEffect(() => {
        if (init.current) return;
        if (config.token.targetIds.length > 0) {
            handleInit();
        }
    }, []);

    // If targetIds already exist, run with the initial config
    const handleInit = async () => {
        const tokens = await encodeText(config.prompt, config.model);
        setTokenData(tokens);
        setShowTokenArea(true);
        await runPredictions(config);
    }

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setConfig({
            ...config,
            prompt: e.target.value,
        });
    };

    const handleTokenize = async () => {
        const tokens = await encodeText(config.prompt, config.model);
        setTokenData(tokens);
        setShowTokenArea(true);

        // Set the token to the last token in the list
        const temporaryConfig: LensConfigData = {
            ...config,
            token: { idx: tokens[tokens.length - 1].idx, id: 0, text: "", targetIds: [] }
        }

        // Run predictions
        await runPredictions(temporaryConfig);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleTokenize();
        }
    };

    const runPredictions = async (temporaryConfig: LensConfigData) => {
        const data = await getExecuteSelected(temporaryConfig);
        setPredictions(data);
        setConfig(temporaryConfig);
        await updateChartConfigMutation({
            configId,
            config: {
                data: temporaryConfig,
                workspaceId,
                type: "lens",
            }
        });
    }

    const handleTokenClick = async (idx: number) => {
        // Skip if the token is already selected
        if (config.token.idx === idx || !isSelectingToken) return;

        setConfig({
            ...config,
            token: { idx, id: 0, text: "", targetIds: [] },
        });

        setIsSelectingToken(false);

        // Set the token to the last token in the list
        const temporaryConfig: LensConfigData = {
            ...config,
            token: { idx, id: 0, text: "", targetIds: [] }
        }

        // Run predictions
        await runPredictions(temporaryConfig);
    };

    const handleClear = async () => {
        const cleanedConfig: LensConfigData = {
            ...config,
            token: { idx: 0, id: 0, text: "", targetIds: [] },
        }
        await updateChartConfigMutation({
            configId,
            config: {
                data: cleanedConfig,
                workspaceId,
                type: "lens",
            }
        });
        setConfig(cleanedConfig);
        setTokenData([]);
        setShowTokenArea(false);
        setPredictions([]);
    }

    return (
        <div className="flex flex-col w-full">
            {/* Content */}
            <div className="flex size-full relative">
                {!showTokenArea ? (
                    <Textarea
                        value={config.prompt}
                        onChange={handlePromptChange}
                        onKeyDown={handleKeyDown}
                        className="w-full h-24"
                        placeholder="Enter your prompt here."
                    />
                ) : (
                    <div
                        className={cn(
                            "flex w-full h-24 px-3 py-2 border overflow-y-auto",
                            showTokenArea ? "rounded-t-lg" : "rounded-lg"
                        )}
                    >
                        <TokenArea
                            config={config}
                            handleTokenClick={handleTokenClick}
                            tokenData={tokenData}
                            isSelectingToken={isSelectingToken}
                        />
                    </div>
                )}
                <div className="flex gap-2 absolute bottom-2 right-2">
                    <Button
                        variant="outline"
                        size="sm"
                        id="tokenize-button"
                        onClick={handleTokenize}
                    >
                        Tokenize
                    </Button>
                    <Button
                        size="icon"
                        onClick={handleCreateHeatmap}
                    >
                        <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                        size="icon"
                        onClick={handleCreateLineChart}
                        disabled={config.token.targetIds.length === 0}
                    >
                        <ChartLine className="w-4 h-4" />
                    </Button>
                </div>

            </div>

            {(showTokenArea && predictions.length > 0 && !isExecuting) && (
                <div

                    className="border-x border-b p-2 flex justify-between bg-card/30 rounded-b-lg transition-all duration-200 ease-in-out animate-in slide-in-from-top-2"
                >
                    <PredictionBadges
                        config={config}
                        setConfig={setConfig}
                        predictions={predictions}
                    />
                    <div className="flex gap-2 ml-4">
                        {!isSelectingToken ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setIsSelectingToken(true);
                                }}
                                className="text-xs"
                            >
                                Reselect
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setIsSelectingToken(false);
                                }}
                                className="text-xs"
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleClear}
                            className="text-xs"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}