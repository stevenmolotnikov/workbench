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
    const [additionalToken, setAdditionalToken] = useState<Token | null>(null);
    const [addingToken, setAddingToken] = useState(false);
    const [targetToken, setTargetToken] = useState<string>("");

    const [selectedPredictionIdx, setSelectedPredictionIdx] = useState<number | null>(null);

    const currentTokenPrediction = predictions.find((p) => p.idx === selectedIdx);

    const fixString = (str: string | undefined) => {
        if (!str) return "";
        return str.replace(" ", "_");
    };

    const handleTokenSubmit = async (text: string) => {
        const tokens = await encodeText(text, config.model, false);

        if (tokens.length === 1) {
            const token = tokens[0];

            if (!currentTokenPrediction) {
                toast.error("Selected index not in predictions.")
                return;
            };

            const tokenIndexInData = currentTokenPrediction.ids.findIndex((id) => id === token.id);

            const newToken = {
                idx: selectedIdx,
                id: currentTokenPrediction.ids[tokenIndexInData],
                text: currentTokenPrediction.texts[tokenIndexInData],
                prob: currentTokenPrediction.probs[tokenIndexInData],
            }

            if (tokenIndexInData === -1) {
                toast.error("Token not in predictions.")
                return;
            } else {
                setAdditionalToken(newToken);
                setAddingToken(false);
            }

        } else {
            toast.error(`Please enter a single token.`);
        }

        setTargetToken("");
    };

    const handlePredictionClick = (index: number, id: number) => {
        if (selectedPredictionIdx === index) {
            setSelectedPredictionIdx(null);
            return;
        }

        // Find and replace token with same idx, or add if not found
        const existingTokenIndex = config.tokens.findIndex(token => token.idx === selectedIdx);
        if (existingTokenIndex === -1) toast.error("Token not found.")

        const newToken = {
            ...config.tokens[existingTokenIndex],
            targetId: id,
            targetText: currentTokenPrediction?.texts[index] ?? "",
        }

        // Replace existing token
        const updatedTokens = [...config.tokens];
        updatedTokens[existingTokenIndex] = newToken;
        setConfig({
            ...config,
            tokens: updatedTokens,
        });
        setSelectedPredictionIdx(index);
    }


    if (currentTokenPrediction) {
        return (
            <div className="flex flex-wrap gap-2 item-center">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            "border text-xs rounded px-2 py-1 flex items-center bg-muted hover:bg-muted/80 cursor-pointer",
                            selectedPredictionIdx === index && "border-primary"
                        )}
                        onClick={() => handlePredictionClick(index, currentTokenPrediction.ids[index])}
                    >
                        <span className="font-medium">
                            {fixString(currentTokenPrediction.texts[index])}
                        </span>
                        <span className="opacity-70 ml-2">
                            {currentTokenPrediction.probs[index].toFixed(4)}
                        </span>
                    </div>
                ))}
                {additionalToken && (
                    <div
                        className={"border text-xs rounded px-2 py-1 flex items-center bg-muted border-primary hover:bg-muted/80 cursor-pointer"}
                    >
                        <span className="font-medium">
                            {fixString(additionalToken.text)}
                        </span>
                        <span className="opacity-70 ml-2">
                            {additionalToken.prob?.toFixed(4)}
                        </span>
                    </div>
                )}
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
