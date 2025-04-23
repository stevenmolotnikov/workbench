"use client";

import { useState, useEffect, useRef } from "react";
import { Separator } from "@/components/ui/separator";
import { Message } from "./workbench/conversation.types";

interface TokenCounterProps {
    text: string | Message[] | null;
    model: string;
    onTokenSelection?: (indices: number[]) => void;
}

interface TokenResponse {
    tokens: string[];
}

export function TokenCounter({ text, model, onTokenSelection }: TokenCounterProps) {
    const [tokenData, setTokenData] = useState<string[] | null>(null);
    const [highlightedTokens, setHighlightedTokens] = useState<number[]>([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [startToken, setStartToken] = useState<number | null>(null);

    const fetchTokenData = async (currentText: string | Message[] | null, model: string) => {
        // if (!currentText || (Array.isArray(currentText) && currentText.length === 0)) {
        //     setTokenData(null);
        //     setIsLoading(false);
        //     return;
        // }

        setIsLoading(true);
        try {
            const response = await fetch('https://cadentj--nnsight-backend-fastapi-app.modal.run/api/tokenize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: currentText, model: model }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const data: TokenResponse = await response.json();
            setTokenData(data.tokens);
        } catch (err) {
            console.error('Error fetching token data:', err);
            setTokenData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchTokenData(text, model);
        }, 500);

        return () => {
            clearTimeout(debounce);
        };
    }, [text, model]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsSelecting(true);
        const tokenId = getTokenIdFromEvent(e);
        if (tokenId !== null) {
            setStartToken(tokenId);
            setHighlightedTokens([tokenId]);
        }
    };

    const handleMouseUp = () => {
        setIsSelecting(false);
        if (onTokenSelection) {
            onTokenSelection(highlightedTokens.length > 0 ? highlightedTokens : [-1]);
        }
        setStartToken(null);
    };

    const getTokenIdFromEvent = (e: React.MouseEvent): number | null => {
        const target = e.target as HTMLElement;
        const tokenElement = target.closest('[data-token-id]');
        if (tokenElement) {
            return parseInt(tokenElement.getAttribute('data-token-id') || '0', 10);
        }
        return null;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isSelecting || startToken === null) return;

        const currentToken = getTokenIdFromEvent(e);
        if (currentToken === null) return;

        const start = Math.min(startToken, currentToken);
        const end = Math.max(startToken, currentToken);
        const newHighlightedTokens = Array.from({ length: end - start + 1 }, (_, i) => start + i);
        setHighlightedTokens(newHighlightedTokens);
    };

    const fixToken = (token: string) => {
        token = token.replace("Ġ", ' ');
        token = token.replace("<0x0A>", '\\n');
        token = token.replace("Ċ", '\\n');
        return token;
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <>
                    <div className="text-xs text-muted-foreground">
                        tokenizing...
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between text-xs">
                        <span>Token Count: ?</span>
                    </div>
                </>

            );
        }
        if (!tokenData) return null;

        return (
            <>
                <div
                    className="max-h-80 overflow-y-auto custom-scrollbar select-none"
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseUp}
                    style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                >
                    <div className="flex flex-wrap pt-1">
                        {tokenData.map((token, i) => {
                            const fixedText = fixToken(token);
                            const isHighlighted = highlightedTokens.includes(i);
                            const highlightStyle = 'bg-primary/50 border-primary/50';
                            const hoverStyle = 'hover:bg-primary/50 hover:border-primary/50';
                            const key = `token-${i}`;
                            const commonProps = {
                                'data-token-id': i,
                                style: { userSelect: 'none', WebkitUserSelect: 'none' } as React.CSSProperties,
                            };

                            if (fixedText === '\\n') {
                                return (
                                    <div
                                        key={key}
                                        {...commonProps}
                                        className={`text-xs w-full rounded whitespace-pre border select-none ${isHighlighted ? highlightStyle : 'border-transparent'
                                            } ${hoverStyle}`}
                                        style={{ ...commonProps.style, flexBasis: '100%' }}
                                    >
                                        {fixedText}
                                    </div>
                                );
                            } else {
                                return (
                                    <div
                                        key={key}
                                        {...commonProps}
                                        className={`text-xs w-fit rounded whitespace-pre border select-none ${isHighlighted ? highlightStyle : 'border-transparent'
                                            } ${hoverStyle}`}
                                    >
                                        {fixedText}
                                    </div>
                                );
                            }
                        })}
                    </div>
                </div>

                <Separator className="my-2" />

                <div className="flex items-center justify-between text-xs">
                    <span>Token Count: {tokenData.length}</span>
                    {highlightedTokens.length > 0 && (
                        <span className="text-xs  ml-1">
                            ({highlightedTokens.length} selected)
                        </span>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className=" p-4">
            {renderContent()}
        </div>
    );
}
