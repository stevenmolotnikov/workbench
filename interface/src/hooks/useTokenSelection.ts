import { useState } from 'react';

interface UseTokenSelectionProps {
    onTokenSelection?: (indices: number[]) => void;
}

export function useTokenSelection({ onTokenSelection }: UseTokenSelectionProps) {
    const [highlightedTokens, setHighlightedTokens] = useState<number[]>([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [startToken, setStartToken] = useState<number | null>(null);

    const getTokenIdFromEvent = (e: React.MouseEvent): number | null => {
        const target = e.target as HTMLElement;
        const tokenElement = target.closest('[data-token-id]');
        if (tokenElement) {
            return parseInt(tokenElement.getAttribute('data-token-id') || '0', 10);
        }
        return null;
    };

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

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isSelecting || startToken === null) return;

        const currentToken = getTokenIdFromEvent(e);
        if (currentToken === null) return;

        const start = Math.min(startToken, currentToken);
        const end = Math.max(startToken, currentToken);
        const newHighlightedTokens = Array.from({ length: end - start + 1 }, (_, i) => start + i);
        setHighlightedTokens(newHighlightedTokens);
    };

    return {
        highlightedTokens,
        handleMouseDown,
        handleMouseUp,
        handleMouseMove,
    };
} 