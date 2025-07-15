import { useEffect, useState } from "react";
import type { TokenPredictions } from "@/types/tokenizer";
import type { LensCompletion } from "@/types/lens";
import { Input } from "@/components/ui/input";
import { tokenizeText, decodeTokenIds } from "@/actions/tokenize";
import { Button } from "../ui/button";
import { Plus, Edit2, X, Keyboard, Loader2 } from "lucide-react";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { toast } from "sonner"

interface TokenBadge {
    text: string;
    probability: number;
    id: number;
}

interface TokenDisplayProps {
    predictions: TokenPredictions;
    selectedIdx: number;
    handleTargetTokenUpdate: (text: string) => void;
    tempTokenText: string[];
    compl: LensCompletion;
}

const TokenDisplay = ({
    predictions,
    selectedIdx,
    handleTargetTokenUpdate,
    tempTokenText,
    compl,
}: TokenDisplayProps) => {
    const [targetToken, setTargetToken] = useState<string | null>(null);
    const [decodedTokens, setDecodedTokens] = useState<string[]>([]);
    const [tokenBadges, setTokenBadges] = useState<TokenBadge[]>([]);
    const [selectedPredictionId, setSelectedPredictionId] = useState<number | null>(null);

    // Decode token IDs when predictions change
    useEffect(() => {
        const decodeTokens = async () => {
            if (!predictions[selectedIdx]?.ids) {
                setDecodedTokens([]);
                return;
            }

            try {
                // Only decode the first 3 tokens
                const topTokenIds = predictions[selectedIdx].ids.slice(0, 3);
                const decoded = await decodeTokenIds(topTokenIds, compl.model);
                setDecodedTokens(decoded);
            } catch (error) {
                console.error("Error decoding tokens:", error);
                setDecodedTokens([]);
            }
        };

        decodeTokens();
    }, [predictions, selectedIdx]);

    const fixString = (str: string | undefined) => {
        if (!str) return "";
        return str.replace(" ", "_");
    };

    const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && targetToken !== null && targetToken !== "") {
            await handleTokenSubmit(targetToken);
        } else if (e.key === "Escape") {
            setTargetToken(null);
        }
    };

    const handleTokenSubmit = async (text: string) => {
        try {
            const tokens = await tokenizeText(text, compl.model, false);
            if (!tokens || tokens.length === 0) return;

            // Only process if there's a single token
            if (tokens.length === 1) {
                const tokenId = tokens[0].id;

                // Find the probability of this token in current predictions
                const tokenIndex = predictions[selectedIdx]?.ids.findIndex((id) => id === tokenId);

                // Clear any existing user badges (only one target token)
                setTokenBadges([]);

                if (tokenIndex === -1) {
                    // Token not in predictions - add it as a user badge with probability 0
                    setTokenBadges([
                        {
                            text: tokens[0].text,
                            probability: 0,
                            id: tokenId,
                        },
                    ]);
                    // Don't set selectedPredictionId since it's not a prediction
                    setSelectedPredictionId(null);
                } else {
                    // Token is in predictions - mark it as selected
                    setSelectedPredictionId(tokenId);
                }

                // Update the token in the completion
                handleTargetTokenUpdate(text);
                setTargetToken(null);
            } else {
                // Show notification for multi-token input
                toast.error(`Input "${text}" tokenizes to ${tokens.length} tokens. Please enter a single token.`);
                setTargetToken(null); // Clear the input field
            }
        } catch (error) {
            console.error("Error tokenizing text:", error);
        }
    };

    const removeBadge = (badgeId: number) => {
        setTokenBadges((prev) => prev.filter((badge) => badge.id !== badgeId));
        // Also clear selection if this was the selected prediction token
        if (selectedPredictionId === badgeId) {
            setSelectedPredictionId(null);
        }
    };

    const togglePredictionSelection = (tokenId: number, tokenText: string) => {
        if (selectedPredictionId === tokenId) {
            // Deselect if already selected
            setSelectedPredictionId(null);
            // Clear the target token
            handleTargetTokenUpdate("");
        } else {
            // Select this token
            setSelectedPredictionId(tokenId);
            // Clear any user-added badges when selecting a prediction
            setTokenBadges([]);
            // Set as target token
            handleTargetTokenUpdate(tokenText);
        }
    };

    // Create prediction badges from top predictions
    const predictionBadges = decodedTokens.map((tokenStr: string, idx: number) => ({
        text: tokenStr,
        probability: predictions[selectedIdx].values[idx],
        id: predictions[selectedIdx].ids[idx],
        isPrediction: true,
    }));

    // Combine prediction badges with user-added badges
    const allBadges = [
        ...predictionBadges,
        ...tokenBadges.map((badge) => ({ ...badge, isPrediction: false })),
    ];

    return (
        <div className="space-y-3" id="predictions-display">
            {/* All badges displayed inline */}
            <div className="flex flex-wrap gap-2 items-center">
                {allBadges.map((badge, index) => {
                    const isSelected = selectedPredictionId === badge.id;
                    const shouldHighlight = !badge.isPrediction || isSelected;

                    return (
                        <div
                            key={`${badge.id}-${badge.isPrediction ? "pred" : "user"}`}
                            className={`inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs cursor-pointer hover:bg-muted/80 transition-colors ${shouldHighlight
                                ? "border border-primary"
                                : "border border-transparent"
                                }`}
                            onClick={
                                badge.isPrediction
                                    ? () => togglePredictionSelection(badge.id, badge.text)
                                    : () => removeBadge(badge.id)
                            }
                            title={
                                badge.isPrediction
                                    ? isSelected
                                        ? "Click to deselect"
                                        : "Click to select"
                                    : "Click to remove"
                            }
                        >
                            <span className="font-medium">{fixString(badge.text)}</span>
                            <span className="ml-1 text-xs opacity-70">
                                {badge.probability.toFixed(4)}
                            </span>
                        </div>
                    );
                })}
                {/* Add token badge */}
                <div className="inline-flex">
                    {targetToken !== null ? (
                        <input
                            type="text"
                            className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs border border-primary outline-none"
                            placeholder="Enter token"
                            value={targetToken}
                            onChange={(e) => setTargetToken(e.target.value)}
                            onKeyDown={handleKeyPress}
                            onBlur={() => {
                                if (targetToken) {
                                    handleTokenSubmit(targetToken);
                                } else {
                                    setTargetToken(null);
                                }
                            }}
                            autoFocus
                        />
                    ) : (
                        <div
                            className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs cursor-pointer hover:bg-muted/80 transition-colors border border-transparent"
                            onClick={() => setTargetToken("")}
                        >
                            +
                        </div>
                    )}
                </div>
                {tempTokenText.length > 1 && (
                    <div className="text-xs text-red-500 bg-red-500/10 border border-red-200 px-2 py-1 rounded">
                        Multi-token input: {tempTokenText.join(" + ")} ({tempTokenText.length}{" "}
                        tokens)
                    </div>
                )}
            </div>


        </div>
    );
};

interface PredictionDisplayProps {
    predictions: TokenPredictions;
    compl: LensCompletion;
    selectedIdx: number;
    onRevise?: () => void;
    onClear?: () => void;
    onRunPredictions?: () => Promise<void>;
    loadingPredictions?: boolean;
    highlightedTokensCount?: number;
    setIsRevising?: (value: boolean) => void;
}

export const PredictionDisplay = ({ 
    predictions, 
    compl, 
    selectedIdx, 
    onRevise, 
    onClear, 
    onRunPredictions,
    loadingPredictions = false,
    highlightedTokensCount = 0,
    setIsRevising
}: PredictionDisplayProps) => {
    const [tempTokenText, setTempTokenText] = useState<string[]>([]);

    const updateToken = (idx: number, targetId: number, targetText: string) => {
        const { handleUpdateCompletion } = useLensWorkspace.getState();

        const currentTokens = compl.tokens || [];
        handleUpdateCompletion(compl.id, {
            tokens: currentTokens.map((t) =>
                t.idx === idx ? { ...t, target_id: targetId, target_text: targetText } : t
            ),
        });
    };

    const clearToken = (tokenIdx: number) => {
        const { handleUpdateCompletion } = useLensWorkspace.getState();
        const currentTokens = compl.tokens || [];
        handleUpdateCompletion(compl.id, {
            tokens: currentTokens.map((t) =>
                t.idx === tokenIdx ? { ...t, target_id: -1, target_text: "" } : t
            ),
        });
    };

    const handleTargetTokenUpdate = async (text: string) => {
        try {
            const tokens = await tokenizeText(text, compl.model, false);
            if (!tokens || tokens.length === 0) return;

            // Only update if there's a single token
            if (tokens.length === 1) {
                updateToken(selectedIdx, tokens[0].id, tokens[0].text);
                setTempTokenText([]);
            } else {
                // Else, set temp token text and clear tokens
                setTempTokenText(tokens.map((t) => t.text));
                clearToken(selectedIdx);
            }
        } catch (error) {
            console.error("Error tokenizing text:", error);
        }
    };

    const handleRunPredictions = async () => {
        if (setIsRevising) {
            setIsRevising(false);
        }
        if (onRunPredictions && highlightedTokensCount > 0) {
            await onRunPredictions();
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                {predictions && predictions[selectedIdx] ? (
                    <TokenDisplay
                        predictions={predictions}
                        selectedIdx={selectedIdx}
                        handleTargetTokenUpdate={handleTargetTokenUpdate}
                        tempTokenText={tempTokenText}
                        compl={compl}
                    />
                ) : (
                    <div className="text-sm text-muted-foreground">No token selected</div>
                )}
                <div className="flex gap-2 ml-4 ">
                    {onRunPredictions && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRunPredictions}
                            disabled={loadingPredictions || highlightedTokensCount === 0}
                            className="text-xs"
                        >
                            {loadingPredictions ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Keyboard className="w-3 h-3" />
                            )}
                        </Button>
                    )}
                    {onRevise && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onRevise}
                            className="text-xs"
                        >
                            <Edit2 className="w-3 h-3" />
                        </Button>
                    )}
                    {onClear && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onClear}
                            className="text-xs"
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};