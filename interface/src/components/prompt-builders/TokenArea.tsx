"use client";

import { useRef, useEffect } from "react";
import { useTokenSelection } from "@/hooks/useTokenSelection";
import { TokenCompletion } from "@/types/lens";
import { cn } from "@/lib/utils";
import { TokenPredictions, Annotation } from "@/types/workspace";
import { Token } from "@/types/tokenizer";
import { useTutorialManager } from "@/hooks/useTutorialManager";
import { useAnnotations } from "@/stores/useAnnotations";

interface TokenAreaProps {
    completionId: string;
    showPredictions: boolean;
    predictions: TokenPredictions;
    onTokenSelection?: (indices: number[]) => void;
    setSelectedIdx: (idx: number) => void;
    filledTokens: TokenCompletion[];
    tokenData: Token[] | null;
    isTokenizing: boolean;
    isLoadingTokenizer: boolean;
    tokenError: string | null;
    setPredictionsEnabled: (enabled: boolean) => void;
}

export function TokenArea({
    completionId,
    showPredictions,
    onTokenSelection,
    setSelectedIdx,
    filledTokens,
    tokenData,
    isTokenizing,
    isLoadingTokenizer,
    tokenError,
    setPredictionsEnabled,
}: TokenAreaProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const {
        highlightedTokens,
        handleMouseDown,
        handleMouseUp,
        handleMouseMove,
        getGroupInformation,
    } = useTokenSelection({
        onTokenSelection,
    });

    const { 
        handleTokenHighlight,
        handleTokenClick 
    } = useTutorialManager();

    useEffect(() => {
        if (highlightedTokens.length > 0) {
            highlightedTokens.forEach(tokenIndex => {
                handleTokenHighlight(tokenIndex);
            });
        }
    }, [highlightedTokens, handleTokenHighlight]);

    useEffect(() => {
        if (highlightedTokens.length > 0) {
            setPredictionsEnabled(true);
        } else {
            setPredictionsEnabled(false);
        }
    }, [highlightedTokens, setPredictionsEnabled]);

    const { addPendingAnnotation, annotations, emphasizedAnnotation } = useAnnotations();

    const handleSetSelectedIdx = (idx: number) => {
        setSelectedIdx(idx);
        handleTokenClick(idx);
        const tokenAnnotation: Annotation = {
            id: completionId + "-" + idx,
            text: "",
        };
        addPendingAnnotation({ type: "token", data: tokenAnnotation });
    };

    const renderLoading = () => (
        <>
            <div className="text-sm text-muted-foreground">
                {isLoadingTokenizer ? "Loading tokenizer..." : "Tokenizing..."}
            </div>
        </>
    );

    const renderError = () => <div className="text-red-500 text-sm">{tokenError}</div>;

    const renderEmptyState = () => (
        <span className="text-sm text-muted-foreground">
            Tokenize to view tokens.
        </span>
    );

    const checkIsAnnotated = (idx: number) => {
        return annotations.some((annotation) => annotation.type === "token" && annotation.data.id === completionId + "-" + idx);
    };

    const checkIsEmphasized = (idx: number) => {
        return emphasizedAnnotation?.type === "token" && emphasizedAnnotation?.data.id === completionId + "-" + idx;
    };

    const renderContent = () => {
        if (!tokenData) return renderEmptyState();

        return (
            <div className="space-y-2">
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
                        const isAnnotated = checkIsAnnotated(i);
                        const isEmphasized = checkIsEmphasized(i);
                        const highlightStyle = "bg-primary/30 border-primary/30";
                        const hoverStyle = "hover:bg-primary/30 hover:border-primary/30";
                        const filledStyle = "bg-primary/70";

                        const isFilled = filledTokens.some((t) => t.idx === i && t.target_id !== -1);

                        const styles = cn(
                            "text-sm whitespace-pre border select-none",
                            !isHighlighted && "rounded",
                            isHighlighted && isGroupStart && !isGroupEnd && "rounded-l",
                            isHighlighted && isGroupEnd && !isGroupStart && "rounded-r",
                            isHighlighted && isGroupStart && isGroupEnd && "rounded",
                            isHighlighted && !isGroupStart && !isGroupEnd && "rounded-none",
                            isHighlighted ? highlightStyle : "border-transparent",
                            isAnnotated && "border-white",
                            isEmphasized && "border-yellow-500",
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
                                        handleSetSelectedIdx(i);
                                    }
                                }}
                            >
                                {token.text}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <>
            {(isTokenizing || isLoadingTokenizer)
                ? renderLoading()
                : tokenError
                ? renderError()
                : renderContent()}
        </>
    );
}

