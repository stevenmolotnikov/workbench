import { Keyboard, ALargeSmall, Loader2, X, Pencil, KeyboardOff, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LensCompletion } from "@/types/lens";
import { Textarea } from "@/components/ui/textarea";
import { TokenArea } from "@/components/prompt-builders/TokenArea";
import { TokenPredictions } from "@/types/workspace";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import config from "@/lib/config";
import { useLensCompletions } from "@/stores/useLensCompletions";
import { PredictionDisplay } from "@/components/prompt-builders/PredictionDisplay";
import { Input } from "@/components/ui/input";
import { useTutorialManager } from "@/hooks/useTutorialManager";
import { tokenizeText } from "@/actions/tokenize";
import { Token } from "@/types/tokenizer";
import { useStatusUpdates } from "@/hooks/useStatusUpdates";
import { TooltipButton } from "../ui/tooltip-button";
import { useTokenSelection } from "@/hooks/useTokenSelection";
import { useCharts } from "@/stores/useCharts";

interface CompletionCardProps {
    index: number;
    compl: LensCompletion;
}

export function CompletionCard({ index, compl }: CompletionCardProps) {

    // Prediction state
    const [predictions, setPredictions] = useState<TokenPredictions | null>(null);
    const [showPredictions, setShowPredictions] = useState<boolean>(false);
    const [loadingPredictions, setLoadingPredictions] = useState<boolean>(false);
    const [selectedIdx, setSelectedIdx] = useState<number>(-1);

    // Tokenization state
    const [tokenData, setTokenData] = useState<Token[] | null>(null);
    const [lastTokenizedText, setLastTokenizedText] = useState<string | null>(null);
    const [tokenizerLoading, setTokenizerLoading] = useState<boolean>(false);

    // Hooks
    const { handleClick, handleTextInput } = useTutorialManager();
    const { handleUpdateCompletion, handleDeleteCompletion, tokenizeOnEnter } = useLensCompletions();

    // Helper functions
    const handleDeleteCompletionWithCleanup = (id: string) => {
        handleDeleteCompletion(id);
    };

    const textHasChanged = compl.prompt !== lastTokenizedText;
    const shouldEnableTokenize = compl.prompt && (!tokenData || textHasChanged);

    const removeToken = (idxs: number[]) => {
        handleUpdateCompletion(compl.id, {
            tokens: compl.tokens.filter(t => !idxs.includes(t.idx)),
        });
    };

    const tokenSelection = useTokenSelection({ compl, removeToken });

    const handleTokenize = async () => {
        if (!compl.prompt) {
            setTokenData(null);
            setLastTokenizedText(null);
            return;
        }

        if (showPredictions) {
            setShowPredictions(false);
        }

        // Check if this is the first time tokenizing (no existing token data)
        const isFirstTimeTokenizing = !tokenData;

        try {
            setTokenizerLoading(true);
            const tokens = await tokenizeText(compl.prompt, compl.model);
            setTokenData(tokens);
            setLastTokenizedText(compl.prompt);

            // Auto-add and run heatmap chart on first tokenization if setting is enabled
            if (isFirstTimeTokenizing) {
                const { graphOnTokenize } = useLensCompletions.getState();
                
                if (graphOnTokenize) {
                    const { gridPositions, setChartMode, setChartData, pushCompletionId } = useCharts.getState();
                    const chartIndex = gridPositions.length;
                    
                    // Add heatmap chart (index 1 in LogitLensModes)
                    // Index 0 = "Target Token" (LineGraph), Index 1 = "Prediction Grid" (Heatmap)
                    setChartMode(chartIndex, 1);

                    // Auto-run the heatmap chart
                    try {
                        const { startStatusUpdates, stopStatusUpdates } = useStatusUpdates.getState();
                        const jobId = compl.id;
                        
                        startStatusUpdates(jobId);

                        const response = await fetch("/api/lens-grid", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                completion: compl,
                                job_id: jobId,
                            }),
                        });

                        if (response.ok) {
                            const data = await response.json();
                            setChartData(chartIndex, { type: "heatmap", data });
                        }

                        stopStatusUpdates();
                    } catch (chartError) {
                        console.error("Error auto-running heatmap chart:", chartError);
                        const { stopStatusUpdates } = useStatusUpdates.getState();
                        stopStatusUpdates();
                    } finally {
                        pushCompletionId(chartIndex, compl.id);
                    }
                }
            }
        } catch (err) {
            console.error("Error tokenizing text:", err);
        } finally {
            handleClick("#tokenize-button");
            setTokenizerLoading(false);
        }
    };

    const handleContentUpdate = (updates: Partial<LensCompletion>) => {
        handleUpdateCompletion(compl.id, updates);
    };

    const highlightedTokens = tokenSelection.highlightedTokens;

    const updateTokens = () => {
        const existingIndices = new Set(compl.tokens.map(t => t.idx));

        // Create new tokens only for indices that don't already exist
        const newTokens = highlightedTokens
            .filter(idx => !existingIndices.has(idx))
            .map(idx => ({
                idx,
                target_id: -1,
                target_text: "",
            }));

        // Combine existing tokens with new ones
        const updatedTokens = [...compl.tokens, ...newTokens];

        handleUpdateCompletion(compl.id, {
            tokens: updatedTokens,
        });

        // Return the updated completion
        const { activeCompletions } = useLensCompletions.getState();
        const updatedCompl = activeCompletions.find((c: LensCompletion) => c.id === compl.id);

        return updatedCompl;
    };

    const runPredictions = async () => {
        const { startStatusUpdates, stopStatusUpdates } = useStatusUpdates.getState();

        const updatedCompl = updateTokens();

        if (!updatedCompl) {
            console.error("Completion not found");
            return;
        }

        const jobId = updatedCompl.id;
        startStatusUpdates(jobId);

        try {
            const response = await fetch(config.getApiUrl(config.endpoints.executeSelected), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    completion: updatedCompl,
                    model: updatedCompl.model,
                    tokens: updatedCompl.tokens,
                    job_id: jobId,
                }),
            });
            const data: TokenPredictions = await response.json();

            setPredictions(data);
            setShowPredictions(true);
        } catch (error) {
            console.error("Error sending request:", error);
        } finally {
            stopStatusUpdates();
        }
    };

    const handlePredictions = async () => {
        if (showPredictions) {
            setShowPredictions(false);
        } else {
            setLoadingPredictions(true);
            await runPredictions();
            setLoadingPredictions(false);
            handleClick("#view-predictions");
        }
    };

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        handleContentUpdate({ prompt: e.target.value });
        handleTextInput(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (tokenizeOnEnter && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (shouldEnableTokenize) {
                handleTokenize();
            }
        }
    };

    const handleAddChart = (index: number) => {
        const { gridPositions, setConfiguringPosition, setSelectionPhase, setCompletionIndex } = useCharts.getState();
        const nextPosition = gridPositions.length;
        setConfiguringPosition(nextPosition);
        setCompletionIndex(index);
        setSelectionPhase('type');
    };

    // Auto-tokenize and show predictions on component mount if there are target completions
    useEffect(() => {
        const hasTargetCompletions = compl.tokens.some((token) => token.target_id >= 0);

        if (hasTargetCompletions && compl.prompt && !tokenData) {
            handleTokenize().then(() => {
                handlePredictions();
            });
        }
    }, [compl.tokens, compl.prompt]);

    const emphasizedCompletions = useLensCompletions((state) => state.emphasizedCompletions);

    return (
        <div key={compl.id} className="group relative">
            {/* Delete button */}
            <Button
                variant="ghost"
                title="Delete completion"
                size="icon"
                onClick={() => handleDeleteCompletionWithCleanup(compl.id)}
                className="group-hover:opacity-100 opacity-0 h-6 w-6 transition-opacity duration-200 absolute -top-2 -right-2 rounded-full bg-background border shadow-sm"
            >
                <X
                    size={14}
                    className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                />
            </Button>

            <div
                className={cn(
                    "border bg-card px-4 pb-4 overflow-visible transition-all duration-200 ease-in-out",
                    showPredictions ? "rounded-t-lg" : "rounded-lg",
                    emphasizedCompletions.includes(index) && "border-primary"
                )}
            >
                {/* Header */}
                <div className="flex items-center my-4 justify-between">
                    <div className="flex px-0.5 flex-col">
                        <Input
                            value={compl.name}
                            placeholder="Untitled"
                            onChange={(e) => handleContentUpdate({ name: e.target.value })}
                            className="border-none shadow-none rounded h-fit px-0 py-0 font-bold"
                        />
                        <span className="text-xs w-full">{compl.model}</span>
                    </div>

                    <div className="flex gap-2">
                        <TooltipButton
                            variant="outline"
                            size="icon"
                            id="tokenize-button"
                            onClick={handleTokenize}
                            disabled={!shouldEnableTokenize}
                            tooltip={textHasChanged ? "Re-tokenize" : "Tokenize"}
                        >
                            <ALargeSmall size={16} className="w-8 h-8" />
                        </TooltipButton>
                        <TooltipButton
                            size="icon"
                            variant="outline"
                            onClick={handlePredictions}
                            disabled={loadingPredictions || highlightedTokens.length === 0}
                            id="view-predictions"
                            tooltip="View predictions"
                        >
                            {loadingPredictions ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                            ) : (
                                showPredictions ? (
                                    <KeyboardOff size={16} className="w-8 h-8" />
                                ) : (
                                    <Keyboard size={16} className="w-8 h-8" />
                                )
                            )}
                        </TooltipButton>
                        <TooltipButton
                            variant="outline"
                            size="icon"
                            id="add-chart-button"
                            onClick={() => handleAddChart(index)}
                            tooltip="Add Chart"
                        >
                            <LineChart size={16} className="w-8 h-8" />
                        </TooltipButton>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col h-full gap-4">
                    <Textarea
                        value={compl.prompt}
                        onChange={handlePromptChange}
                        onKeyDown={handleKeyDown}
                        className="h-24"
                        placeholder="Enter your prompt here."
                        id="completion-text"
                    />
                    {(tokenData || tokenizerLoading) && (
                        <div
                            className={cn(
                                "flex flex-col w-full px-3 py-2 animate-in slide-in-from-bottom-2 border rounded",
                                loadingPredictions && "pointer-events-none"
                            )}
                            id="token-area"
                        >
                            <TokenArea
                                compl={compl}
                                showPredictions={showPredictions}
                                setSelectedIdx={setSelectedIdx}
                                tokenData={tokenData}
                                tokenSelection={tokenSelection}
                            />
                        </div>
                    )}
                </div>
            </div>
            {showPredictions && (
                <PredictionDisplay
                    predictions={predictions || {}}
                    compl={compl}
                    selectedIdx={selectedIdx}
                />
            )}
        </div>
    );
}
