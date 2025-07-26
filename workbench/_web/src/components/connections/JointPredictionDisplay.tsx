import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw, Plus } from "lucide-react";
import { tokenizeText } from "@/actions/tokenize";
import { usePatchingCompletions } from "@/stores/usePatchingCompletions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import config from "@/lib/config";
import { decodeTokenIds } from "@/actions/tokenize";
import { useSelectedModel } from "@/stores/useSelectedModel";
import { cn } from "@/lib/utils";
import type { Token } from "@/types/tokenizer";
import { BorderBeam } from "@/components/magicui/border-beam";
import { TooltipButton } from "../ui/tooltip-button";
import { toast } from "sonner";


const fixString = (str: string) => {
    return str.replace(" ", "_");
};

interface PredictionBadgesProps {
    label: string;
    badges: Token[];
    activeTokenType: "correct" | "incorrect" | null;
    handlePredictionSelect: (badge: Token) => void;
}

function PredictionBadges({
    label,
    badges,
    activeTokenType,
    handlePredictionSelect,
}: PredictionBadgesProps) {
    return (
        <div className="gap-2 flex flex-row items-center justify-between">
            <div className="text-sm">{label} Predictions</div>

            <div className="flex gap-2 items-center">
                {badges.map((badge) => {
                    return (
                        <div
                            key={`dest-${badge.id}`}
                            className={`inline-flex items-center px-2 py-1 rounded-md bg-card text-muted-foreground text-xs transition-colors border border-transparent ${activeTokenType
                                ? "cursor-pointer hover:bg-muted/80"
                                : "opacity-50"
                                }`}
                            onClick={() => handlePredictionSelect(badge)}
                            title={
                                !activeTokenType
                                    ? "Select a target badge first"
                                    : "Click to select"
                            }
                        >
                            <span className="font-medium">{fixString(badge.text)}</span>
                            <span className="ml-1 text-xs opacity-70">
                                {badge.probability?.toFixed(4)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

interface TargetTokenBadgeProps {
    label: string;
    value: Token | null;
    isActive: boolean;
    onClick: () => void;
    className?: string;
    disabled?: boolean;
}

function TargetTokenBadge({
    label,
    value,
    isActive,
    onClick,
    className,
    disabled
}: TargetTokenBadgeProps) {
    const isEmpty = !value;

    return (
        <div
            className={cn(
                "inline-flex items-center px-2 py-1 rounded-md border h-8 text-xs transition-colors",
                isEmpty
                    ? "border-muted-foreground/30 border-dashed bg-muted/20 text-muted-foreground"
                    : "border-muted bg-muted text-muted-foreground",
                isActive && !disabled && "border-primary",
                disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/80",
                className
            )}
            onClick={disabled ? undefined : onClick}
            title={disabled
                ? "Disabled"
                : isEmpty
                    ? `Click to select ${label.toLowerCase()} token`
                    : `${label}: ${value}`
            }
        >
            {isEmpty ? (
                <span className="text-muted-foreground/60">
                    {label}
                </span>
            ) : (
                <>
                    <span className="font-medium text-xs opacity-60 mr-1">
                        {label}:
                    </span>
                    <span className="font-medium">
                        {fixString(value.text)}
                    </span>
                </>
            )}
        </div>
    );
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
    notificationMessage: string;
    setNotificationMessage: (message: string) => void;
}

export function JointPredictionDisplay({ notificationMessage, setNotificationMessage }: JointPredictionDisplayProps) {
    const { modelName } = useSelectedModel();
    const {
        setCorrectToken,
        setIncorrectToken,
        correctToken,
        incorrectToken,
        source,
        destination,
    } = usePatchingCompletions();
    const [targetTokenInput, setTargetTokenInput] = useState("");

    const [activeTokenType, setActiveTokenType] = useState<"correct" | "incorrect" | null>(null);
    const [metric, setMetric] = useState<string | undefined>(undefined);
    const [predictionLoading, setPredictionLoading] = useState(false);
    const [decodedSourceTokens, setDecodedSourceTokens] = useState<string[]>([]);
    const [decodedDestTokens, setDecodedDestTokens] = useState<string[]>([]);
    const [predictions, setPredictions] = useState<PredictionResults | null>(null);

    const setTopTokens = async (data: PredictionResults) => {
        const sourceTopIds = data.source.ids.slice(0, 3);
        const destTopIds = data.destination.ids.slice(0, 3);

        const [decodedSource, decodedDest] = await Promise.all([
            decodeTokenIds(sourceTopIds, modelName),
            decodeTokenIds(destTopIds, modelName),
        ]);

        setDecodedSourceTokens(decodedSource);
        setDecodedDestTokens(decodedDest);
    }


    const handleRunPredictions = async () => {
        console.log(source, destination);
        if (!source.trim() || !destination.trim()) {
            toast.error("Please enter prompts");
            return;
        }

        setPredictionLoading(true);

        try {
            const response = await fetch(config.getApiUrl(config.endpoints.executePair), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    source: source,
                    destination: destination,
                    model: modelName,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setPredictions(data);
            setTopTokens(data);
        } catch (error) {
            console.error("Error running predictions:", error);
        } finally {
            setPredictionLoading(false);
            if (notificationMessage === "Predictions stale") {
                setNotificationMessage("");
            }
        }
    };

    const handleTokenSubmit = async (text: string) => {
        if (!text.trim() || !activeTokenType) return;

        try {
            const tokens = await tokenizeText(text, modelName, false);
            if (!tokens || tokens.length === 0) return;

            // Assert the text tokenizes to a single token
            if (tokens.length === 1) {
                if (activeTokenType === 'correct') {
                    setCorrectToken(tokens[0]);
                } else {
                    setIncorrectToken(tokens[0]);
                }
                setTargetTokenInput("");
                setNotificationMessage("");
                setActiveTokenType(null);
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

    const handlePredictionSelect = (token: Token) => {
        if (!activeTokenType) return;

        if (activeTokenType === 'correct') {
            setCorrectToken(token);
        } else {
            setIncorrectToken(token);
        }

        setActiveTokenType(null);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && targetTokenInput.trim()) {
            handleTokenSubmit(targetTokenInput);
        }
    };


    function createTokenBadges(decodedTokens: string[], predictions: { ids: number[]; values: number[] }): Token[] {
        return decodedTokens.map((tokenStr, idx) => ({
            text: tokenStr,
            probability: predictions.values[idx],
            id: predictions.ids[idx],
        }));
    }

    const sourceBadges = predictions ? createTokenBadges(decodedSourceTokens, predictions.source) : [];
    const destBadges = predictions ? createTokenBadges(decodedDestTokens, predictions.destination) : [];

    function handleSelectMetric(value: string) {
        if (metric === undefined) {
            handleRunPredictions();
        }

        // Reset target tokens
        setCorrectToken(null);
        setIncorrectToken(null);

        setMetric(value);
        setActiveTokenType(null);
    }

    return (
        <div className="bg-card/30 p-4 rounded border relative">
            <div className="flex flex-row items-center justify-between">


                <div className="flex flex-row items-center">
                    {/* <h2 className="text-sm font-medium">Prompts</h2> */}
                    <Select value={metric} onValueChange={handleSelectMetric}>
                        <SelectTrigger className="w-40 h-8" disabled={source === "" || destination === ""}>
                            <SelectValue placeholder="Select metric" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="logit-difference">Logit Diff</SelectItem>
                            <SelectItem value="target-prob">Target Prob</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Target Token Badges */}
                    <div className="flex items-center gap-2 ml-2">
                        <TargetTokenBadge
                            label="Correct"
                            value={correctToken}
                            isActive={activeTokenType === 'correct'}
                            onClick={() => setActiveTokenType(activeTokenType === 'correct' ? null : 'correct')}
                            disabled={metric === undefined || predictionLoading || notificationMessage === "Predictions stale"}
                        />
                        {metric === "logit-difference" && (
                            <TargetTokenBadge
                                label="Incorrect"
                                value={incorrectToken}
                                isActive={activeTokenType === 'incorrect'}
                                onClick={() => setActiveTokenType(activeTokenType === 'incorrect' ? null : 'incorrect')}
                                disabled={metric === undefined || predictionLoading || notificationMessage === "Predictions stale"}
                            />
                        )}
                    </div>
                </div>
                <TooltipButton
                    onClick={handleRunPredictions}
                    // disabled={predictionLoading || !source.trim() || !destination.trim() || metric === undefined}
                    className="w-8 h-8"
                    size="icon"
                    tooltip="Run predictions"
                >
                    <RotateCcw className="w-4 h-4" />
                </TooltipButton>
            </div>
            {predictionLoading &&
                <BorderBeam
                    duration={5}
                    size={50}
                    className="from-transparent bg-primary to-transparent"
                />
                }



            {predictions && (
                <div className="border-t mt-4">
                    {/* Predictions Display */}
                    <div className="gap-4 mt-4 pl-2 flex flex-col">
                        {/* Source Predictions */}
                        <PredictionBadges
                            label="Source"
                            badges={sourceBadges}
                            activeTokenType={activeTokenType}
                            handlePredictionSelect={handlePredictionSelect}
                        />

                        {/* Destination Predictions */}
                        <PredictionBadges
                            label="Destination"
                            badges={destBadges}
                            activeTokenType={activeTokenType}
                            handlePredictionSelect={handlePredictionSelect}
                        />
                    </div>

                    {/* Notification message */}
                    {notificationMessage && (
                        <div className="text-xs border bg-destructive/50 mt-4 h-8 px-3 flex items-center rounded">
                            {notificationMessage}
                        </div>
                    )}

                    {/* Token Input */}
                    <div className="flex items-center mt-4 gap-2">
                        <Input
                            className="h-8"
                            placeholder={activeTokenType ? `Enter ${activeTokenType} token and press Enter` : "Select a target badge to enter tokens"}
                            value={targetTokenInput}
                            onChange={(e) => setTargetTokenInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={!activeTokenType || notificationMessage === "Predictions stale"}
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
            )}
        </div>
    );
} 