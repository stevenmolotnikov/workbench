import { Keyboard, ALargeSmall, Loader2, X, KeyboardOff, LineChart, Plus, ChevronDown, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LensCompletion, Prompt } from "@/types/lens";
import { Textarea } from "@/components/ui/textarea";
import { TokenArea } from "@/components/prompt-builders/TokenArea";
import type { TokenPredictions, ChartMode } from "@/types/workspace";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import config from "@/lib/config";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { PredictionDisplay } from "@/components/prompt-builders/PredictionDisplay";
import { Input } from "@/components/ui/input";
import { useTutorialManager } from "@/hooks/useTutorialManager";
import { tokenizeText } from "@/actions/tokenize";
import type { Token } from "@/types/tokenizer";
import { useStatusUpdates } from "@/hooks/useStatusUpdates";
import { TooltipButton } from "../ui/tooltip-button";
import { useTokenSelection } from "@/hooks/useTokenSelection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogitLensModes } from "@/app/workbench/[workspace_id]/lens/page";

interface CompletionSectionProps {
    index: number;
    compl: LensCompletion;
    isLast: boolean;
}

interface TokenizedPromptData {
    tokens: Token[] | null;
    lastTokenizedText: string | null;
    isLoading: boolean;
}

export function CompletionSection({ index, compl, isLast }: CompletionSectionProps) {
    // Multi-prompt tokenization state
    const [tokenizedData, setTokenizedData] = useState<Record<string, TokenizedPromptData>>({});
    
    // Prediction state
    const [predictions, setPredictions] = useState<Record<string, TokenPredictions>>({});
    const [showPredictions, setShowPredictions] = useState<boolean>(false);
    const [loadingPredictions, setLoadingPredictions] = useState<boolean>(false);
    const [selectedIdx, setSelectedIdx] = useState<number>(-1);
    
    // Chart state
    const [isChartLoading, setIsChartLoading] = useState<boolean>(false);

    // Hooks
    const { handleClick, handleTextInput } = useTutorialManager();
    const { 
        handleUpdateCompletion, 
        handleDeleteCompletion, 
        tokenizeOnEnter,
        addPrompt,
        removePrompt,
        updatePrompt,
        selectPrompt,
        setCompletionChartMode,
        setCompletionChartData,
        graphOnTokenize
    } = useLensWorkspace();

    const selectedPrompt = compl.prompts?.find(p => p.id === compl.selectedPromptId) || compl.prompts?.[0];
    const selectedChartMode = compl.chartMode !== undefined ? LogitLensModes[compl.chartMode] : null;

    // Handle case where there are no prompts (legacy completion)
    if (!selectedPrompt) {
        return null;
    }

    // Get tokenized data for current prompt
    const currentTokenData = tokenizedData[selectedPrompt.id];
    const tokenData = currentTokenData?.tokens || null;
    const lastTokenizedText = currentTokenData?.lastTokenizedText || null;
    const tokenizerLoading = currentTokenData?.isLoading || false;

    // Helper functions
    const handleDeleteCompletionWithCleanup = (id: string) => {
        handleDeleteCompletion(id);
    };

    const textHasChanged = selectedPrompt.text !== lastTokenizedText;
    const shouldEnableTokenize = selectedPrompt.text && (!tokenData || textHasChanged);

    const removeToken = (idxs: number[]) => {
        const updatedTokens = (selectedPrompt.tokens || []).filter((t) => !idxs.includes(t.idx));
        updatePrompt(compl.id, selectedPrompt.id, { tokens: updatedTokens });
    };

    // Create a legacy completion object for compatibility
    const legacyCompletion = useMemo(() => ({
        ...compl,
        prompt: selectedPrompt.text,
        tokens: selectedPrompt.tokens || []
    }), [compl, selectedPrompt]);

    const tokenSelection = useTokenSelection({ compl: legacyCompletion, removeToken });

    const handleTokenize = async (promptId?: string) => {
        const targetPromptId = promptId || selectedPrompt.id;
        const targetPrompt = compl.prompts.find(p => p.id === targetPromptId);
        if (!targetPrompt || !targetPrompt.text) return;

        setTokenizedData(prev => ({
            ...prev,
            [targetPromptId]: { ...prev[targetPromptId], isLoading: true }
        }));

        try {
            const tokens = await tokenizeText(targetPrompt.text, compl.model);
            
            setTokenizedData(prev => ({
                ...prev,
                [targetPromptId]: {
                    tokens,
                    lastTokenizedText: targetPrompt.text,
                    isLoading: false
                }
            }));

            // Auto-run heatmap on first tokenization if enabled
            const isFirstTime = !currentTokenData?.tokens;
            if (isFirstTime && graphOnTokenize && compl.chartMode === undefined) {
                setCompletionChartMode(compl.id, 1); // Set to heatmap
                // Chart will auto-run via effect in chart component
            }
        } catch (err) {
            console.error("Error tokenizing text:", err);
            setTokenizedData(prev => ({
                ...prev,
                [targetPromptId]: { ...prev[targetPromptId], isLoading: false }
            }));
        } finally {
            handleClick("#tokenize-button");
        }
    };

    const handleContentUpdate = (updates: Partial<LensCompletion>) => {
        handleUpdateCompletion(compl.id, updates);
    };

    const handlePromptChange = (promptId: string, text: string) => {
        updatePrompt(compl.id, promptId, { text });
        handleTextInput(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, promptId: string) => {
        if (tokenizeOnEnter && e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const prompt = compl.prompts.find(p => p.id === promptId);
            if (prompt && prompt.text && shouldEnableTokenize) {
                handleTokenize(promptId);
            }
        }
    };

    const handleAddPrompt = () => {
        if (compl.prompts.length < 5) { // Limit to 5 prompts
            addPrompt(compl.id);
        }
    };

    const handleRemovePrompt = (promptId: string) => {
        if (compl.prompts.length > 1) {
            removePrompt(compl.id, promptId);
        }
    };

    const handleChartModeChange = (modeIndex: number) => {
        setCompletionChartMode(compl.id, modeIndex);
    };

    const highlightedTokens = tokenSelection.highlightedTokens;

    const updateTokens = () => {
        const existingIndices = new Set((selectedPrompt.tokens || []).map((t) => t.idx));

        // Create new tokens only for indices that don't already exist
        const newTokens = highlightedTokens
            .filter((idx) => !existingIndices.has(idx))
            .map((idx) => ({
                idx,
                target_id: -1,
                target_text: "",
            }));

        // Combine existing tokens with new ones
        const updatedTokens = [...(selectedPrompt.tokens || []), ...newTokens];

        updatePrompt(compl.id, selectedPrompt.id, { tokens: updatedTokens });

        // Return the updated prompt
        return compl.prompts.find(p => p.id === selectedPrompt.id);
    };

    const runPredictions = async () => {
        const { startStatusUpdates, stopStatusUpdates } = useStatusUpdates.getState();

        const updatedPrompt = updateTokens();
        if (!updatedPrompt) {
            console.error("Prompt not found");
            return;
        }

        const jobId = `${compl.id}-${selectedPrompt.id}`;
        startStatusUpdates(jobId);

        try {
            const response = await fetch(config.getApiUrl(config.endpoints.executeSelected), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    completion: {
                        ...compl,
                        prompt: updatedPrompt.text,
                        tokens: updatedPrompt.tokens || []
                    },
                    model: compl.model,
                    tokens: updatedPrompt.tokens || [],
                    job_id: jobId,
                }),
            });
            const data: TokenPredictions = await response.json();

            setPredictions(prev => ({ ...prev, [selectedPrompt.id]: data }));
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

    const handleRunChart = async () => {
        if (compl.chartMode === undefined) return;
        
        setIsChartLoading(true);
        const { startStatusUpdates, stopStatusUpdates } = useStatusUpdates.getState();
        const jobId = `chart-${compl.id}-${Date.now()}`;
        
        startStatusUpdates(jobId);

        try {
            const chartMode = LogitLensModes[compl.chartMode];
            
            if (chartMode.name === "Target Token") {
                // Line graph - uses all prompts with target tokens
                const promptsWithTargets = compl.prompts.filter(p => 
                    p.tokens && p.tokens.some(t => t.target_id >= 0)
                );

                const completions = promptsWithTargets.map(prompt => ({
                    ...compl,
                    prompt: prompt.text,
                    tokens: prompt.tokens || [],
                    name: prompt.name || `Prompt ${compl.prompts.indexOf(prompt) + 1}`
                }));

                const response = await fetch("/api/lens-line", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ completions, job_id: jobId }),
                });

                if (!response.ok) throw new Error(response.statusText);
                const data = await response.json();
                setCompletionChartData(compl.id, { type: "lineGraph", data });
                
            } else if (chartMode.name === "Prediction Grid") {
                // Heatmap - uses selected prompt only
                const response = await fetch("/api/lens-grid", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        completion: {
                            ...compl,
                            prompt: selectedPrompt.text,
                            tokens: selectedPrompt.tokens || []
                        },
                        job_id: jobId,
                    }),
                });

                if (!response.ok) throw new Error(response.statusText);
                const data = await response.json();
                setCompletionChartData(compl.id, { type: "heatmap", data });
            }
        } catch (error) {
            console.error("Error running chart:", error);
            setCompletionChartData(compl.id, undefined);
        } finally {
            setIsChartLoading(false);
            stopStatusUpdates();
        }
    };

    // Auto-run chart when it's first set or when prompts change
    useEffect(() => {
        if (compl.chartMode !== undefined && !compl.chartData && !isChartLoading) {
            handleRunChart();
        }
    }, [compl.chartMode, compl.prompts]);

    return (
        <div key={compl.id} className="relative">
            {/* Header */}
            <div className="py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Input
                            value={compl.name}
                            placeholder="Untitled"
                            onChange={(e) => handleContentUpdate({ name: e.target.value })}
                            className="border-none shadow-none rounded h-fit px-0 py-0 font-semibold text-base w-48 bg-transparent hover:bg-muted focus:bg-muted transition-colors"
                        />
                        <span className="text-xs text-muted-foreground">{compl.model}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    {selectedChartMode ? (
                                        <>
                                            <selectedChartMode.icon className="w-4 h-4 mr-2" />
                                            {selectedChartMode.name}
                                        </>
                                    ) : (
                                        <>
                                            <LineChart className="w-4 h-4 mr-2" />
                                            Select Chart
                                        </>
                                    )}
                                    <ChevronDown className="w-4 h-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {LogitLensModes.map((mode, idx) => (
                                    <DropdownMenuItem
                                        key={idx}
                                        onClick={() => handleChartModeChange(idx)}
                                    >
                                        <mode.icon className="w-4 h-4 mr-2" />
                                        {mode.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        
                        {compl.chartMode !== undefined && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRunChart}
                                disabled={isChartLoading}
                            >
                                {isChartLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Run Chart"
                                )}
                            </Button>
                        )}
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => handleDeleteCompletionWithCleanup(compl.id)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Prompts section */}
            <div className="space-y-3">
                {compl.prompts.map((prompt, promptIndex) => (
                    <div key={prompt.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Input
                                value={prompt.name || `Prompt ${promptIndex + 1}`}
                                onChange={(e) => updatePrompt(compl.id, prompt.id, { name: e.target.value })}
                                className="text-sm font-medium w-32 h-8"
                            />
                            <div className="flex gap-1">
                                <TooltipButton
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleTokenize(prompt.id)}
                                    disabled={!prompt.text || tokenizedData[prompt.id]?.isLoading}
                                    tooltip="Tokenize"
                                    className="h-8 w-8"
                                >
                                    <ALargeSmall size={14} />
                                </TooltipButton>
                                {compl.prompts.length > 1 && (
                                    <TooltipButton
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemovePrompt(prompt.id)}
                                        tooltip="Remove prompt"
                                        className="h-8 w-8"
                                    >
                                        <Trash2 size={14} />
                                    </TooltipButton>
                                )}
                            </div>
                        </div>
                        <Textarea
                            value={prompt.text}
                            onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, prompt.id)}
                            className="h-20 resize-none"
                            placeholder="Enter your prompt here."
                        />
                    </div>
                ))}
                
                {compl.prompts.length < 5 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleAddPrompt}
                        className="w-full h-8"
                    >
                        <Plus size={14} className="mr-2" />
                        Add Prompt
                    </Button>
                )}
            </div>

            {/* Bottom tabs section */}
            {compl.prompts.length > 0 && tokenizedData[selectedPrompt.id]?.tokens && (
                <div className="mt-4">
                    <Tabs
                        value={compl.selectedPromptId || compl.prompts[0].id}
                        onValueChange={(value) => selectPrompt(compl.id, value)}
                        className="w-full"
                    >
                        <TabsList className="w-full justify-start h-8">
                            {compl.prompts.map((prompt, idx) => (
                                <TabsTrigger
                                    key={prompt.id}
                                    value={prompt.id}
                                    className="text-xs h-full"
                                >
                                    {prompt.name || `Prompt ${idx + 1}`}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        
                        {compl.prompts.map((prompt) => (
                            <TabsContent key={prompt.id} value={prompt.id} className="mt-3 space-y-3">
                                {tokenizedData[prompt.id]?.tokens && (
                                    <>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Tokens</span>
                                                <TooltipButton
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handlePredictions}
                                                    disabled={loadingPredictions || highlightedTokens.length === 0}
                                                    tooltip="View predictions"
                                                    className="h-7"
                                                >
                                                    {loadingPredictions ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : showPredictions ? (
                                                        <KeyboardOff size={14} />
                                                    ) : (
                                                        <Keyboard size={14} />
                                                    )}
                                                </TooltipButton>
                                            </div>
                                            <div className="border rounded-md p-2 bg-muted/30">
                                                <TokenArea
                                                    compl={legacyCompletion}
                                                    showPredictions={showPredictions}
                                                    setSelectedIdx={setSelectedIdx}
                                                    tokenData={tokenData}
                                                    tokenSelection={tokenSelection}
                                                />
                                            </div>
                                        </div>
                                        
                                        {showPredictions && predictions[prompt.id] && (
                                            <div className="border rounded-md p-3 bg-muted/50">
                                                <PredictionDisplay
                                                    predictions={predictions[prompt.id]}
                                                    compl={legacyCompletion}
                                                    selectedIdx={selectedIdx}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            )}

            {/* Divider */}
            {!isLast && (
                <div className="mt-6 mb-6 border-b" />
            )}
        </div>
    );
}