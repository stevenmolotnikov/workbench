"use client";

import { useRef, useEffect } from "react";
import { useTokenSelection } from "@/hooks/useTokenSelection";
import { TokenCompletion } from "@/types/lens";
import { cn } from "@/lib/utils";
import { Annotation } from "@/types/workspace";
import { Token } from "@/types/tokenizer";
import { useTutorialManager } from "@/hooks/useTutorialManager";
import { useAnnotations } from "@/stores/useAnnotations";

interface TokenAreaProps {
    completionId: string;
    showPredictions: boolean;
    onTokenSelection?: (indices: number[]) => void;
    setSelectedIdx: (idx: number) => void;
    filledTokens: TokenCompletion[];
    tokenData: Token[] | null;
    isTokenizing: boolean;
    isLoadingTokenizer: boolean;
    tokenError: string | null;
    setPredictionsEnabled: (enabled: boolean) => void;
}

// Token styling constants
const TOKEN_STYLES = {
    base: "text-sm whitespace-pre border select-none",
    highlight: "bg-primary/30 border-primary/30",
    filled: "bg-primary/70 border-primary/70",
    hover: "hover:bg-primary/30 hover:border-primary/30",
    annotated: "border-white",
    emphasized: "border-yellow-500",
    transparent: "border-transparent",
    clickable: "cursor-pointer",
} as const;

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
        filledTokens,
    });

    const { handleTokenHighlight, handleTokenClick } = useTutorialManager();
    const { addPendingAnnotation, annotations, emphasizedAnnotation } = useAnnotations();

    // Handle tutorial highlighting
    useEffect(() => {
        if (highlightedTokens.length > 0) {
            highlightedTokens.forEach(tokenIndex => {
                handleTokenHighlight(tokenIndex);
            });
        }
    }, [highlightedTokens, handleTokenHighlight]);

    // Enable/disable predictions based on token state
    useEffect(() => {
        const hasHighlightedTokens = highlightedTokens.length > 0;
        const hasTargetCompletions = filledTokens.some(token => token.target_id >= 0);
        
        setPredictionsEnabled(hasHighlightedTokens || hasTargetCompletions);
    }, [highlightedTokens, filledTokens, setPredictionsEnabled]);

    const handleTokenSelection = (idx: number) => {
        setSelectedIdx(idx);
        handleTokenClick(idx);
        
        const tokenAnnotation: Annotation = {
            id: `${completionId}-${idx}`,
            text: "",
        };
        addPendingAnnotation({ type: "token", data: tokenAnnotation });
    };

    const getTokenState = (idx: number) => {
        const isFilled = filledTokens.some(t => t.idx === idx && t.target_id !== -1);
        const isAnnotated = annotations.some(
            annotation => annotation.type === "token" && 
            annotation.data.id === `${completionId}-${idx}`
        );
        const isEmphasized = emphasizedAnnotation?.type === "token" && 
            emphasizedAnnotation?.data.id === `${completionId}-${idx}`;

        return { isFilled, isAnnotated, isEmphasized };
    };

    const getTokenStyles = (
        token: Token,
        idx: number,
        isHighlighted: boolean,
        isGroupStart: boolean,
        isGroupEnd: boolean
    ) => {
        const { isFilled, isAnnotated, isEmphasized } = getTokenState(idx);

        // Determine background and border based on priority: filled > highlighted > default
        let backgroundStyle = "";
        if (isHighlighted && !isFilled) {
            backgroundStyle = TOKEN_STYLES.highlight;
        } else if (isFilled) {
            backgroundStyle = TOKEN_STYLES.filled;
        } else {
            backgroundStyle = TOKEN_STYLES.transparent;
        }

        // Determine border radius based on grouping
        let borderRadius = "";
        if (isHighlighted) {
            if (isGroupStart && isGroupEnd) borderRadius = "rounded";
            else if (isGroupStart) borderRadius = "rounded-l";
            else if (isGroupEnd) borderRadius = "rounded-r";
            else borderRadius = "rounded-none";
        } else {
            borderRadius = "rounded";
        }

        return cn(
            TOKEN_STYLES.base,
            borderRadius,
            backgroundStyle,
            isAnnotated && TOKEN_STYLES.annotated,
            isEmphasized && TOKEN_STYLES.emphasized,
            !showPredictions && TOKEN_STYLES.hover,
            token.text === "\\n" ? "w-full" : "w-fit",
            showPredictions && TOKEN_STYLES.clickable
        );
    };

    const renderLoadingState = () => (
        <div className="text-sm text-muted-foreground">
            {isLoadingTokenizer ? "Loading tokenizer..." : "Tokenizing..."}
        </div>
    );

    const renderEmptyState = () => (
        <span className="text-sm text-muted-foreground">
            Tokenize to view tokens.
        </span>
    );

    const fix = (text: string) => {
        const result = text
            .replace(/\r\n/g, '\\r\\n')  // Windows line endings
            .replace(/\n/g, '\\n')       // Newlines
            .replace(/\r/g, '\\r')       // Carriage returns
            .replace(/\t/g, '\\t')       // Tabs

        return result;
    }


    const renderTokens = () => {
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
                    {tokenData.map((token, idx) => {
                        const { isHighlighted, isGroupStart, isGroupEnd } = getGroupInformation(
                            idx,
                            tokenData
                        );
                        
                        const styles = getTokenStyles(
                            token,
                            idx,
                            isHighlighted,
                            isGroupStart,
                            isGroupEnd
                        );

                        const fixedText = fix(token.text);

                        return (
                            <div
                                key={`token-${idx}`}
                                data-token-id={idx}
                                className={styles}
                                onClick={() => showPredictions && handleTokenSelection(idx)}
                            >
                                {fixedText}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Main render logic
    if (isTokenizing || isLoadingTokenizer) return renderLoadingState();
    return renderTokens();
}

