import { useState } from 'react';
import { Token } from '@/types/tokenizer';
import { TokenCompletion } from '@/types/lens';

interface UseTokenSelectionProps {
    onTokenSelection?: (indices: number[]) => void;
    counterId?: number;
    onTokenUnhighlight?: (tokenIndex: number, counterIndex: number) => void;
    filledTokens?: TokenCompletion[];
}

export function useTokenSelection({ onTokenSelection, counterId = 0, onTokenUnhighlight, filledTokens = [] }: UseTokenSelectionProps) {
    // Get highlighted tokens from the completion object instead of local state
    const highlightedTokens = filledTokens.filter(token => token.highlighted && token.idx >= 0).map(token => token.idx);
    
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

    const getGroupInformation = (i: number, tokenData: Token[]) => {
        const isHighlighted = highlightedTokens.includes(i);
        const isPrevHighlighted = i > 0 && highlightedTokens.includes(i - 1);
        const isNextHighlighted = i < tokenData.length - 1 && highlightedTokens.includes(i + 1);
        
        // Determine if this token is part of a group
        const isGroupStart = isHighlighted && !isPrevHighlighted;
        const isGroupEnd = isHighlighted && !isNextHighlighted;
        
        // Calculate group ID
        let groupId = -1;
        if (isHighlighted) {
            if (isGroupStart) {
                // Find the end of this group
                let groupEnd = i;
                while (groupEnd < tokenData.length - 1 && highlightedTokens.includes(groupEnd + 1)) {
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
        // Instead of managing local state, call onTokenSelection to update the completion object
        const remainingTokens = highlightedTokens.filter(id => !tokens.includes(id));
        if (onTokenSelection) {
            onTokenSelection(remainingTokens.length > 0 ? remainingTokens : [-1]);
        }
        
        // Call onTokenUnhighlight for each unhighlighted token
        if (onTokenUnhighlight) {
            tokens.forEach(tokenIndex => {
                onTokenUnhighlight(tokenIndex, counterId);
            });
        }
    }

    const highlightTokens = (tokens: number[]) => {
        if (onTokenSelection) {
            onTokenSelection(tokens.length > 0 ? tokens : [-1]);
        }
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsSelecting(true);
        const tokenId = getTokenIdFromEvent(e);
        if (tokenId !== null) {
            if (highlightedTokens.includes(tokenId)) {
                // Unhighlight this specific token
                unhighlightTokens([tokenId]);
            } else {
                // If Ctrl/Cmd is pressed, add to existing selection
                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                    setStartToken(tokenId);
                    highlightTokens([...highlightedTokens, tokenId]);
                } else {
                    // Start new selection (this will clear previous highlights)
                    setStartToken(tokenId);
                    highlightTokens([tokenId]);
                }
            }
        }
    };

    const handleMouseUp = () => {
        setIsSelecting(false);
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
            highlightTokens([...highlightedTokens, ...newHighlightedTokens]);
        } else {
            highlightTokens(newHighlightedTokens);
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