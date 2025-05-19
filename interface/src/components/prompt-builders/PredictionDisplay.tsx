import { useEffect, useState } from "react";
import { Token } from "@/types/tokenizer";
import { TokenPredictions } from "@/types/workspace";
import { LensCompletion } from "@/types/lens";

import { useTokenizer } from "@/stores/useTokenizer";
import { useModelStore } from "@/stores/useModelStore";

interface PredictionDisplayProps {
    predictions: TokenPredictions;
    compl: LensCompletion;
    selectedToken: Token;
    handleTargetTokenUpdate: (id: string, idx: number, value: string) => void;
}

export const PredictionDisplay = ({
    predictions,
    compl,
    selectedToken,
    handleTargetTokenUpdate,
}: PredictionDisplayProps) => {
    const [tokenData, setTokenData] = useState<Token[] | null>(null);
    const { isTokenizerLoading, initializeTokenizer, tokenizeText } = useTokenizer();
    const { modelName } = useModelStore();

    // Perform tokenization whenever text changes
    useEffect(() => {
        if (!selectedToken || selectedToken.idx === null) return;

        const targetToken = compl.tokens.find(
            (t) => t.token_idx === selectedToken.idx
        )?.target_token;

        if (!targetToken) return;

        const debounce = setTimeout(async () => {
            const tokens = await tokenizeText(targetToken);
            setTokenData(tokens);
        }, 500);

        return () => clearTimeout(debounce);
    }, [selectedToken, compl.tokens]);

    useEffect(() => {
        if (!isTokenizerLoading) return;
        initializeTokenizer(modelName);
    }, [modelName, isTokenizerLoading]);

    return (
        <div className="border-x border-b p-4 bg-card/30 rounded-b-lg transition-all duration-200 ease-in-out animate-in slide-in-from-top-2">
            {predictions && selectedToken !== null && predictions[selectedToken.idx] ? (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <input
                            className="bg-transparent border rounded w-1/4"
                            placeholder=""
                            value={
                                compl.tokens.find((t) => t.token_idx === selectedToken.idx)
                                    ?.target_token || ""
                            }
                            onChange={(e) =>
                                handleTargetTokenUpdate(compl.id, selectedToken.idx, e.target.value)
                            }
                        />
                        <span
                            className={`${
                                tokenData?.length === 0 || tokenData?.length > 1 ? "bg-red-500" : ""
                            }`}
                        >
                            {tokenData?.map((t) => t.text).join("|")}
                        </span>
                    </div>
                    {predictions[selectedToken.idx].str_idxs.map((str: string, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                            <span>{str}</span>
                            <span className="text-muted-foreground">
                                {predictions[selectedToken.idx].values[idx].toFixed(4)}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-sm text-muted-foreground">No token selected</div>
            )}
        </div>
    );
};
