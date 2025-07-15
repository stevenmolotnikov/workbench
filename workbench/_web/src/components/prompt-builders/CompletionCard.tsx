import { ALargeSmall, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LensCompletion } from "@/types/lens";
import { Textarea } from "@/components/ui/textarea";
import { TokenArea } from "@/components/prompt-builders/TokenArea";
import type { TokenPredictions } from "@/types/tokenizer";
import { cn } from "@/lib/utils";
import { useState } from "react";
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

export function CompletionCard({ index }: { index: number }) {
    // Prediction state
    const [predictions, setPredictions] = useState<TokenPredictions | null>(null);
    const [showPredictions, setShowPredictions] = useState<boolean>(false);
    const [loadingPredictions, setLoadingPredictions] = useState<boolean>(false);
    const [selectedIdx, setSelectedIdx] = useState<number>(-1);

    // Tokenization state
    const [tokenData, setTokenData] = useState<Token[] | null>(null);
    const [lastTokenizedText, setLastTokenizedText] = useState<string | null>(null);
    const [tokenizerLoading, setTokenizerLoading] = useState<boolean>(false);
    const [isRevising, setIsRevising] = useState<boolean>(false);

    const [showTokenArea, setShowTokenArea] = useState<boolean>(false);

    // Hooks
    const { handleClick, handleTextInput } = useTutorialManager();
    const { tokenizeOnEnter } =
        useLensWorkspace();

    const [completion, setCompletion] = useState<LensCompletion>({
        id: "",
        name: "",
        model: "",
        prompt: "",
        tokens: [],
    });

    const textHasChanged = completion.prompt !== lastTokenizedText;
    const shouldEnableTokenize = completion.prompt && (!tokenData || textHasChanged);

    const removeToken = (idxs: number[]) => {
        setCompletion({
            ...completion,
            tokens: completion.tokens.filter((t) => !idxs.includes(t.idx)),
        });
    };

    const tokenSelection = useTokenSelection({ compl: completion, removeToken });

    const handleTokenize = async () => {
        if (!completion.prompt) {
            setTokenData(null);
            setLastTokenizedText(null);
            return;
        }

        if (showPredictions) {
            setShowPredictions(false);
        }

        try {
            setTokenizerLoading(true);
            const tokens = await tokenizeText(completion.prompt, completion.model);
            setTokenData(tokens);
            setLastTokenizedText(completion.prompt);

            // Auto-select last token and run predictions
            if (tokens && tokens.length > 0) {
                const lastTokenIdx = tokens.length - 1;
                setSelectedIdx(lastTokenIdx);

                console.log('HERE');

                // Update highlighted tokens in token selection
                tokenSelection.setHighlightedTokens([lastTokenIdx]);
                setCompletion({
                    ...completion,
                    tokens: [{ idx: lastTokenIdx, target_id: -1, target_text: "" }],
                });

                setLoadingPredictions(true);
                await runPredictionsWithCompletion(completion);
                setLoadingPredictions(false);
            }

        } catch (err) {
            console.error("Error tokenizing text:", err);
        } finally {
            handleClick("#tokenize-button");
            setTokenizerLoading(false);
        }
    };


    const highlightedTokens = tokenSelection.highlightedTokens;

    const updateTokens = () => {
        const existingIndices = new Set(compl.tokens.map((t) => t.idx));

        console.log(existingIndices);

        // Create new tokens only for indices that don't already exist
        const newTokens = highlightedTokens
            .filter((idx) => !existingIndices.has(idx))
            .map((idx) => ({
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
        const { completions } = useLensWorkspace.getState();
        const updatedCompl = completions.find((c: LensCompletion) => c.id === compl.id);

        return updatedCompl;
    };

    const runPredictions = async () => {
        const updatedCompl = updateTokens();

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
                }),
            });

            console.log(updatedCompl);
            const data: TokenPredictions = await response.json();

            setPredictions(data);
            setShowPredictions(true);
            setShowTokenArea(true);
        } catch (error) {
            console.error("Error sending request:", error);
        }
    };

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCompletion({
            ...completion,
            prompt: e.target.value,
        });
        handleTextInput(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (tokenizeOnEnter && e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (shouldEnableTokenize) {
                handleTokenize();
            }
        }
    };

    return (
        <div className="group relative">
            {/* Delete button */}
            <Button
                variant="ghost"
                title="Delete completion"
                size="icon"
                onClick={() => { }} // HANDLE DELETE
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
                    showPredictions ? "rounded-t-lg" : "rounded-lg",
                )}
            >
                {/* Header */}
                <div className="flex items-center my-4 justify-between">
                    <div className="flex px-0.5 flex-col">
                        <Input
                            value={completion.name}
                            placeholder="Untitled"
                            onChange={(e) => setCompletion({
                                ...completion,
                                name: e.target.value,
                            })}
                            className="border-none shadow-none rounded h-fit px-0 py-0 font-bold"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-xs">{completion.model}</span>
                        </div>
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
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col h-full gap-4">
                    {!showTokenArea ? (
                        <Textarea
                            value={completion.prompt}
                            onChange={handlePromptChange}
                            onKeyDown={handleKeyDown}
                            className="h-24"
                            placeholder="Enter your prompt here."
                            id="completion-text"
                        />
                    ) : (
                        <div
                            className={cn(
                                "flex flex-col w-full px-3 py-2 animate-in slide-in-from-bottom-2 border rounded h-24 overflow-y-auto",
                                loadingPredictions && "pointer-events-none"
                            )}
                            id="token-area"
                        >
                            <TokenArea
                                compl={completion}
                                showPredictions={!isRevising}
                                setSelectedIdx={setSelectedIdx}
                                tokenData={tokenData}
                                tokenSelection={tokenSelection}
                            />
                        </div>
                    )}
                </div>
            </div>
            {showPredictions && (
                <div className="border-x border-b p-4 bg-card/30 rounded-b-lg transition-all duration-200 ease-in-out animate-in slide-in-from-top-2">
                    <PredictionDisplay
                        predictions={predictions || {}}
                        compl={completion}
                        selectedIdx={selectedIdx}
                        onRevise={() => setIsRevising(true)}
                        onClear={() => {
                            setShowPredictions(false);
                            setIsRevising(false);
                            setPredictions(null);
                            tokenSelection.setHighlightedTokens([]);
                            setSelectedIdx(-1);
                            setShowTokenArea(false);
                        }}
                        onRunPredictions={async () => {
                            setLoadingPredictions(true);
                            await runPredictions();
                            setLoadingPredictions(false);
                        }}
                        loadingPredictions={loadingPredictions}
                        highlightedTokensCount={tokenSelection.highlightedTokens.length}
                        setIsRevising={setIsRevising}
                    />
                </div>
            )}
        </div>
    );
}