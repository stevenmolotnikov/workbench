import { Trash, Keyboard, ALargeSmall, Loader2 } from "lucide-react";
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
    const [predictions, setPredictions] = useState<TokenPredictions | null>(null);
    const [showPredictions, setShowPredictions] = useState<boolean>(false);
    const [loadingPredictions, setLoadingPredictions] = useState<boolean>(false);
    const [selectedIdx, setSelectedIdx] = useState<number>(-1);

    // Tokenization state
    const [tokenData, setTokenData] = useState<Token[] | null>(null);
    const [isTokenizing, setIsTokenizing] = useState(false);
    const [isLoadingTokenizer, setIsLoadingTokenizer] = useState(false);
    const [tokenError, setTokenError] = useState<string | null>(null);
    const [lastTokenizedText, setLastTokenizedText] = useState<string | null>(null);

    const { handleClick, handleTextInput } = useTutorialManager();
    const { modelName } = useSelectedModel();

    const { handleUpdateCompletion, handleDeleteCompletion, activeCompletions } =
        useLensCompletions();

    const {deleteAnnotation, annotations} = useAnnotations();

    const clearAnnotations = (completionId: string) => {
        annotations.forEach(annotation => {
            if (annotation.type === "token" && annotation.data.id.startsWith(completionId)) {
                deleteAnnotation(annotation.data.id);
            }
        });
    }

    const moreHandleDeleteCompletion = (id: string) => {
        clearAnnotations(id);
        handleDeleteCompletion(id);
    }

    // Check if text has changed since last tokenization
    const textHasChanged = compl.prompt !== lastTokenizedText;
    const shouldEnableTokenize =
        !isTokenizing && !isLoadingTokenizer && modelName && compl.prompt && (!tokenData || textHasChanged);

    const handleTokenize = async () => {
        if (!modelName) {
            setTokenError("No model selected");
            return;
        }

        if (!compl.prompt) {
            setTokenData(null);
            setLastTokenizedText(null);
            return;
        }

        try {
            // Check if tokenizer is cached to determine loading state
            const tokenizerCached = isTokenizerCached(modelName);
            
            if (!tokenizerCached) {
                setIsLoadingTokenizer(true);
            } else {
                setIsTokenizing(true);
            }
            
            setTokenError(null);
            const tokens = await tokenizeText(compl.prompt, modelName);
            setTokenData(tokens);
            setLastTokenizedText(compl.prompt);
        } catch (err) {
            console.error("Error tokenizing text:", err);
            setTokenError(err instanceof Error ? err.message : "Failed to tokenize text");
        } finally {
            setIsTokenizing(false);
            setIsLoadingTokenizer(false);
            clearAnnotations(compl.id);
            handleClick('#tokenize-button');
        }
    };

    const handleContentUpdate = (id: string, updates: Partial<LensCompletion>) => {
        handleUpdateCompletion(id, updates);
    };

    const handleTokenSelection = (id: string, indices: number[]) => {
        handleUpdateCompletion(id, {
            tokens: indices.map((idx) => ({
                target_id: -1,
                idx: idx,
            })),
        });
    };

    const updateToken = (id: string, tokenIdx: number, targetId: number, targetText: string) => {
        handleUpdateCompletion(id, {
            tokens:
                activeCompletions
                    .find((c) => c.id === id)
                    ?.tokens.map((t) =>
                        t.idx === tokenIdx
                            ? { ...t, target_id: targetId, target_text: targetText }
                            : t
                    ) || [],
        });
    };

    const clearToken = (id: string, tokenIdx: number) => {
        handleUpdateCompletion(id, {
            tokens:
                activeCompletions
                    .find((c) => c.id === id)
                    ?.tokens.map((t) =>
                        t.idx === tokenIdx ? { ...t, target_id: -1, target_text: "" } : t
                    ) || [],
        });
    };

    const handlePredictions = async (completion: LensCompletion) => {
        if (showPredictions) {
            setShowPredictions(false);
        } else {
            setLoadingPredictions(true);
            await runConversation(completion);
            setLoadingPredictions(false);
            handleClick('#view-predictions');
        }
    };

    const runConversation = async (completion: LensCompletion) => {
        try {
            const response = await fetch(config.getApiUrl(config.endpoints.executeSelected), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    completion: completion,
                    model: completion.model,
                    tokens: completion.tokens,
                }),
            });
            const data: TokenPredictions = await response.json();
            setPredictions(data);
            setShowPredictions(true);
        } catch (error) {
            console.error("Error sending request:", error);
        } finally {
            console.log("Done");
        }
    };

    const contentUpdate = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        handleContentUpdate(compl.id, {
            prompt: e.target.value,
        });

        // Tutorial trigger for specific text input
        handleTextInput(e.target.value);
    };

    const [predictionsEnabled, setPredictionsEnabled] = useState(false);

    return (
        <div key={compl.id}>
            <div
                className={cn(
                    "border bg-card px-4 pb-4 pt-2 overflow-hidden transition-all duration-200 ease-in-out",
                    showPredictions ? "rounded-t-lg" : "rounded-lg"
                )}
            >
                <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                            <Input
                                value={compl.name}
                                placeholder="Untitled"
                                onChange={(e) =>
                                    handleContentUpdate(compl.id, { name: e.target.value })
                                }
                                className="border-none shadow-none px-1 py-0 font-bold"
                            />
                            <span className="text-xs px-1">{compl.model}</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moreHandleDeleteCompletion(compl.id)}
                        >
                            <Trash size={16} className="w-8 h-8" />
                        </Button>
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
                            onClick={() => {
                                handlePredictions(compl);
                            }}
                            disabled={!predictionsEnabled || loadingPredictions}
                            id="view-predictions"
                        >   
                            {loadingPredictions ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                            ) : (
                                <Keyboard size={16} className="w-8 h-8" />
                            )}
                        </Button>
                    </div>
                </div>
                <div className="flex flex-col h-full gap-4">
                    <div className="flex-1 overflow-y-auto space-y-6">
                        <Textarea
                            value={compl.prompt}
                            onChange={contentUpdate}
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
                            predictions={predictions || {}}
                            onTokenSelection={(indices) => handleTokenSelection(compl.id, indices)}
                            setSelectedIdx={setSelectedIdx}
                            filledTokens={compl.tokens}
                            tokenData={tokenData}
                            setPredictionsEnabled={setPredictionsEnabled}
                            isTokenizing={isTokenizing}
                            isLoadingTokenizer={isLoadingTokenizer}
                            tokenError={tokenError}
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
