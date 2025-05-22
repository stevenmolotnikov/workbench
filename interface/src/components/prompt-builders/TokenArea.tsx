"use client";

import { useState, useEffect, useRef } from "react";
import { useTokenSelection } from "@/hooks/useTokenSelection";
import { Token } from "@/types/tokenizer";
import { TokenCompletion } from "@/types/lens";
import { cn } from "@/lib/utils";
import { TokenPredictions } from "@/types/workspace";
import { useWorkbench } from "@/stores/useWorkbench";
import { useTokenizer } from "@/stores/useTokenizer";

interface TokenAreaProps {
    text: string | { role: string; content: string }[] | null;
    showPredictions: boolean;
    predictions: TokenPredictions;
    onTokenSelection?: (indices: number[]) => void;
    setSelectedIdx: (idx: number) => void;
    filledTokens: TokenCompletion[];
}

export function TokenArea({
    predictions,
    text,
    showPredictions,
    onTokenSelection,
    setSelectedIdx,
    filledTokens,
}: TokenAreaProps) {
    const { modelName } = useWorkbench();
    const { isLocalLoading, isTokenizerLoading, error, initializeTokenizer, tokenizeText } =
        useTokenizer();
    const [tokenData, setTokenData] = useState<Token[] | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize tokenizer when component mounts or model changes
    useEffect(() => {
        if (!modelName) {
            setTokenData(null);
            return;
        }
        initializeTokenizer(modelName);
    }, [modelName]);

    // Perform tokenization whenever text changes
    useEffect(() => {
        if (!modelName) {
            setTokenData(null);
            return;
        }

        const debounce = setTimeout(async () => {
            const tokens = await tokenizeText(text);
            setTokenData(tokens);
        }, 500);

        return () => clearTimeout(debounce);
    }, [text, modelName]);

    const {
        highlightedTokens,
        setHighlightedTokens,
        handleMouseDown,
        handleMouseUp,
        handleMouseMove,
        getGroupInformation,
    } = useTokenSelection({
        onTokenSelection,
    });

    // Add effect to highlight last token when showPredictions becomes true
    useEffect(() => {
        if (showPredictions && tokenData && highlightedTokens.length === 0) {
            const lastTokenIndex = tokenData.length - 1;

            // Should fix at some point, but basically an await
            const buffer = predictions[-1];
            if (lastTokenIndex >= 0) {
                setHighlightedTokens([lastTokenIndex]);
                setSelectedIdx(-1);
            }
        }
    }, [predictions]);

    const renderLoading = () => (
        <>
            <div className="text-sm text-muted-foreground">Loading Tokenizer...</div>
        </>
    );

    const renderError = () => <div className="text-red-500 text-sm">{error}</div>;

    const renderContent = () => {
        if (!tokenData) return null;

        return (
            <div
                className="max-h-40 overflow-y-auto custom-scrollbar select-none flex flex-wrap"
                ref={containerRef}
                onMouseDown={showPredictions ? undefined : handleMouseDown}
                onMouseUp={showPredictions ? undefined : handleMouseUp}
                onMouseMove={showPredictions ? undefined : handleMouseMove}
                onMouseLeave={showPredictions ? undefined : handleMouseUp}
            >
                {tokenData.map((token, i) => {
                    const { isHighlighted, isGroupStart, isGroupEnd } = getGroupInformation(
                        i,
                        tokenData
                    );
                    const highlightStyle = "bg-primary/30 border-primary/30";
                    const hoverStyle = "hover:bg-primary/30 hover:border-primary/30";
                    const filledStyle = "bg-primary/70";

                    const isFilled = filledTokens.some((t) => t.idx === i && t.target_id !== -1);

                    const styles = cn(
                        "text-sm whitespace-pre border select-none",
                        !isHighlighted && "rounded",
                        isHighlighted && isGroupStart && !isGroupEnd && "rounded-l !border-r-transparent",
                        isHighlighted && isGroupEnd && !isGroupStart && "rounded-r",
                        isHighlighted && isGroupStart && isGroupEnd && "rounded",
                        isHighlighted && !isGroupStart && !isGroupEnd && "rounded-none !border-r-transparent",
                        isHighlighted ? highlightStyle : "border-transparent",
                        isFilled ? filledStyle : "",
                        !showPredictions ? hoverStyle : "",
                        token.text === "\\n" ? "w-full" : "w-fit",
                        showPredictions && "cursor-pointer"
                    );

                    return (
                        <div
                            key={`token-${i}`}
                            data-token-id={i}
                            className={styles}
                            onClick={() => {
                                if (showPredictions) {
                                    setSelectedIdx(i);
                                }
                            }}
                        >
                            {token.text}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            {isLocalLoading || isTokenizerLoading
                ? renderLoading()
                : error
                ? renderError()
                : renderContent()}
        </>
    );
}
