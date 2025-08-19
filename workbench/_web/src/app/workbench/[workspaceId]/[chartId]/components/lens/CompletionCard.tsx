"use client";

import { ChartLine, CornerDownLeft, Grid3x3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TokenArea } from "./TokenArea";
import { useState, useEffect, useRef } from "react";
import { useExecuteSelected } from "@/lib/api/modelsApi";
import type { Prediction } from "@/types/models";
import type { LensConfigData } from "@/types/lens";

import { PredictionBadges } from "./PredictionBadges";

import { encodeText } from "@/actions/tok";
import { useUpdateChartConfig } from "@/lib/api/configApi";
import { useParams } from "next/navigation";
import { useLensCharts } from "@/hooks/useLensCharts";
import { cn } from "@/lib/utils";
import { useLensWorkspace } from "@/stores/useLensWorkspace";

import { LensConfig } from "@/db/schema";
import { useWorkspace } from "@/stores/useWorkspace";
import GenerateButton from "./GenerateButton";
import { DecoderSelector } from "./DecoderSelector";
import { useDebouncedCallback } from "use-debounce";

interface CompletionCardProps {
    initialConfig: LensConfig;
}

export function CompletionCard({ initialConfig }: CompletionCardProps) {
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const { tokenData, setTokenData } = useLensWorkspace();

    const { selectedModel, currentChartType, setCurrentChartType } = useWorkspace();
    const [editingText, setEditingText] = useState(initialConfig.data.prediction === undefined);

    const { mutateAsync: executeSelected, isPending: isExecuting } = useExecuteSelected();

    const { mutateAsync: updateChartConfigMutation } = useUpdateChartConfig();

    const [config, setConfig] = useState<LensConfigData>(initialConfig.data);
    const configId = initialConfig.id;

    const { handleCreateLineChart, handleCreateHeatmap } = useLensCharts({ configId });

    // Debounced function to run line chart 2 seconds after target token IDs change
    const debouncedRunLineChart = useDebouncedCallback(
        async (currentConfig: LensConfigData) => {
            if (currentConfig.token.targetIds.length > 0) {
                await handleCreateLineChart(currentConfig);
            }
        },
        3000
    );

    // NOTE(cadentj): check if this only runs once-ish
    useEffect(() => {
        const fetchTokens = async () => {
            if (config.prediction) {
                const tokens = await encodeText(config.prompt, selectedModel.name);
                setTokenData(tokens);
            }
        }
        fetchTokens();
    }, []);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setConfig({
            ...config,
            prompt: e.target.value,
        });
    };

    const handleTokenize = async () => {
        const tokens = await encodeText(config.prompt, selectedModel.name);
        setTokenData(tokens);

        // Set the token to the last token in the list
        const temporaryConfig: LensConfigData = {
            ...config,
            model: selectedModel.name,
            token: { idx: tokens[tokens.length - 1].idx, id: 0, text: "", targetIds: [] }
        }

        // Run predictions
        await runPredictions(temporaryConfig);
        await handleCreateHeatmap(temporaryConfig);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !isExecuting) {
            e.preventDefault();
            handleTokenize();
        }
    };

    const runPredictions = async (temporaryConfig: LensConfigData) => {
        const data = await executeSelected(temporaryConfig);
        temporaryConfig.prediction = data[0];
        setConfig(temporaryConfig);
        await updateChartConfigMutation({
            configId,
            config: {
                data: temporaryConfig,
                workspaceId,
                type: "lens",
            }
        });
        setEditingText(false);

        return data[0].ids.slice(0, 3);
    }

    const handleTokenClick = async (event: React.MouseEvent<HTMLDivElement>, idx: number) => {
        // Prevent the editing state from activating
        event.preventDefault();
        event.stopPropagation();

        setCurrentChartType("line");

        // Skip if the token is already selected
        if (config.token.idx === idx) return;

        // Set the token to the last token in the list
        const temporaryConfig: LensConfigData = {
            ...config,
            token: { idx, id: 0, text: "", targetIds: [] }
        }

        setConfig(temporaryConfig);

        // Run predictions
        const targetIds = await runPredictions(temporaryConfig);
        await handleCreateLineChart({ ...temporaryConfig, token: { ...temporaryConfig.token, targetIds } });
    };

    const handleClear = async () => {
        setEditingText(true);

        // Focus the textarea and place cursor at the end after state updates
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const length = textareaRef.current.value.length;
                textareaRef.current.setSelectionRange(length, length);
            }
        }, 0);
    }

    return (
        <div className="flex flex-col w-full gap-2">
            {/* Content */}
            <div className="flex size-full relative">
                {editingText ? (
                    <Textarea
                        ref={textareaRef}
                        value={config.prompt}
                        onChange={handlePromptChange}
                        onKeyDown={handleKeyDown}
                        className="w-full h-24"
                        placeholder="Enter your prompt here."
                        onBlur={() => setEditingText(false)}
                    />
                ) : (
                    <div
                        className={cn(
                            "flex w-full h-24 px-3 py-2 border overflow-y-auto  rounded cursor-pointer",
                        )}
                        onClick={handleClear}
                    >
                        <TokenArea
                            config={config}
                            handleTokenClick={handleTokenClick}
                            tokenData={tokenData}
                        />
                    </div>
                )}
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                    {!editingText && <GenerateButton
                        prompt={config.prompt}
                        config={config}
                        setConfig={setConfig}
                    />}
                    {editingText && <Button
                        size="icon"
                        variant="outline"
                        id="tokenize-button"
                        onClick={() => {
                            handleTokenize();
                        }}
                        disabled={isExecuting}
                    >
                        {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CornerDownLeft className="w-4 h-4" />}
                    </Button>}
                </div>

            </div>

            {config.prediction && (
                <div
                    className={cn(
                        "transition-all",
                        (editingText || isExecuting) ? "opacity-60 blur-[0.25px]" : "opacity-100",
                        isExecuting ? "!cursor-progress" : "cursor-pointer"
                    )}
                    onMouseDown={() => {
                        if (editingText && !isExecuting) setEditingText(false);
                    }}
                >
                    {/* Prevent pointer events when overlay is active */}
                    <div className={cn(
                        "flex flex-col size-full border p-2 items-center gap-3 bg-muted rounded",
                        (editingText || isExecuting) ? "pointer-events-none" : "pointer-events-auto"
                    )}>
                        <div className="flex w-full justify-between items-center">
                            <div className="flex items-center p-1 max-h-8 bg-background rounded-lg">
                                <button
                                    onClick={() => handleCreateHeatmap(config)}
                                    className={cn(
                                        "flex items-center gap-2 px-2 py-0.5 rounded-lg text-xs",
                                        currentChartType === "heatmap" ? "bg-accent border" : "bg-background"
                                    )}
                                >
                                    <Grid3x3 className="w-4 h-4" />
                                    Heatmap
                                </button>
                                <button
                                    onClick={() => handleCreateLineChart(config)}
                                    disabled={config.token.targetIds.length === 0}
                                    className={cn(
                                        "flex items-center gap-2 px-2 py-0.5 rounded-lg text-xs",
                                        currentChartType === "line" ? "bg-accent border" : "bg-background"
                                    )}
                                >
                                    <ChartLine className="w-4 h-4" />
                                    Line
                                </button>
                            </div>



                            <DecoderSelector />
                        </div>

                        <PredictionBadges
                            config={config}
                            setConfig={setConfig}
                            runLineChart={debouncedRunLineChart}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}