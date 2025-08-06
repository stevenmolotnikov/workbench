import { useState } from "react";
import { encodeText } from "@/actions/tokenize";
import { toast } from "sonner"
import { LensConfigData } from "@/types/lens";
import { Prediction, Token } from "@/types/models";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PredictionBadgesProps {
    config: LensConfigData;
    setConfig: (config: LensConfigData) => void;
    predictions: Prediction[];
    selectedIdx: number;
}

export const PredictionBadges = ({
    config,
    setConfig,
    predictions,
    selectedIdx,
}: PredictionBadgesProps) => {
    const [additionalTokens, setAdditionalTokens] = useState<Token[]>([]);
    const [addingToken, setAddingToken] = useState(false);
    const [targetToken, setTargetToken] = useState<string>("");

    const [selectedPredictionIds, setSelectedPredictionIds] = useState<number[]>([]);

    const currentTokenPrediction = predictions.find((p) => p.idx === selectedIdx);

    if (!currentTokenPrediction) {
        toast.error("Selected index not in predictions.")
        return (
            <div>
                No predictions for this token.
            </div>
        );
    };

    const renderTokenText = (text: string | undefined) => {
        if (!text) return "";
        if (text.includes(" ")) {
            return (
                <>
                    {text.split(" ")[0]}
                    <span className="text-blue-500">_</span>
                    {text.split(" ").slice(1).join(" ")}
                </>
            );
        }
        return text;
    };

    const handlePredictionClick = (id: number) => {
        // If already selected, remove
        if (selectedPredictionIds.includes(id)) {
            // Remove from the selected prediction indices
            setSelectedPredictionIds(selectedPredictionIds.filter(i => i !== id));

            // Remove the id from the target ids
            const newTargetIds = config.token.targetIds.filter(targetId => targetId !== id)

            // Update the config
            setConfig({
                ...config,
                token: {
                    ...config.token,
                    targetIds: newTargetIds,
                },
            })
            return;
        }

        // Else, add the id to the target ids
        setConfig({
            ...config,
            token: {
                ...config.token,
                targetIds: [...config.token.targetIds, id],
            },
        })

        // Add the index to the selected prediction indices
        setSelectedPredictionIds([...selectedPredictionIds, id])
    }

    const handleTokenSubmit = async (text: string) => {
        const tokens = await encodeText(text, config.model, false);

        // Only add if it's a single token
        if (tokens.length !== 1) toast.error(`Please enter a single token.`);
        const token = tokens[0];

        // If the token is already selected, dont change anything.
        // If the token is not selected, highlight the existing badge rather than adding a new one.
        if (currentTokenPrediction.ids.includes(token.id)) {
            if (!selectedPredictionIds.includes(token.id)) handlePredictionClick(token.id);
            setAddingToken(false);
            setTargetToken("");
            return;
        }

        // If the token index is not in the data, skip bc prob is too low
        const tokenIndexInData = currentTokenPrediction.ids.findIndex((id) => id === token.id);
        if (tokenIndexInData === -1) {
            toast.error("Token probability is too low. Caden will fix this soon.")

        } else {
            const newToken: Token = {
                idx: selectedIdx,
                id: currentTokenPrediction.ids[tokenIndexInData],
                text: currentTokenPrediction.texts[tokenIndexInData],
                targetIds: [],
            }

            setAdditionalTokens([...additionalTokens, newToken]);
            setAddingToken(false);
        }

        setTargetToken("");
    };

    const handleAdditionalTokenClick = (index: number) => {
        // Remove from the additional tokens
        setAdditionalTokens(additionalTokens.filter((_, i) => i !== index));
    }

    if (currentTokenPrediction) {
        return (
            <div className="flex flex-wrap gap-2 item-center">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            "border text-xs rounded px-2 py-1 flex items-center bg-muted hover:bg-muted/80 cursor-pointer",
                            selectedPredictionIds.includes(currentTokenPrediction.ids[index]) && "border-primary"
                        )}
                        onClick={() => handlePredictionClick(currentTokenPrediction.ids[index])}
                    >
                        <span className="font-medium">
                            {renderTokenText(currentTokenPrediction.texts[index])}
                        </span>
                        <span className="opacity-70 ml-2">
                            {currentTokenPrediction.probs[index].toFixed(4)}
                        </span>
                    </div>
                ))}
                {additionalTokens.map((token, index) => (
                    <div
                        key={index}
                        className={"border text-xs rounded px-2 py-1 flex items-center bg-muted border-primary hover:bg-muted/80 cursor-pointer"}
                        onClick={() => handleAdditionalTokenClick(index)}
                    >
                        <span className="font-medium">
                            {renderTokenText(token.text)}
                        </span>
                        <span className="opacity-70 ml-2">
                            {currentTokenPrediction.probs[currentTokenPrediction.texts.indexOf(token.text)].toFixed(4)}
                        </span>
                    </div>
                ))}
                {addingToken ? (
                    <input
                        type="text"
                        className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs border border-primary outline-none"
                        placeholder="Enter token"
                        value={targetToken}
                        onChange={(e) => setTargetToken(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleTokenSubmit(targetToken);
                            }
                        }}
                        onBlur={() => {
                            if (targetToken) {
                                handleTokenSubmit(targetToken);
                            } else {
                                setTargetToken("");
                                setAddingToken(false);
                            }
                        }}
                        autoFocus
                    />
                ) : (
                    <div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setAddingToken(true)}
                        >
                            <Plus size={16} className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        )
    } else {
        return (
            <div>
                No predictions for this token.
            </div>
        )
    }

};
