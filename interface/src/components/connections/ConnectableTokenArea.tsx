"use client";

import { useRef } from "react";
import { useTokenSelection } from "@/hooks/useTokenSelection";
import { Token } from "@/types/tokenizer";
import { cn } from "@/lib/utils";
import { PatchingTokenCompletion } from "@/types/patching";

interface ConnectableTokenAreaProps {
    text: string | { role: string; content: string }[] | null;
    tokenData?: Token[] | null;
    model?: string;
    isConnecting?: boolean;
    connectionMouseDown?: (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => void;
    connectionMouseUp?: (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => void;
    counterId: number;
    onTokenUnhighlight?: (tokenIndex: number, counterIndex: number) => void;
    isTokenizing?: boolean;
    tokenError?: string | null;
    onTokenSelection?: (indices: number[]) => void;
    filledTokens?: PatchingTokenCompletion[];
}

// Token styling constants
const TOKEN_STYLES = {
    base: "text-sm whitespace-pre border select-none",
    highlight: "bg-primary/50 border-primary/50",
    hover: "hover:bg-primary/30 hover:border-primary/30",
    transparent: "border-transparent",
    clickable: "cursor-pointer",
} as const;

// Utility functions
const fixToken = (token: string): string => 
    token
        .replace("Ġ", ' ')
        .replace("<0x0A>", '\\n')
        .replace("Ċ", '\\n')
        .replace(/\r\n/g, '\\r\\n')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');

const getTokenStyles = (
    isHighlighted: boolean, 
    isGroupStart: boolean, 
    isGroupEnd: boolean, 
    isConnecting: boolean,
    fixedText: string
) => cn(
    TOKEN_STYLES.base,
    !isHighlighted && 'rounded',
    isHighlighted && isGroupStart && !isGroupEnd && 'rounded-l',
    isHighlighted && isGroupEnd && !isGroupStart && 'rounded-r',
    isHighlighted && isGroupStart && isGroupEnd && 'rounded',
    isHighlighted && !isGroupStart && !isGroupEnd && 'rounded-none',
    isHighlighted ? TOKEN_STYLES.highlight : TOKEN_STYLES.transparent,
    !isConnecting && TOKEN_STYLES.hover,
    isHighlighted && isConnecting && TOKEN_STYLES.clickable,
    fixedText === '\\n' ? 'w-full' : 'w-fit'
);

const renderStateMessage = (message: string, isError = false) => (
    <div className={cn("text-sm", isError ? "text-red-500" : "text-muted-foreground")}>
        {message}
    </div>
);

export function ConnectableTokenArea({ 
    text, 
    tokenData, 
    isConnecting, 
    connectionMouseDown, 
    connectionMouseUp, 
    counterId, 
    onTokenUnhighlight,
    isTokenizing = false,
    tokenError = null,
    onTokenSelection,
    filledTokens = []
}: ConnectableTokenAreaProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Convert PatchingTokenCompletion to TokenCompletion format for useTokenSelection
    const convertedFilledTokens = filledTokens.map(token => ({
        ...token,
        target_id: -1,
        target_text: "",
    }));

    const { handleMouseDown, handleMouseUp, handleMouseMove, getGroupInformation } = useTokenSelection({
        counterId,
        onTokenUnhighlight: onTokenUnhighlight || (() => {}),
        filledTokens: convertedFilledTokens,
        onTokenSelection
    });

    const mouseDownHandler = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isConnecting) {
            connectionMouseDown?.(e, counterId);
        } else {
            handleMouseDown(e);
        }
    };

    // Early returns for different states
    if (isTokenizing) return renderStateMessage("Tokenizing...");
    if (tokenError) return renderStateMessage(tokenError, true);
    if (!tokenData || tokenData.length === 0) {
        return renderStateMessage("Click tokenize button to view tokens.");
    }

    return (
        <div
            className="max-h-40 overflow-y-auto custom-scrollbar select-none flex flex-wrap"
            ref={containerRef}
            onMouseDown={mouseDownHandler}
            onMouseUp={isConnecting ? (e) => connectionMouseUp?.(e, counterId) : handleMouseUp}
            onMouseMove={isConnecting ? undefined : handleMouseMove}
            onMouseLeave={isConnecting ? undefined : handleMouseUp}
        >
            {tokenData.map((token, i) => {
                const fixedText = fixToken(token.text);
                const { isHighlighted, groupId, isGroupStart, isGroupEnd } = getGroupInformation(i, tokenData);
                
                return (
                    <div
                        key={`token-${i}`}
                        data-token-id={i}
                        data-group-id={groupId}
                        className={getTokenStyles(isHighlighted, isGroupStart, isGroupEnd, !!isConnecting, fixedText)}
                    >
                        {fixedText}
                    </div>
                );
            })}
        </div>
    );
}

