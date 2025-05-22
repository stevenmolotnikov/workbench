import { useEffect, useState } from "react";
import { TokenPredictions } from "@/types/workspace";
import { LensCompletion } from "@/types/lens";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useTokenizer } from "@/stores/useTokenizer";
import { useModelStore } from "@/stores/useModelStore";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

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

    const fixString = (str: string | undefined) => {
        if (!str) return "";    
        return str.replace(" ", "_");
    };

    const getText = () => {
        if (compl.tokens.length === 0) return JSON.stringify(tempTokenText);

        const targetToken = compl.tokens.find((t) => t.idx === selectedIdx);

        return fixString(targetToken?.target_text);
    };

    return (
        <div className="space-y-2">
            {predictions[selectedIdx].str_idxs.map((str: string, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                    <span>{fixString(str)}</span>
                    <span className="text-muted-foreground">
                        {predictions[selectedIdx].values[idx].toFixed(4)}
                    </span>
                </div>
            ))}
            <div className="flex justify-between text-sm border-t pt-3">
                <div className="flex w-1/2 max-w-sm items-center space-x-2">
                    <Input
                        className="w-full h-8"
                        placeholder="Enter a target token"
                        value={targetToken}
                        onChange={(e) => setTargetToken(e.target.value)}
                    />
                    <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => handleTargetTokenUpdate(targetToken)}
                    >
                        <ArrowRight />
                    </Button>
                </div>
                <div
                    className={cn(
                        "flex w-full max-w-sm items-center justify-end",
                        tempTokenText.length > 1 && "bg-red-500/50"
                    )}
                >
                    {getText()}
                </div>
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
    const { isTokenizerLoading, initializeTokenizer, tokenizeText } = useTokenizer();
    const { modelName } = useModelStore();

    const [tempTokenText, setTempTokenText] = useState<string[]>([]);

    useEffect(() => {
        if (!isTokenizerLoading) return;
        initializeTokenizer(modelName);
    }, [modelName, isTokenizerLoading]);

    const handleTargetTokenUpdate = async (text: string) => {
        const tokens = await tokenizeText(text);
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
