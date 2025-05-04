"use client";

import { useState, useEffect, useRef } from "react";

import { PreTrainedTokenizer, Tensor } from '@huggingface/transformers';
import { useTokenSelection } from "@/hooks/useTokenSelection";
import { Conversation } from "../workbench/conversation.types";

import { useConnection } from '../../hooks/useConnection';
import { Edges } from './Edge';
import { Button } from "../ui/button";

interface TokenCounterProps {
    text: string | { role: string; content: string }[] | null;
    model: string;
    onTokenSelection?: (indices: number[]) => void;
    isConnecting?: boolean;
    connectionMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
    connectionMouseUp?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

interface TokenData {
    count: number;
    tokens: { id: number, text: string }[];
}

type BatchEncoding = {
    input_ids: number[] | number[][] | Tensor;
    attention_mask: number[] | number[][] | Tensor;
    token_type_ids?: number[] | number[][] | Tensor;
}

type TokenizerOutput =
    | string
    | Tensor
    | number[]
    | number[][]
    | BatchEncoding;

// Use dynamic import for transformers.js to avoid build errors
let tokenizer: PreTrainedTokenizer | null = null;
let isTokenizerLoading = true;

function TokenCounter({ text, model, onTokenSelection, isConnecting, connectionMouseDown, connectionMouseUp }: TokenCounterProps) {
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

    const { highlightedTokens, handleMouseDown, handleMouseUp, handleMouseMove } = useTokenSelection({
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
            <div className="text-xs text-muted-foreground">
                loading...
            </div>
        </>
    );

    const renderError = () => (
        <div className="text-red-500 p-4">
            {error}
        </div>
    );

    const renderContent = () => {
        if (!tokenData) return null;

        return (
            <>
                <div
                    className="max-h-40 overflow-y-auto custom-scrollbar select-none"
                    ref={containerRef}
                    onMouseDown={isConnecting ? connectionMouseDown : handleMouseDown}
                    onMouseUp={isConnecting ? connectionMouseUp : handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseUp}
                    style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                >
                    <div className="flex flex-wrap">
                        {tokenData.tokens.map((token, i) => {
                            const fixedText = fixToken(token.text);
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
            </>
        );
    };

    return (
        <div className="p-4 border rounded">
            {isLocalLoading || isTokenizerLoading
                ? renderLoading()
                : error
                    ? renderError()
                    : renderContent()
            }
        </div>
    );
}


interface ConnectableTokenCounterProps {
    convOne: Conversation;
    convTwo: Conversation;
    onTokenSelectionOne?: (indices: number[]) => void;
    onTokenSelectionTwo?: (indices: number[]) => void;
}

export function ConnectableTokenCounter({ convOne, convTwo, onTokenSelectionOne, onTokenSelectionTwo }: ConnectableTokenCounterProps) {

    const [isConnecting, setIsConnecting] = useState(false);
    const {
        connections,
        isDragging,
        currentConnection,
        selectedEdgeIndex,
        svgRef,
        handleBoxMouseDown,
        handleBoxMouseUp,
        handleEdgeSelect,
        handleBackgroundClick,
    } = useConnection();


    return (
        <div className="relative">
            <div className="absolute inset-0 pointer-events-none">
                <Edges
                    connections={connections}
                    isDragging={isDragging}
                    currentConnection={currentConnection}
                    svgRef={svgRef}
                    onEdgeSelect={handleEdgeSelect}
                    selectedEdgeIndex={selectedEdgeIndex}
                />
            </div>

            <div className="flex flex-col p-4 gap-4">
                <TokenCounter
                    text={convOne.prompt}
                    model={convOne.model}
                    onTokenSelection={onTokenSelectionOne}
                    isConnecting={isConnecting}
                    connectionMouseDown={handleBoxMouseDown}
                    connectionMouseUp={handleBoxMouseUp}
                />
                <TokenCounter
                    text={convTwo.prompt}
                    model={convTwo.model}
                    onTokenSelection={onTokenSelectionTwo}
                    isConnecting={isConnecting}
                    connectionMouseDown={handleBoxMouseDown}
                    connectionMouseUp={handleBoxMouseUp}
                />
            </div>
            <Button
                onClick={() => setIsConnecting(!isConnecting)}
            >
                {isConnecting ? 'Disconnect' : 'Connect'}
            </Button>
        </div>
    )
}