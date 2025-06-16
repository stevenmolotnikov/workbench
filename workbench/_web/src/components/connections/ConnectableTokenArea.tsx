"use client";

import { useRef, useState } from "react";
import { Token } from "@/types/tokenizer";
import { cn } from "@/lib/utils";
import { useConnection } from "@/hooks/useConnection";

interface ConnectableTokenAreaProps {
    tokenData?: Token[] | null;
    model?: string;
    isConnecting?: boolean;
    isFreezingTokens?: boolean;
    isAblatingTokens?: boolean;
    useConnections: ReturnType<typeof useConnection>;
    counterId: number;
    tokenizerLoading?: boolean;
}

// Token styling constants
const TOKEN_STYLES = {
    base: "text-sm whitespace-pre select-none !box-border relative",
    highlight: "bg-primary/30 after:absolute after:inset-0 after:border after:border-primary/30",
    hover: "hover:bg-primary/20 hover:after:absolute hover:after:inset-0 hover:after:border hover:after:border-primary/30",
    transparent: "bg-transparent",
} as const;

// Utility functions
const fixToken = (token: string): { result: string; numNewlines: number } => {
    const numNewlines = (token.match(/\n/g) || []).length;

    const result = token
        .replace("Ġ", " ")
        .replace("<0x0A>", "\\n")
        .replace("Ċ", "\\n")
        .replace(/\r\n/g, "\\r\\n")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");

    return { result, numNewlines };
};

export function ConnectableTokenArea({
    tokenData,
    isConnecting,
    isFreezingTokens,
    isAblatingTokens,
    useConnections,
    counterId,
    tokenizerLoading,
}: ConnectableTokenAreaProps) {
    const { 
        handleTokenMouseDown, 
        handleTokenMouseUp, 
        handleFreezeTokenClick,
        handleAblateTokenClick,
        removeConnection, 
        isDragging,
        frozenTokens,
        ablatedTokens
    } = useConnections;
    const containerRef = useRef<HTMLDivElement>(null);
    const [highlightedTokens, setHighlightedTokens] = useState<number[]>([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [startToken, setStartToken] = useState<number | null>(null);

    // Token selection utilities
    const getTokenIdFromEvent = (e: React.MouseEvent): number | null => {
        const target = e.target as HTMLElement;
        const tokenElement = target.closest("[data-token-id]");
        if (tokenElement) {
            return parseInt(tokenElement.getAttribute("data-token-id") || "0", 10);
        }
        return null;
    };

    const getGroupInformation = (i: number, tokenData: Token[]) => {
        const isHighlighted = highlightedTokens.includes(i);
        const isPrevHighlighted = i > 0 && highlightedTokens.includes(i - 1);
        const isNextHighlighted = i < tokenData.length - 1 && highlightedTokens.includes(i + 1);

        const isGroupStart = isHighlighted && !isPrevHighlighted;
        const isGroupEnd = isHighlighted && !isNextHighlighted;

        let groupId = -1;
        if (isHighlighted) {
            if (isGroupStart) {
                groupId = i;
            } else {
                let groupStart = i;
                while (groupStart > 0 && highlightedTokens.includes(groupStart - 1)) {
                    groupStart--;
                }
                groupId = groupStart;
            }
        }

        return { isHighlighted, groupId, isGroupStart, isGroupEnd };
    };

    const getTokenStyles = (
        token: Token,
        isHighlighted: boolean,
        isGroupStart: boolean,
        isGroupEnd: boolean,
        tokenIndex: number
    ) => {
        const { result: fixedText } = fixToken(token.text);

        // Check if token is frozen or ablated
        const isFrozen = frozenTokens.some(t => t.tokenId === tokenIndex && t.counterId === counterId);
        const isAblated = ablatedTokens.some(t => t.tokenId === tokenIndex && t.counterId === counterId);

        // Determine background and border based on highlighted state
        let backgroundStyle: string;
        if (isAblated) {
            backgroundStyle = "bg-red-500/30 after:absolute after:inset-0 after:border after:border-red-500/30";
        } else if (isHighlighted) {
            backgroundStyle = TOKEN_STYLES.highlight;
        } else {
            backgroundStyle = TOKEN_STYLES.transparent;
        }

        // Determine border radius based on grouping
        let borderRadius = "";
        if (isHighlighted || isAblated) {
            if (isGroupStart && isGroupEnd) borderRadius = "rounded after:rounded";
            else if (isGroupStart) borderRadius = "rounded-l after:rounded-l";
            else if (isGroupEnd) borderRadius = "rounded-r after:rounded-r";
            else borderRadius = "rounded-none after:rounded-none";
        } else {
            borderRadius = "rounded after:rounded";
        }

        const interactionStyles = !isConnecting && !isFreezingTokens && !isAblatingTokens ? TOKEN_STYLES.hover : "";
        const cursorStyle = (isConnecting || isFreezingTokens || isAblatingTokens) && (isHighlighted || isAblated || isFrozen) ? "cursor-pointer" : "";

        return cn(
            TOKEN_STYLES.base,
            borderRadius,
            backgroundStyle,
            interactionStyles,
            cursorStyle,
            fixedText === "\\n" ? "w-full" : "w-fit"
        );
    };

    // Mouse event handlers
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;

        if (isFreezingTokens) {
            handleFreezeTokenClick(e, counterId);
            return;
        }

        if (isAblatingTokens) {
            handleAblateTokenClick(e, counterId);
            return;
        }

        if (isConnecting) {
            handleTokenMouseDown(e, counterId);
            return;
        }

        setIsSelecting(true);
        const tokenId = getTokenIdFromEvent(e);

        if (tokenId !== null) {
            if (highlightedTokens.includes(tokenId)) {
                const newHighlighted = highlightedTokens.filter((id) => id !== tokenId);
                setHighlightedTokens(newHighlighted);
                removeConnection(tokenId, counterId);
            } else {
                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                    setStartToken(tokenId);
                    const newHighlighted = [...highlightedTokens, tokenId];
                    setHighlightedTokens(newHighlighted);
                } else {
                    setStartToken(tokenId);
                    setHighlightedTokens([tokenId]);
                }
            }
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isConnecting) {
            handleTokenMouseUp(e, counterId);
            return;
        }

        setIsSelecting(false);
        setStartToken(null);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        // Don't end drag operation when mouse leaves during connection dragging
        if (isConnecting && isDragging) {
            return;
        }
        
        // For normal token selection, end the selection
        handleMouseUp(e);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isConnecting || !isSelecting || startToken === null) return;

        const currentToken = getTokenIdFromEvent(e);
        if (currentToken === null) return;

        const start = Math.min(startToken, currentToken);
        const end = Math.max(startToken, currentToken);
        const newHighlightedTokens = Array.from({ length: end - start + 1 }, (_, i) => start + i);

        if (e.ctrlKey || e.metaKey || e.shiftKey) {
            const combined = [...highlightedTokens, ...newHighlightedTokens];
            const unique = [...new Set(combined)];
            setHighlightedTokens(unique);
        } else {
            setHighlightedTokens(newHighlightedTokens);
        }
    };

    // Early returns for different states
    if (tokenizerLoading) return <div className="text-sm">Tokenizing...</div>;
    if (!tokenData || tokenData.length === 0) {
        return <div className="text-sm">Click tokenize button to view tokens.</div>;
    }

    return (
        <div
            className="max-h-40 overflow-y-auto custom-scrollbar select-none whitespace-pre-wrap"
            style={{ display: "inline" }}
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {tokenData.map((token, i) => {
                const { isHighlighted, groupId, isGroupStart, isGroupEnd } = getGroupInformation(
                    i,
                    tokenData
                );
                const styles = getTokenStyles(token, isHighlighted, isGroupStart, isGroupEnd, i);
                const { result, numNewlines } = fixToken(token.text);

                return (
                    <span key={`token-${i}`}>
                        <span
                            data-token-id={i}
                            data-group-id={groupId}
                            className={styles}
                        >
                            {result}
                        </span>
                        {numNewlines > 0 && "\n".repeat(numNewlines)}
                    </span>
                );
            })}
        </div>
    );
}
