import { useState } from 'react';
import { TokenData } from '@/types/tokenizer';

interface UseTokenSelectionProps {
    onTokenSelection?: (indices: number[]) => void;
    counterId?: number;
    onTokenUnhighlight?: (tokenIndex: number, counterIndex: number) => void;
}

export function useTokenSelection({ onTokenSelection, counterId, onTokenUnhighlight }: UseTokenSelectionProps) {
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

    const getGroupInformation = (i: number, tokenData: TokenData) => {
        const isHighlighted = highlightedTokens.includes(i);
        const isPrevHighlighted = i > 0 && highlightedTokens.includes(i - 1);
        const isNextHighlighted = i < tokenData.tokens.length - 1 && highlightedTokens.includes(i + 1);
        
        // Determine if this token is part of a group
        const isGroupStart = isHighlighted && !isPrevHighlighted;
        const isGroupEnd = isHighlighted && !isNextHighlighted;
        
        // Calculate group ID
        let groupId = -1;
        if (isHighlighted) {
            if (isGroupStart) {
                // Find the end of this group
                let groupEnd = i;
                while (groupEnd < tokenData.tokens.length - 1 && highlightedTokens.includes(groupEnd + 1)) {
                    groupEnd++;
                }
                groupId = i; // Use start index as group ID
            } else {
                // Find the start of this group
                let groupStart = i;
                while (groupStart > 0 && highlightedTokens.includes(groupStart - 1)) {
                    groupStart--;
                }
                groupId = groupStart;
            }
        }

        return {
            isHighlighted,
            groupId,
            isGroupStart,
            isGroupEnd
        }
    }

    const unhighlightTokens = (tokens: number[]) => {
        setHighlightedTokens([...highlightedTokens.filter(id => !tokens.includes(id))]);
        // Call onTokenUnhighlight for each unhighlighted token
        if (onTokenUnhighlight) {
            tokens.forEach(tokenIndex => {
                onTokenUnhighlight(tokenIndex, counterId);
            });
        }
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsSelecting(true);
        const tokenId = getTokenIdFromEvent(e);
        if (tokenId !== null) {
            if (highlightedTokens.includes(tokenId)) {
                unhighlightTokens([tokenId]);
            } else {
                // If Ctrl/Cmd is pressed, add to existing selection
                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                    setStartToken(tokenId);
                    setHighlightedTokens([...highlightedTokens, tokenId]);
                } else {
                    // Start new selection
                    unhighlightTokens(highlightedTokens);
                    setStartToken(tokenId);
                    setHighlightedTokens([tokenId]);
                }
            }
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
        
        // If Ctrl/Cmd is pressed, add to existing selection
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
            setHighlightedTokens([...highlightedTokens, ...newHighlightedTokens]);
        } else {
            setHighlightedTokens(newHighlightedTokens);
        }
    };

    return {
        highlightedTokens,
        handleMouseDown,
        handleMouseUp,
        handleMouseMove,
        counterId,
        getGroupInformation
    };
} 