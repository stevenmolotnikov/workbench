"use client";

import { useState, useEffect, useRef } from "react";
import { PreTrainedTokenizer } from '@huggingface/transformers';
import { useTokenSelection } from "@/hooks/useTokenSelection";
import { TokenData, TokenizerOutput } from "@/types/tokenizer";
import { cn } from "@/lib/utils";

interface Prediction {
    str_indices: string[];
    indices: number[];
}

interface TokenAreaProps {
    text: string | { role: string; content: string }[] | null;
    isLoading?: boolean;
    prediction: Prediction;
    onTokenSelection?: (indices: number[]) => void;
}

// Use dynamic import for transformers.js to avoid build errors
let tokenizer: PreTrainedTokenizer | null = null;
let isTokenizerLoading = true;

export function TokenArea({ prediction, text, isLoading = false, onTokenSelection }: TokenAreaProps) {
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
                    if (typeof window !== 'undefined') {
                        const tokens = await tokenizer.tokenize(textToTokenize, { add_special_tokens: false });

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

    const { highlightedTokens, handleMouseDown, handleMouseUp, handleMouseMove, getGroupInformation } = useTokenSelection({
        onTokenSelection
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
        <div className="text-red-500 text-sm">
            {error}
        </div>
    );

    const renderContent = () => {
        if (!tokenData) return null;

        return (
            <div
                className="max-h-40 overflow-y-auto custom-scrollbar select-none flex flex-wrap"
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseUp}
            >
                {tokenData.tokens.map((token, i) => {
                    const fixedText = fixToken(token.text);
                    const { isHighlighted, isGroupStart, isGroupEnd } = getGroupInformation(i, tokenData);
                    const highlightStyle = 'bg-primary/50 border-primary/50';
                    const hoverStyle = 'hover:bg-primary/50 hover:border-primary/50';

                    const styles = cn(
                        'text-sm whitespace-pre border select-none',
                        !isHighlighted && 'rounded',
                        isHighlighted && isGroupStart && !isGroupEnd && 'rounded-l',
                        isHighlighted && isGroupEnd && !isGroupStart && 'rounded-r',
                        isHighlighted && isGroupStart && isGroupEnd && 'rounded',
                        isHighlighted && !isGroupStart && !isGroupEnd && 'rounded-none',
                        isHighlighted ? highlightStyle : 'border-transparent',
                        hoverStyle,
                        fixedText === '\\n' ? 'w-full' : 'w-fit'
                    );

                    return (
                        <div
                            key={`token-${i}`}
                            data-token-id={i}
                            className={styles}
                        >
                            {fixedText}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (

        <div className="flex flex-col h-full bg-card p-4 rounded-md border">
            {isLoading || isLocalLoading || isTokenizerLoading
                ? renderLoading()
                : error
                    ? renderError()
                    : renderContent()
            }
        </div>
    );
}