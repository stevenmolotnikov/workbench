import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { tokenizeText } from "@/actions/tokenize";
import { usePatchingCompletions } from "@/stores/usePatchingCompletions";

interface TokenBadge {
    text: string;
    probability: number;
    id: number;
}

interface PredictionResults {
    source: {
        ids: number[];
        values: number[];
    };
    destination: {
        ids: number[];
        values: number[];
    };
}

interface JointPredictionDisplayProps {
    modelName: string;
    predictions: PredictionResults | null;
    decodedSourceTokens: string[];
    decodedDestTokens: string[];
    activeTokenType: 'correct' | 'incorrect' | null;
}

export function JointPredictionDisplay({ 
    modelName, 
    predictions, 
    decodedSourceTokens, 
    decodedDestTokens,
    activeTokenType
}: JointPredictionDisplayProps) {
    const { 
        source, 
        destination, 
        targetTokens, 
        setCorrectToken, 
        setIncorrectToken, 
        setActiveTokenType
    } = usePatchingCompletions();
    const [targetTokenInput, setTargetTokenInput] = useState("");
    const [notificationMessage, setNotificationMessage] = useState("");

    const fixString = (str: string | undefined) => {
        if (!str) return "";
        return str.replace(" ", "_");
    };

    const handleTokenSubmit = async (text: string) => {
        if (!text.trim() || !activeTokenType) return;

        try {
            const tokens = await tokenizeText(text, modelName, false);
            if (!tokens || tokens.length === 0) return;

            if (tokens.length === 1) {
                const tokenId = tokens[0].id;
                if (activeTokenType === 'correct') {
                    setCorrectToken(text);
                } else {
                    setIncorrectToken(text);
                }
                setTargetTokenInput("");
                setNotificationMessage("");
            } else {
                setNotificationMessage(
                    `Input "${text}" tokenizes to ${tokens.length} tokens. Please enter a single token.`
                );
                setTimeout(() => setNotificationMessage(""), 3000);
                setTargetTokenInput("");
            }
        } catch (error) {
            console.error("Error tokenizing text:", error);
        }
    };

    const handlePredictionSelect = (tokenId: number, tokenText: string) => {
        if (!activeTokenType) return;
        
        // Select this token
        if (activeTokenType === 'correct') {
            setCorrectToken(tokenText);
        } else {
            setIncorrectToken(tokenText);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && targetTokenInput.trim()) {
            handleTokenSubmit(targetTokenInput);
        }
    };

    const createTokenBadges = (decodedTokens: string[], predictions: { ids: number[]; values: number[] }) => {
        return decodedTokens.map((tokenStr, idx) => ({
            text: tokenStr,
            probability: predictions.values[idx],
            id: predictions.ids[idx],
        }));
    };

    const sourceBadges = predictions ? createTokenBadges(decodedSourceTokens, predictions.source) : [];
    const destBadges = predictions ? createTokenBadges(decodedDestTokens, predictions.destination) : [];

    return (
        <div className="space-y-4">
            {/* Active Token Selection Prompt */}
            {activeTokenType && (
                <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded border border-blue-200">
                    <span className="font-medium">Select {activeTokenType} token below</span>
                </div>
            )}

            {/* Notification message */}
            {notificationMessage && (
                <div className="text-xs border bg-destructive/50 text-destructive-foreground border-destructive-foreground/50 h-8 px-3 flex items-center rounded">
                    {notificationMessage}
                </div>
            )}

            {/* Predictions Display */}
            {predictions && (
                <div className="space-y-4">
                    {/* Source Predictions */}
                    <div className="space-y-2">
                        <div className="text-xs text-gray-500 font-medium">Source Predictions</div>
                        <div className="flex flex-wrap gap-2">
                            {sourceBadges.map((badge) => {
                                return (
                                    <div
                                        key={`source-${badge.id}`}
                                        className={`inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs transition-colors border border-transparent ${
                                            activeTokenType 
                                                ? "cursor-pointer hover:bg-muted/80" 
                                                : "cursor-not-allowed opacity-50"
                                        }`}
                                        onClick={() => handlePredictionSelect(badge.id, badge.text)}
                                        title={
                                            !activeTokenType 
                                                ? "Select a target badge first" 
                                                : "Click to select"
                                        }
                                    >
                                        <span className="font-medium">{fixString(badge.text)}</span>
                                        <span className="ml-1 text-xs opacity-70">
                                            {badge.probability.toFixed(4)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Destination Predictions */}
                    <div className="space-y-2">
                        <div className="text-xs text-gray-500 font-medium">Destination Predictions</div>
                        <div className="flex flex-wrap gap-2">
                            {destBadges.map((badge) => {
                                return (
                                    <div
                                        key={`dest-${badge.id}`}
                                        className={`inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs transition-colors border border-transparent ${
                                            activeTokenType 
                                                ? "cursor-pointer hover:bg-muted/80" 
                                                : "cursor-not-allowed opacity-50"
                                        }`}
                                        onClick={() => handlePredictionSelect(badge.id, badge.text)}
                                        title={
                                            !activeTokenType 
                                                ? "Select a target badge first" 
                                                : "Click to select"
                                        }
                                    >
                                        <span className="font-medium">{fixString(badge.text)}</span>
                                        <span className="ml-1 text-xs opacity-70">
                                            {badge.probability.toFixed(4)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Token Input */}
            <div className="pt-3 flex items-center gap-2">
                <Input
                    className="h-8"
                    placeholder={activeTokenType ? `Enter ${activeTokenType} token and press Enter` : "Select a target badge to enter tokens"}
                    value={targetTokenInput}
                    onChange={(e) => setTargetTokenInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={!activeTokenType}
                />
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleTokenSubmit(targetTokenInput)}
                    disabled={!targetTokenInput.trim() || !activeTokenType}
                >
                    <Plus size={16} />
                </Button>
            </div>
        </div>
    );
} 