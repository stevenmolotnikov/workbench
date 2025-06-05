import { useState } from 'react';
import { Token } from '@/types/tokenizer';
import { PatchingCompletion } from '@/types/patching';

interface UseTokenizationReturn {
    sourceTokenData: Token[] | null;
    destinationTokenData: Token[] | null;
    isTokenizing: boolean;
    tokenError: string | null;
    handleTokenize: (modelName: string, source: PatchingCompletion, destination: PatchingCompletion) => Promise<void>;
    updateTokens: (
        sourceTokens: Token[] | null, 
        destinationTokens: Token[] | null,
        setSource: (comp: PatchingCompletion) => void,
        setDestination: (comp: PatchingCompletion) => void,
        source: PatchingCompletion,
        destination: PatchingCompletion
    ) => void;
}

export function useTokenization(): UseTokenizationReturn {
    const [sourceTokenData, setSourceTokenData] = useState<Token[] | null>(null);
    const [destinationTokenData, setDestinationTokenData] = useState<Token[] | null>(null);
    const [isTokenizing, setIsTokenizing] = useState(false);
    const [tokenError, setTokenError] = useState<string | null>(null);

    const updateTokens = (
        sourceTokens: Token[] | null, 
        destinationTokens: Token[] | null,
        setSource: (comp: PatchingCompletion) => void,
        setDestination: (comp: PatchingCompletion) => void,
        source: PatchingCompletion,
        destination: PatchingCompletion
    ) => {
        if (sourceTokens) {
            setSource({
                ...source,
                tokens: sourceTokens.map((_, idx) => ({ idx, highlighted: false }))
            });
        }
        if (destinationTokens) {
            setDestination({
                ...destination,
                tokens: destinationTokens.map((_, idx) => ({ idx, highlighted: false }))
            });
        }
    };

    const handleTokenize = async (
        modelName: string, 
        source: PatchingCompletion, 
        destination: PatchingCompletion
    ) => {
        if (!modelName) {
            setTokenError("No model selected");
            return;
        }

        if (!source.prompt && !destination.prompt) {
            setTokenError("No text to tokenize");
            return;
        }

        setIsTokenizing(true);
        setTokenError(null);

        try {
            const { tokenizeText } = await import("@/components/prompt-builders/tokenize");
            
            const [sourceTokens, destinationTokens] = await Promise.all([
                source.prompt ? tokenizeText(source.prompt, modelName) : Promise.resolve(null),
                destination.prompt ? tokenizeText(destination.prompt, modelName) : Promise.resolve(null)
            ]);
            
            setSourceTokenData(sourceTokens);
            setDestinationTokenData(destinationTokens);
        } catch (error) {
            console.error('Error tokenizing text:', error);
            setTokenError(error instanceof Error ? error.message : "Failed to tokenize text");
        } finally {
            setIsTokenizing(false);
        }
    };

    return {
        sourceTokenData,
        destinationTokenData,
        isTokenizing,
        tokenError,
        handleTokenize,
        updateTokens
    };
} 