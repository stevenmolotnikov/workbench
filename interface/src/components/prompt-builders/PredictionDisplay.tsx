import { useEffect, useState } from "react";
import { TokenPredictions } from "@/types/workspace";
import { LensCompletion } from "@/types/lens";
import { Input } from "@/components/ui/input";
import { useSelectedModel } from "@/hooks/useSelectedModel";
import { tokenizeText, decodeTokenIds } from "@/components/prompt-builders/tokenize";

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
    const [targetToken, setTargetToken] = useState<string>("");
    const [decodedTokens, setDecodedTokens] = useState<string[]>([]);
    const [tokenBadges, setTokenBadges] = useState<TokenBadge[]>([]);
    const { modelName } = useSelectedModel();

    // Decode token IDs when predictions change
    useEffect(() => {
        const decodeTokens = async () => {
            if (!modelName || !predictions[selectedIdx]?.ids) {
                setDecodedTokens([]);
                return;
            }

            try {
                // Only decode the first 3 tokens
                const topTokenIds = predictions[selectedIdx].ids.slice(0, 3);
                const decoded = await decodeTokenIds(topTokenIds, modelName);
                setDecodedTokens(decoded);
            } catch (error) {
                console.error('Error decoding tokens:', error);
                setDecodedTokens([]);
            }
        };

        decodeTokens();
    }, [predictions, selectedIdx, modelName]);

    const fixString = (str: string | undefined) => {
        if (!str) return "";    
        return str.replace(" ", "_");
    };

    const handleKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && targetToken.trim()) {
            await handleTokenSubmit(targetToken.trim());
        }
    };

    const handleTokenSubmit = async (text: string) => {
        if (!modelName) {
            console.error('No model selected');
            return;
        }

        try {
            const tokens = await tokenizeText(text, modelName);
            if (!tokens || tokens.length === 0) return;

            // Only process if there's a single token
            if (tokens.length === 1) {
                const tokenId = tokens[0].id;
                
                // Find the probability of this token in current predictions
                const tokenIndex = predictions[selectedIdx]?.ids.findIndex(id => id === tokenId);
                const probability = tokenIndex !== -1 ? predictions[selectedIdx].values[tokenIndex] : 0;
                
                // Add to badges if not already present
                const existingBadge = tokenBadges.find(badge => badge.id === tokenId);
                if (!existingBadge) {
                    const newBadge: TokenBadge = {
                        text: tokens[0].text,
                        probability,
                        id: tokenId
                    };
                    setTokenBadges(prev => [...prev, newBadge]);
                }
                
                // Update the token in the completion
                handleTargetTokenUpdate(text);
                setTargetToken("");
            }
        } catch (error) {
            console.error('Error tokenizing text:', error);
        }
    };

    const removeBadge = (badgeId: number) => {
        setTokenBadges(prev => prev.filter(badge => badge.id !== badgeId));
    };

    // Create prediction badges from top predictions
    const predictionBadges = decodedTokens.map((tokenStr: string, idx: number) => ({
        text: tokenStr,
        probability: predictions[selectedIdx].values[idx],
        id: predictions[selectedIdx].ids[idx],
        isPrediction: true
    }));

    // Combine prediction badges with user-added badges
    const allBadges = [...predictionBadges, ...tokenBadges.map(badge => ({ ...badge, isPrediction: false }))];

    return (
        <div className="space-y-3" id="predictions-display">
            {/* All badges displayed inline */}
            <div className="flex flex-wrap gap-2 items-center">
                {allBadges.map((badge, index) => (
                    <div
                        key={`${badge.id}-${badge.isPrediction ? 'pred' : 'user'}`}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={badge.isPrediction ? undefined : () => removeBadge(badge.id)}
                        title={badge.isPrediction ? 'Top prediction' : 'Click to remove'}
                    >
                        <span className="font-medium">{fixString(badge.text)}</span>
                        <span className="ml-1 text-xs opacity-70">
                            {badge.probability.toFixed(4)}
                        </span>
                    </div>
                ))}
                {tempTokenText.length > 1 && (
                    <div className="text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded">
                        Multi-token: {JSON.stringify(tempTokenText)}
                    </div>
                )}
            </div>

            {/* Input field */}
            <div className="border-t pt-3">
                <Input
                    className="h-8"
                    placeholder="Enter a target token and press Enter"
                    value={targetToken}
                    onChange={(e) => setTargetToken(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
            </div>
        </div>
    );
};

interface PredictionDisplayProps {
    predictions: TokenPredictions;
    compl: LensCompletion;
    selectedIdx: number;
    updateToken: (id: string, idx: number, targetId: number, targetText: string) => void;
    clearToken: (id: string, tokenIdx: number) => void;
}

export const PredictionDisplay = ({
    predictions,
    compl,
    selectedIdx,
    updateToken,
    clearToken,
}: PredictionDisplayProps) => {
    const { modelName } = useSelectedModel();

    const [tempTokenText, setTempTokenText] = useState<string[]>([]);

    const handleTargetTokenUpdate = async (text: string) => {
        if (!modelName) {
            console.error('No model selected');
            return;
        }

        try {
            const tokens = await tokenizeText(text, modelName);
            if (!tokens || tokens.length === 0) return;

            // Only update if there's a single token
            if (tokens.length === 1) {
                updateToken(compl.id, selectedIdx, tokens[0].id, tokens[0].text);
                setTempTokenText([]);
            } else {
                // Else, set temp token text and clear tokens
                setTempTokenText(tokens.map((t) => t.text));
                clearToken(compl.id, selectedIdx);
            }
        } catch (error) {
            console.error('Error tokenizing text:', error);
        }
    };

    return (
        <div className="border-x border-b p-4 bg-card/30 rounded-b-lg transition-all duration-200 ease-in-out animate-in slide-in-from-top-2">
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
        </div>
    );
};
