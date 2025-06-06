"use client";

import { useRef } from "react";
import { LensCompletion } from "@/types/lens";
import { cn } from "@/lib/utils";
import { Token } from "@/types/tokenizer";
import { useTutorialManager } from "@/hooks/useTutorialManager";
import { useAnnotations } from "@/stores/useAnnotations";
import { useTokenSelection } from "@/hooks/useTokenSelection";

interface TokenAreaProps {
    compl: LensCompletion;
    showPredictions: boolean;
    setSelectedIdx: (idx: number) => void;
    tokenData: Token[] | null;
    tokenSelection: ReturnType<typeof useTokenSelection>;
}

// Token styling constants
const TOKEN_STYLES = {
    base: "text-sm whitespace-pre select-none !box-border relative",
    highlight: "bg-primary/30 after:absolute after:inset-0 after:border after:border-primary/30",
    filled: "bg-primary/70 after:absolute after:inset-0 after:border after:border-primary/30",
    hover: "",
    annotated: "bg-white after:absolute after:inset-0 after:border after:border-primary/30",
    emphasized: "bg-yellow-500 after:absolute after:inset-0 after:border after:border-primary/30",
    transparent: "bg-transparent",
} as const;

export function TokenArea({
    compl,
    showPredictions,
    setSelectedIdx,
    tokenData,
    tokenSelection,
}: TokenAreaProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    
    const { handleTokenClick } = useTutorialManager();
    const { annotations, emphasizedAnnotation, addPendingAnnotation } = useAnnotations();

    const { 
        getGroupInformation,
        handleMouseDown,
        handleMouseUp,
        handleMouseMove,
    } = tokenSelection;

    const handleTokenSelection = (idx: number) => {
        setSelectedIdx(idx);
        handleTokenClick(idx);
        
        const tokenAnnotation = {
            id: `${compl.id}-${idx}`,
            text: "",
        };
        addPendingAnnotation({ type: "token", data: tokenAnnotation });
    };


    const getTokenState = (idx: number) => {
        const isFilled = compl.tokens.some(t => t.idx === idx && t.target_id !== -1);
        const isAnnotated = annotations.some(
            annotation => annotation.type === "token" && 
            annotation.data.id === `${compl.id}-${idx}`
        );
        const isEmphasized = emphasizedAnnotation?.type === "token" && 
            emphasizedAnnotation?.data.id === `${compl.id}-${idx}`;

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
            if (isGroupStart && isGroupEnd) borderRadius = "rounded after:rounded";
            else if (isGroupStart) borderRadius = "rounded-l after:rounded-l";
            else if (isGroupEnd) borderRadius = "rounded-r after:rounded-r";
            else borderRadius = "rounded-none after:rounded-none";
        } else {
            borderRadius = "rounded after:rounded";
        }

        return cn(
            TOKEN_STYLES.base,
            borderRadius,
            backgroundStyle,
            isAnnotated && TOKEN_STYLES.annotated,
            isEmphasized && TOKEN_STYLES.emphasized,
            !showPredictions && TOKEN_STYLES.hover,
            token.text === "\\n" ? "w-full" : "w-fit",
            (showPredictions && isHighlighted) && "cursor-pointer",
            !showPredictions && "cursor-text"
        );
    };

    const renderEmptyState = () => (
        <span className="text-sm text-muted-foreground">
            Tokenize to view tokens.
        </span>
    );

    const fix = (text: string) => {
        const numNewlines = (text.match(/\n/g) || []).length;

        const result = text
            .replace(/\r\n/g, '\\r\\n')  // Windows line endings
            .replace(/\n/g, '\\n')       // Newlines
            .replace(/\r/g, '\\r')       // Carriage returns
            .replace(/\t/g, '\\t')       // Tabs

        return {
            result: result,
            numNewlines: numNewlines,
        }
    }

    const renderTokens = () => {
        if (!tokenData) return renderEmptyState();

        return (
            <div className="space-y-2">
                <div
                    className="max-h-40 overflow-y-auto custom-scrollbar select-none whitespace-pre-wrap"
                    style={{ display: "inline" }}
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

                        const { result, numNewlines } = fix(token.text);

                        return (
                            <span key={`token-${idx}`}>
                                <span
                                    
                                    data-token-id={idx}
                                    className={styles}
                                    onClick={() => showPredictions && handleTokenSelection(idx)}
                                >
                                    {result}
                                </span>
                                {numNewlines > 0 && "\n".repeat(numNewlines)}
                            </span>
                        );
                    })}
                </div>
            </div>
        );
    };

    return renderTokens();
}

