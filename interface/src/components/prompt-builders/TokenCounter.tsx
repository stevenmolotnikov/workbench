"use client";

import { useState, useEffect, useRef } from "react";
import { Separator } from "@/components/ui/separator";
import { Message } from "../workbench/conversation.types";
import config from "@/lib/config";
import { useTokenSelection } from "@/hooks/useTokenSelection";

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
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const { highlightedTokens, handleMouseDown, handleMouseUp, handleMouseMove } = useTokenSelection({
        onTokenSelection
    });

    const fetchTokenData = async (currentText: string | Message[] | null, model: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(config.getApiUrl(config.endpoints.tokenize), {
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
                                        className={`text-xs w-full rounded whitespace-pre border select-none ${isHighlighted ? highlightStyle : 'border-transparent'} ${hoverStyle}`}
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
                                        className={`text-xs w-fit rounded whitespace-pre border select-none ${isHighlighted ? highlightStyle : 'border-transparent'} ${hoverStyle}`}
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
                        <span className="text-xs ml-1">
                            ({highlightedTokens.length} selected)
                        </span>
                    )}
                </div>
            </>
        );
    };

    return (
        <div className="p-4">
            {renderContent()}
        </div>
    );
}
