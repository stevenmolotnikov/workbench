import { useState } from "react";
import { encodeText } from "@/actions/tokenize";
import { toast } from "sonner"
import { LensConfigData } from "@/types/lens";
import { Prediction, Token } from "@/types/models";

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
    const [selectedPredictionId, setSelectedPredictionId] = useState<number | null>(null);

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
            }

        } else {
            toast.error(`Please enter a single token.`);
        }
    };

    return (
        <div>
            {currentTokenPrediction ? (
                <div>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index}>
                            id: {currentTokenPrediction.ids[index]}
                            text: {currentTokenPrediction.texts[index]}
                            prob: {currentTokenPrediction.probs[index]}
                        </div>
                    ))}
                </div>
            ) : (
                <div>
                    No predictions for this token.
                </div>
            )}
        </div>
    )



};
