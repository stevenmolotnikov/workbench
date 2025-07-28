"use client";

import { ALargeSmall, Edit2, Grid, Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TokenArea } from "@/components/lens/TokenArea";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { TooltipButton } from "../ui/tooltip-button";
import { useExecuteSelected } from "@/lib/api/modelsApi";
import { toast } from "sonner";
import type { Prediction, Token } from "@/types/models";
import type { LensConfig } from "@/db/schema";
import type { LensConfigData } from "@/types/lens";

import { PredictionBadges } from "./PredictionBadges";

import { encodeText } from "@/actions/tokenize";
import { useDeleteChartConfig, useUpdateChartConfig } from "@/lib/api/configApi";
import { useParams } from "next/navigation";

export function CompletionCard({ initialConfig }: { initialConfig: LensConfig }) {
    const { workspaceId } = useParams<{ workspaceId: string }>();

    const [config, setConfig] = useState<LensConfigData>(initialConfig.data);
    const [tokenData, setTokenData] = useState<Token[]>([]);

    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    // Workspace display state
    const [showTokenArea, setShowTokenArea] = useState(false);
    const showPredictionDisplay = predictions.length > 0;

    const { mutateAsync: getExecuteSelected } = useExecuteSelected();
    const { mutateAsync: updateChartConfigMutation } = useUpdateChartConfig();
    const { mutateAsync: deleteChartConfigMutation, isPending: deletionPending } = useDeleteChartConfig();

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

        if (config.tokens.length === 0) {
            const temporaryConfig = {
                ...config,
                tokens: [tokens[tokens.length - 1]],
            }
            setSelectedIdx(tokens.length - 1);
            await runPredictions(temporaryConfig);
        }
    }

    const handleDeleteCompletion = async () => {
        await deleteChartConfigMutation({ configId: initialConfig.id });
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
            configId: initialConfig.id, 
            config: {
                data: temporaryConfig,
                workspaceId,
                type: "lens",
            }
        });
    }

    const handleClear = async () => {
        const cleanedConfig = {
            ...config,
            tokens: [],
        }
        await updateChartConfigMutation({
            configId: initialConfig.id, 
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
        <div className="group relative">
            {/* Delete button */}
            <Button
                variant="ghost"
                title="Delete completion"
                size="icon"
                onClick={handleDeleteCompletion}
                disabled={deletionPending}
                className="group-hover:opacity-100 opacity-0 h-6 w-6 transition-opacity duration-200 absolute -top-2 -right-2 rounded-full bg-background border shadow-sm"
            >
                <X
                    size={14}
                    className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                />
            </Button>

            <div
                className={cn(
                    "border bg-card px-4 pb-4 overflow-visible transition-all duration-200 ease-in-out w-full min-w-0 max-w-full",
                    showTokenArea ? "rounded-t-lg" : "rounded-lg",
                )}
            >
                {/* Header */}
                <div className="flex items-center my-4 justify-between">
                    <div className="flex px-0.5 flex-col">
                        <Input
                            value={config.name}
                            placeholder="Untitled"
                            onChange={(e) => setConfig({
                                ...config,
                                name: e.target.value,
                            })}
                            className="border-none shadow-none rounded h-fit px-0 py-0 font-bold"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-xs">{config.model}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <TooltipButton
                            variant="outline"
                            size="icon"
                            id="tokenize-button"
                            onClick={handleTokenize}
                            tooltip={"Tokenize"}
                        >
                            <ALargeSmall size={16} className="w-8 h-8" />
                        </TooltipButton>

                        {/* <TooltipButton
                            variant="outline"
                            size="icon"
                            id="tokenize-button"
                            onClick={() => handleCreateChart("heatmap")}
                            disabled={lensGridMutation.isPending}
                            tooltip={"Create heatmap"}
                        >
                            <Grid size={16} className="w-8 h-8" />
                        </TooltipButton> */}
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col h-full gap-4">
                    {!showTokenArea ? (
                        <Textarea
                            value={config.prompt}
                            onChange={handlePromptChange}
                            onKeyDown={handleKeyDown}
                            className="h-24"
                            placeholder="Enter your prompt here."
                        />
                    ) : (
                        <div
                            className="flex flex-col w-full px-3 py-2 animate-in slide-in-from-bottom-2 border rounded h-24 overflow-y-auto"
                        >
                            <TokenArea
                                config={config}
                                setConfig={setConfig}
                                tokenData={tokenData}
                                showPredictionDisplay={showPredictionDisplay}
                                setSelectedIdx={setSelectedIdx}
                            />
                        </div>
                    )}
                </div>
            </div>
            {(showTokenArea && predictions.length > 0) && (
                <div

                    className="border-x border-b p-4 flex justify-between bg-card/30 rounded-b-lg transition-all duration-200 ease-in-out animate-in slide-in-from-top-2"
                >
                    {showPredictionDisplay ? (
                        <PredictionBadges
                            config={config}
                            setConfig={setConfig}
                            predictions={predictions}
                            selectedIdx={selectedIdx ?? 0}
                        />
                    ) : (
                        <div>a</div>
                    )}

                    <div className="flex gap-2 ml-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => runPredictions(config)}
                            className="text-xs"
                        >
                            <Keyboard className="w-3 h-3" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                setShowTokenArea(true);
                            }}
                            className="text-xs"
                        >
                            <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleClear}
                            className="text-xs"
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}