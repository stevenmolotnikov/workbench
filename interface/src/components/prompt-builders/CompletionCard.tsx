import { Trash, Keyboard, ALargeSmall, Loader2, X } from "lucide-react";
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
import { tokenizeText, isTokenizerCached } from "@/components/prompt-builders/tokenize";
import { Token } from "@/types/tokenizer";
import { useAnnotations } from "@/stores/useAnnotations";
import { useSelectedModel } from "@/hooks/useSelectedModel";

interface CompletionCardProps {
    compl: LensCompletion;
}

export function CompletionCard({ compl }: CompletionCardProps) {
    // Prediction state
    const [predictions, setPredictions] = useState<TokenPredictions | null>(null);
    const [showPredictions, setShowPredictions] = useState<boolean>(false);
    const [loadingPredictions, setLoadingPredictions] = useState<boolean>(false);
    const [selectedIdx, setSelectedIdx] = useState<number>(-1);
    const [predictionsEnabled, setPredictionsEnabled] = useState(false);

    // Tokenization state
    const [tokenData, setTokenData] = useState<Token[] | null>(null);
    const [isTokenizing, setIsTokenizing] = useState(false);
    const [isLoadingTokenizer, setIsLoadingTokenizer] = useState(false);
    const [lastTokenizedText, setLastTokenizedText] = useState<string | null>(null);

    // Hooks
    const { handleClick, handleTextInput } = useTutorialManager();
    const { modelName } = useSelectedModel();
    const { handleUpdateCompletion, handleDeleteCompletion, activeCompletions } =
        useLensCompletions();
    const { deleteAnnotation, annotations } = useAnnotations();

    // Helper functions
    const clearAnnotations = (completionId: string) => {
        annotations.forEach((annotation) => {
            if (annotation.type === "token" && annotation.data.id.startsWith(completionId)) {
                deleteAnnotation(annotation.data.id);
            }
        });
    };

    const handleDeleteCompletionWithCleanup = (id: string) => {
        clearAnnotations(id);
        handleDeleteCompletion(id);
    };

    const textHasChanged = compl.prompt !== lastTokenizedText;
    const shouldEnableTokenize =
        !isTokenizing &&
        !isLoadingTokenizer &&
        modelName &&
        compl.prompt &&
        (!tokenData || textHasChanged);

    const handleTokenize = async () => {
        if (!modelName) {
            console.error("No model selected");
            return;
        }

        if (!compl.prompt) {
            setTokenData(null);
            setLastTokenizedText(null);
            return;
        }

        if (showPredictions) {
            setShowPredictions(false);
        }

        try {
            const tokenizerCached = isTokenizerCached(modelName);

            if (!tokenizerCached) {
                setIsLoadingTokenizer(true);
            } else {
                setIsTokenizing(true);
            }

            const tokens = await tokenizeText(compl.prompt, modelName);
            setTokenData(tokens);
            setLastTokenizedText(compl.prompt);
        } catch (err) {
            console.error("Error tokenizing text:", err);
        } finally {
            setIsTokenizing(false);
            setIsLoadingTokenizer(false);
            clearAnnotations(compl.id);
            handleClick("#tokenize-button");
        }
    };

    const handleContentUpdate = (updates: Partial<LensCompletion>) => {
        handleUpdateCompletion(compl.id, updates);
    };

    const handleTokenSelection = (indices: number[]) => {
        const currentCompletion = activeCompletions.find((c) => c.id === compl.id);
        if (!currentCompletion) return;

        if (indices.length === 1 && indices[0] === -1) {
            // Clear all highlighted tokens and their completions
            handleUpdateCompletion(compl.id, {
                tokens: currentCompletion.tokens.map((t) => ({
                    ...t,
                    highlighted: false,
                    target_id: t.highlighted && t.target_id !== -1 ? -1 : t.target_id,
                    target_text: t.highlighted && t.target_id !== -1 ? "" : t.target_text,
                })),
            });
        } else {
            // Update token highlights
            const existingTokens = currentCompletion.tokens;
            const newHighlightedTokens = indices.map((idx) => ({
                target_id: -1,
                idx: idx,
                highlighted: true,
            }));

            const updatedTokens = existingTokens.map((token) => {
                const willBeHighlighted = indices.includes(token.idx);
                const wasHighlighted = token.highlighted;

                // Clear completion if token was highlighted but won't be anymore
                if (wasHighlighted && !willBeHighlighted && token.target_id !== -1) {
                    return {
                        ...token,
                        highlighted: false,
                        target_id: -1,
                        target_text: "",
                    };
                }

                return {
                    ...token,
                    highlighted: willBeHighlighted,
                };
            });

            // Add new tokens that don't exist yet
            const finalTokens = [...updatedTokens];
            newHighlightedTokens.forEach((newToken) => {
                const existingIndex = finalTokens.findIndex((t) => t.idx === newToken.idx);
                if (existingIndex === -1) {
                    finalTokens.push(newToken);
                }
            });

            handleUpdateCompletion(compl.id, {
                tokens: finalTokens,
            });
        }
    };

    const updateToken = (id: string, tokenIdx: number, targetId: number, targetText: string) => {
        const currentTokens = activeCompletions.find((c) => c.id === id)?.tokens || [];

        handleUpdateCompletion(id, {
            tokens: currentTokens.map((t) =>
                t.idx === tokenIdx ? { ...t, target_id: targetId, target_text: targetText } : t
            ),
        });
    };

    const clearToken = (id: string, tokenIdx: number) => {
        const currentTokens = activeCompletions.find((c) => c.id === id)?.tokens || [];

        handleUpdateCompletion(id, {
            tokens: currentTokens.map((t) =>
                t.idx === tokenIdx
                    ? { ...t, target_id: -1, target_text: "", highlighted: false }
                    : t
            ),
        });
    };

    const runPredictions = async () => {
        try {
            const response = await fetch(config.getApiUrl(config.endpoints.executeSelected), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    completion: compl,
                    model: compl.model,
                    tokens: compl.tokens,
                }),
            });
            const data: TokenPredictions = await response.json();
            setPredictions(data);
            setShowPredictions(true);
        } catch (error) {
            console.error("Error sending request:", error);
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

    // Auto-tokenize and show predictions on component mount if there are highlighted tokens or target completions
    useEffect(() => {
        const hasHighlightedTokens = compl.tokens.some(
            (token) => token.highlighted && token.idx >= 0
        );
        const hasTargetCompletions = compl.tokens.some((token) => token.target_id >= 0);

        if (
            (hasHighlightedTokens || hasTargetCompletions) &&
            compl.prompt &&
            modelName &&
            !tokenData
        ) {
            handleTokenize().then(() => {
                if (hasTargetCompletions) {
                    handlePredictions();
                }
            });
        }
    }, [compl.tokens, compl.prompt, modelName]);

    return (
        <div key={compl.id}>
            <div
                className={cn(
                    "border bg-card px-4 pb-4 pt-2 overflow-hidden transition-all duration-200 ease-in-out group relative",
                    showPredictions ? "rounded-t-lg" : "rounded-lg"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4">
                    {/* Delete button */}
                    <Button
                        variant="ghost"
                        title="Delete completion"
                        size="icon"
                        onClick={() => handleDeleteCompletionWithCleanup(compl.id)}
                        className="group-hover:opacity-100 opacity-0 h-6 w-6 transition-opacity duration-200 absolute top-2 right-2"
                    >
                        <X size={16} className="w-8 h-8" />
                    </Button>

                    <div className="flex flex-col">
                        <Input
                            value={compl.name}
                            placeholder="Untitled"
                            onChange={(e) => handleContentUpdate({ name: e.target.value })}
                            className="border-none shadow-none px-1 py-0 font-bold"
                        />
                        <span className="text-xs px-1">{compl.model}</span>
                    </div>

                    <div className="flex mt-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            id="tokenize-button"
                            onClick={handleTokenize}
                            disabled={!shouldEnableTokenize}
                            title={textHasChanged ? "Re-tokenize" : "Tokenize"}
                        >
                            <ALargeSmall size={16} className="w-8 h-8" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={handlePredictions}
                            disabled={!predictionsEnabled || loadingPredictions}
                            id="view-predictions"
                            title="View predictions"
                        >
                            {loadingPredictions ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                            ) : (
                                <Keyboard size={16} className="w-8 h-8" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col h-full gap-4">
                    <div className="flex-1 overflow-y-auto space-y-6">
                        <Textarea
                            value={compl.prompt}
                            onChange={handlePromptChange}
                            className="h-24 resize-none"
                            placeholder="Enter your prompt here."
                            id="completion-text"
                        />
                    </div>
                    <div
                        className="flex flex-col w-full px-3 py-2 rounded-md border-dashed border"
                        id="token-area"
                    >
                        <TokenArea
                            completionId={compl.id}
                            showPredictions={showPredictions}
                            onTokenSelection={handleTokenSelection}
                            setSelectedIdx={setSelectedIdx}
                            filledTokens={compl.tokens}
                            tokenData={tokenData}
                            setPredictionsEnabled={setPredictionsEnabled}
                            isTokenizing={isTokenizing}
                            isLoadingTokenizer={isLoadingTokenizer}
                        />
                    </div>
                </div>
            </div>
            {showPredictions && (
                <PredictionDisplay
                    predictions={predictions || {}}
                    compl={compl}
                    selectedIdx={selectedIdx}
                    updateToken={updateToken}
                    clearToken={clearToken}
                />
            )}
        </div>
    );
}
