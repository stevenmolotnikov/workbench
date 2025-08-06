"use client";

import { ALargeSmall, Edit2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TokenArea } from "./TokenArea";
import { useState } from "react";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { useExecuteSelected } from "@/lib/api/modelsApi";
import type { Prediction, Token } from "@/types/models";
import type { LensConfigData } from "@/types/lens";

import { PredictionBadges } from "./PredictionBadges";

import { encodeText } from "@/actions/tokenize";
import { useUpdateChartConfig } from "@/lib/api/configApi";
import { useParams } from "next/navigation";
import { useLensCharts } from "@/hooks/useLensCharts";
import { cn } from "@/lib/utils";

interface CompletionCardProps {
    config: LensConfigData;
    setConfig: (config: LensConfigData) => void;
    configId: string;
}

export function CompletionCard({ config, setConfig, configId }: CompletionCardProps) {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const [tokenData, setTokenData] = useState<Token[]>([]);

    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    // Workspace display state
    const [showTokenArea, setShowTokenArea] = useState(false);

    const { mutateAsync: getExecuteSelected } = useExecuteSelected();
    const { mutateAsync: updateChartConfigMutation } = useUpdateChartConfig();
    const { handleCreateLineChart, handleCreateHeatmap } = useLensCharts({ configId });

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
        setSelectedIdx(tokens.length - 1);

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

    const handleTokenClick = (idx: number) => {
        if (config.token.idx === idx) return;

        setConfig({
            ...config,
            token: { idx, id: 0, text: "", targetIds: [] },
        });
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
        setSelectedIdx(null);
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
                            setSelectedIdx={setSelectedIdx}
                        />
                    </div>
                )}
                <div className="flex gap-2 absolute bottom-2 right-2">
                    <TooltipButton
                        variant="outline"
                        size="sm"
                        id="tokenize-button"
                        onClick={handleTokenize}
                        tooltip={"Tokenize"}
                    >
                        Tokenize
                    </TooltipButton>
                    <Button
                        size="sm"
                        onClick={() => handleCreateHeatmap(config)}
                    >
                        Run
                    </Button>
                </div>

            </div>

            {(showTokenArea && predictions.length > 0) && (
                <div

                    className="border-x border-b p-2 flex justify-between bg-card/30 rounded-b-lg transition-all duration-200 ease-in-out animate-in slide-in-from-top-2"
                >
                    <PredictionBadges
                        config={config}
                        setConfig={setConfig}
                        predictions={predictions}
                        selectedIdx={selectedIdx ?? 0}
                    />
                    <div className="flex gap-2 ml-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setShowTokenArea(true);
                            }}
                            className="text-xs"
                        >
                            Reselect Token
                        </Button>
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