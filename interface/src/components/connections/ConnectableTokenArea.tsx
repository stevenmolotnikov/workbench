"use client";

import { useState, useEffect, useRef } from "react";

import { PreTrainedTokenizer } from '@huggingface/transformers';
import { useTokenSelection } from "@/hooks/useTokenSelection";
import { TokenData, TokenizerOutput } from "@/types/tokenizer";
import { cn } from "@/lib/utils";

interface ConnectableTokenAreaProps {
    text: string | { role: string; content: string }[] | null;
    model: string;
    isConnecting?: boolean;
    connectionMouseDown?: (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => void;
    connectionMouseUp?: (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => void;
    counterId?: number;
    onTokenUnhighlight?: (tokenIndex: number, counterIndex: number) => void;
}

let tokenizer: PreTrainedTokenizer | null = null;
let isTokenizerLoading = true;

export function ConnectableTokenArea({ text, model, isConnecting, connectionMouseDown, connectionMouseUp, counterId, onTokenUnhighlight }: ConnectableTokenAreaProps) {
    const [tokenData, setTokenData] = useState<TokenData | null>(null);
    const [isLocalLoading, setIsLocalLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load tokenizer once (when component mounts)
    useEffect(() => {
        async function initializeTokenizer() {
            try {
                if (typeof window === 'undefined') return;
                tokenizer = await PreTrainedTokenizer.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct");
                isTokenizerLoading = false;
            } catch (err) {
                console.error('Error initializing tokenizer:', err);
                setError('Failed to initialize tokenizer');
            }
        }

        if (!tokenizer) {
            initializeTokenizer();
        }
    }, []);

    // Perform tokenization whenever text changes
    useEffect(() => {
        let isMounted = true;

        async function performTokenization() {
            if (!tokenizer) return;

            try {
                setIsLocalLoading(true);
                setError(null);

                let textToTokenize: TokenizerOutput | null = null;
                if (Array.isArray(text)) {
                    // If text is an array of message objects, apply chat template
                    textToTokenize = await tokenizer.apply_chat_template(text, { tokenize: false });
                } else {
                    textToTokenize = text;
                }

                if (textToTokenize && typeof textToTokenize === 'string' && textToTokenize.trim()) {
                    // Process in browser only
                    if (typeof window !== 'undefined') {
                        const tokens = await tokenizer.tokenize(textToTokenize, { add_special_tokens: false });

                        console.log('tokens', tokens);

                        if (!isMounted) return;

                        setTokenData({
                            count: tokens.length,
                            tokens: tokens.map((token: string, index: number) => ({
                                id: index,
                                text: token
                            }))
                        });
                    }
                } else {
                    setTokenData({
                        count: 0,
                        tokens: []
                    });
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Error tokenizing text:', err);
                    setError('Failed to tokenize text');
                }
            } finally {
                if (isMounted) {
                    setIsLocalLoading(false);
                }
            }
        }

        // Debounce tokenization to avoid excessive processing
        const debounce = setTimeout(() => {
            performTokenization();
        }, 500);

        return () => {
            isMounted = false;
            clearTimeout(debounce);
        };
    }, [text]);

    const { handleMouseDown, handleMouseUp, handleMouseMove, getGroupInformation } = useTokenSelection({
        counterId,
        onTokenUnhighlight: (tokenIndex, counterIndex) => {
            if (onTokenUnhighlight) {
                onTokenUnhighlight(tokenIndex, counterIndex);
            }
        }
    });

    const fixToken = (token: string) => {
        token = token.replace("Ġ", ' ');
        token = token.replace("<0x0A>", '\\n');
        token = token.replace("Ċ", '\\n');
        return token;
    }

    const renderLoading = () => (
        <>
            <div className="text-sm text-muted-foreground">
                Loading Tokenizer...
            </div>
        </>
    );

    const renderError = () => (
        <div className="text-red-500 text-xs">
            {error}
        </div>
    );

    const renderContent = () => {
        if (!tokenData) return null;

        return (
            <>
                <div
                    className="max-h-40 overflow-y-auto custom-scrollbar select-none flex flex-wrap"
                    ref={containerRef}
                    onMouseDown={isConnecting ? (e) => connectionMouseDown?.(e, 0) : handleMouseDown}
                    onMouseUp={isConnecting ? (e) => connectionMouseUp?.(e, 0) : handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseUp}
                >
                    {tokenData.tokens.map((token, i) => {
                        const fixedText = fixToken(token.text);
                        const { isHighlighted, groupId, isGroupStart, isGroupEnd } = getGroupInformation(i, tokenData);
                            
                        const highlightStyle = 'bg-primary/50 border-primary/50';
                        const hoverStyle = 'hover:bg-primary/50 hover:border-primary/50 cursor-text';

                        const styles = cn(
                            'text-sm whitespace-pre border select-none',
                            (isHighlighted && isConnecting) && 'cursor-grab',
                            !isHighlighted && 'rounded',
                            isHighlighted && isGroupStart && !isGroupEnd && 'rounded-l',
                            isHighlighted && isGroupEnd && !isGroupStart && 'rounded-r',
                            isHighlighted && isGroupStart && isGroupEnd && 'rounded',
                            isHighlighted && !isGroupStart && !isGroupEnd && 'rounded-none',
                            isHighlighted ? highlightStyle : 'border-transparent',
                            isConnecting ? '' : hoverStyle,
                            (fixedText === '\\n') ? 'w-full' : 'w-fit'
                        )
                        const commonProps = {
                            'data-token-id': i,
                            'data-group-id': groupId,
                        };

                        return (
                            <div
                                key={`token-${i}`}
                                {...commonProps}
                                className={styles}
                            >
                                {fixedText}
                            </div>
                        );
                    })}
                </div>
            </>
        );
    };

    return (
        <div className="p-4 h-full border bg-card border-dashed rounded">
            {isLocalLoading || isTokenizerLoading
                ? renderLoading()
                : error
                    ? renderError()
                    : renderContent()
            }
        </div>
    );
}

