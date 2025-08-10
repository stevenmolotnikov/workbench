"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Token } from "@/types/tokenizer";
import { cn } from "@/lib/utils";
import { useConnections } from "@/stores/useConnections";
import { usePatchingTokens } from "@/stores/usePatchingTokens";
import type { Connection } from "@/types/patching";

interface ConnectableTokenAreaProps {
    model?: string;
    isConnecting?: boolean;
    counterId: number;
    tokenizerLoading?: boolean;
    svgRef: React.RefObject<SVGSVGElement>;
}

// Token styling constants
const TOKEN_STYLES = {
    base: "text-sm whitespace-pre select-none !box-border relative",
    highlight: "bg-primary/30 after:absolute after:inset-0 after:border after:border-primary/30",
    indicator: "bg-primary/20 after:absolute after:inset-0 after:border after:border-primary/30",
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

// Utility functions
const isHighlighted = (tokenElement: HTMLElement) =>
    tokenElement.classList.contains('bg-primary/30');

const getGroupTokenIndices = (groupId: string | number): number[] => {
    const groupTokens = Array.from(document.querySelectorAll(`[data-group-id="${groupId}"]`));
    return groupTokens
        .map(token => Number.parseInt(token.getAttribute('data-token-id') || '-1'))
        .filter(idx => idx !== -1);
};

const calculateGroupCenter = (groupId: string | number, tokenElement: HTMLElement): number => {
    const groupTokens = Array.from(document.querySelectorAll(`[data-group-id="${groupId}"]`)) as HTMLElement[];
    if (groupTokens.length <= 1) {
        const rect = tokenElement.getBoundingClientRect();
        return rect.left + rect.width / 2;
    }

    // Group by line and find current line tokens
    const currentRect = tokenElement.getBoundingClientRect();
    const currentLineY = Math.round(currentRect.top);

    const currentLineTokens = groupTokens.filter(token =>
        Math.round(token.getBoundingClientRect().top) === currentLineY
    );

    // Calculate line bounds
    const bounds = currentLineTokens.reduce((acc, token) => {
        const rect = token.getBoundingClientRect();
        return {
            left: Math.min(acc.left, rect.left),
            right: Math.max(acc.right, rect.right)
        };
    }, { left: Number.POSITIVE_INFINITY, right: Number.NEGATIVE_INFINITY });

    return (bounds.left + bounds.right) / 2;
};


export function ConnectableTokenArea({
    isConnecting,
    svgRef,
    counterId,
    tokenizerLoading,
}: ConnectableTokenAreaProps) {
    const { connections, isDragging, currentConnection, setIsDragging, setCurrentConnection, addConnection, removeConnection } = useConnections();
    const { 
        sourceTokenData,
        destinationTokenData,
        highlightedSourceTokens, 
        highlightedDestinationTokens, 
        setHighlightedSourceTokens, 
        setHighlightedDestinationTokens,
        setHoveredTokenIdx,
        hoveredTokenIdx
    } = usePatchingTokens();

    const tokenData = counterId === 0 ? sourceTokenData : destinationTokenData;

    // Get the appropriate highlighted tokens based on counterId
    const highlightedTokens = counterId === 0 ? highlightedSourceTokens : highlightedDestinationTokens;
    const setHighlightedTokens = counterId === 0 ? setHighlightedSourceTokens : setHighlightedDestinationTokens;

    const checkIfAlreadyConnected = useCallback((tokenIndices: number[]) =>
        connections.some((conn: Connection) =>
            conn.start.tokenIndices.some((idx: number) => tokenIndices.includes(idx)) ||
            conn.end.tokenIndices.some((idx: number) => tokenIndices.includes(idx))
        ), [connections]);

    const getTokenData = (tokenElement: HTMLElement) => {
        const tokenIndex = Number.parseInt(tokenElement.getAttribute('data-token-id') || '-1');
        const groupIdAttr = tokenElement.getAttribute('data-group-id') || '-1';
        const groupId = groupIdAttr === '-1' ? -1 : groupIdAttr;
        const tokenIndices = groupId !== -1 ? getGroupTokenIndices(groupId) : [tokenIndex];
        return { groupId, tokenIndices };
    };


    const calculatePosition = (tokenElement: HTMLElement, groupId: string | number, isStart: boolean) => {
        const rect = tokenElement.getBoundingClientRect();
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return null;

        const x = groupId !== -1 ? calculateGroupCenter(groupId, tokenElement) : rect.left + rect.width / 2;
        const y = isStart ? rect.bottom - svgRect.top : rect.top - svgRect.top;

        return { x: x - svgRect.left, y };
    };


    const handleTokenMouseDown = (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => {
        const target = e.target as HTMLElement;
        const tokenElement = target.closest('[data-token-id]') as HTMLElement;
        if (!tokenElement || !isHighlighted(tokenElement)) return;

        const { groupId, tokenIndices } = getTokenData(tokenElement);
        if (checkIfAlreadyConnected(tokenIndices)) return;

        const position = calculatePosition(tokenElement, groupId, true);
        if (!position) return;

        setIsDragging(true);
        setCurrentConnection({
            start: { ...position, tokenIndices, counterIndex }
        });
    };

    const handleTokenMouseUp = (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => {
        if (!isDragging || !currentConnection.start) {
            setIsDragging(false);
            setCurrentConnection({});
            return;
        }

        const target = e.target as HTMLElement;
        const tokenElement = target.closest('[data-token-id]') as HTMLElement;

        if (!tokenElement || !isHighlighted(tokenElement) ||
            counterIndex === currentConnection.start.counterIndex) {
            setIsDragging(false);
            setCurrentConnection({});
            return;
        }

        const { groupId, tokenIndices } = getTokenData(tokenElement);

        if (checkIfAlreadyConnected(tokenIndices)) {
            setIsDragging(false);
            setCurrentConnection({});
            return;
        }

        const position = calculatePosition(tokenElement, groupId, false);
        if (position) {
            const endPoint = { ...position, tokenIndices, counterIndex };
            addConnection({
                start: currentConnection.start,
                end: endPoint
            } as Connection);
        }

        setIsDragging(false);
        setCurrentConnection({});
    };

    const containerRef = useRef<HTMLDivElement>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [startToken, setStartToken] = useState<number | null>(null);

    // Token selection utilities
    const getTokenIdFromEvent = (e: React.MouseEvent): number | null => {
        const target = e.target as HTMLElement;
        const tokenElement = target.closest("[data-token-id]");
        if (tokenElement) {
            return Number.parseInt(tokenElement.getAttribute("data-token-id") || "0", 10);
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

        const groupIdString = `${counterId}-${groupId}`;

        return { isHighlighted, groupIdString, isGroupStart, isGroupEnd };
    };

    const getTokenStyles = (
        token: Token,
        tokenIndex: number,
        isHighlighted: boolean,
        isGroupStart: boolean,
        isGroupEnd: boolean,
    ) => {
        const { result: fixedText } = fixToken(token.text);

        // Determine background and border based on highlighted state
        let backgroundStyle: string;
        if (isHighlighted) {
            backgroundStyle = TOKEN_STYLES.highlight;
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

        const interactionStyles = !isConnecting ? TOKEN_STYLES.hover : "";
        const cursorStyle = (isConnecting) && (isHighlighted) ? "cursor-pointer" : "";

        return cn(
            TOKEN_STYLES.base,
            borderRadius,
            backgroundStyle,
            !isHighlighted && interactionStyles,
            cursorStyle,
            ((tokenIndex === hoveredTokenIdx) && !isConnecting) ? TOKEN_STYLES.indicator : "",
            fixedText === "\\n" ? "w-full" : "w-fit"
        );
    };

    // Mouse event handlers
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;

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

    const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        // Always update hover state on mouse move
        const tokenId = getTokenIdFromEvent(e);
        if (tokenId !== null && tokenId !== hoveredTokenIdx) {
            setHoveredTokenIdx(tokenId);
        }

        // Handle token selection dragging
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

    const handleContainerMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        // Don't end drag operation when mouse leaves during connection dragging
        if (isConnecting && isDragging) {
            return;
        }

        // For normal token selection, end the selection
        handleMouseUp(e);
        
        setHoveredTokenIdx(null);
    };

    // Early returns for different states
    if (tokenizerLoading) return <div className="text-sm">Tokenizing...</div>;
    if (!tokenData || tokenData.length === 0) {
        return <div className="text-sm text-muted-foreground italic">No tokens to display.</div>;
    }

    return (
        <div
            className="max-h-40 overflow-y-auto custom-scrollbar select-none whitespace-pre-wrap"
            style={{ display: "inline" }}
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleContainerMouseMove}
            onMouseLeave={handleContainerMouseLeave}
        >
            {tokenData.map((token, i) => {
                const { isHighlighted, groupIdString, isGroupStart, isGroupEnd } = getGroupInformation(
                    i,
                    tokenData
                );
                const styles = getTokenStyles(token, i, isHighlighted, isGroupStart, isGroupEnd);
                const { result, numNewlines } = fixToken(token.text);

                return (
                    <span key={`token-${i}`}>
                        <span
                            data-token-id={i}
                            data-group-id={groupIdString}
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