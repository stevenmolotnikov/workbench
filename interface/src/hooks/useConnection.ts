import { useState, useRef, useEffect, useCallback } from 'react';
import { Connection } from '@/types/patching';
import { usePatchingCompletions } from '@/stores/usePatchingCompletions';

interface UseConnectionReturn {
    connections: Connection[];
    isDragging: boolean;
    currentConnection: Partial<Connection>;
    selectedEdgeIndex: number | null;
    svgRef: React.RefObject<SVGSVGElement>;
    frozenTokens: { tokenId: number; counterId: number }[];
    ablatedTokens: { tokenId: number; counterId: number }[];
    handleTokenMouseDown: (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => void;
    handleTokenMouseUp: (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => void;
    handleFreezeTokenClick: (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => void;
    handleAblateTokenClick: (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => void;
    handleEdgeSelect: (index: number) => void;
    handleBackgroundClick: () => void;
    removeConnection: (tokenIndex: number, counterIndex: number) => void;
    clearConnections: () => void;
}

// Utility functions
const isHighlighted = (tokenElement: HTMLElement) => 
    tokenElement.classList.contains('bg-primary/30');

const getGroupTokenIndices = (groupId: number): number[] => {
    const groupTokens = Array.from(document.querySelectorAll(`[data-group-id="${groupId}"]`));
    return groupTokens
        .map(token => parseInt(token.getAttribute('data-token-id') || '-1'))
        .filter(idx => idx !== -1);
};

const calculateGroupCenter = (groupId: number, tokenElement: HTMLElement): number => {
    const groupTokens = Array.from(document.querySelectorAll(`[data-group-id="${groupId}"]`)) as HTMLElement[];
    if (groupTokens.length <= 1) {
        const rect = tokenElement.getBoundingClientRect();
        return rect.left + rect.width / 2;
    }

    // Group by line and find current line tokens
    const currentRect = tokenElement.getBoundingClientRect();
    const currentLineY = Math.round(currentRect.top);
    
    const currentLineTokens = groupTokens.filter(token => 
        Math.round(token.getBoundingClientRect().top) === currentLineY
    );

    // Calculate line bounds
    const bounds = currentLineTokens.reduce((acc, token) => {
        const rect = token.getBoundingClientRect();
        return {
            left: Math.min(acc.left, rect.left),
            right: Math.max(acc.right, rect.right)
        };
    }, { left: Infinity, right: -Infinity });

    return (bounds.left + bounds.right) / 2;
};

export function useConnection(): UseConnectionReturn {
    const { 
        connections, 
        addConnection, 
        removeConnection, 
        removeConnectionByIndex, 
        clearConnections,
        frozenTokens,
        ablatedTokens,
        addFrozenToken,
        removeFrozenToken,
        addAblatedToken,
        removeAblatedToken
    } = usePatchingCompletions();
    const [isDragging, setIsDragging] = useState(false);
    const [currentConnection, setCurrentConnection] = useState<Partial<Connection>>({});
    const [selectedEdgeIndex, setSelectedEdgeIndex] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const checkIfAlreadyConnected = useCallback((tokenIndices: number[]) => 
        connections.some(conn => 
            conn.start.tokenIndices.some(idx => tokenIndices.includes(idx)) || 
            conn.end.tokenIndices.some(idx => tokenIndices.includes(idx))
        ), [connections]);

    const getTokenData = (tokenElement: HTMLElement) => {
        const tokenIndex = parseInt(tokenElement.getAttribute('data-token-id') || '-1');
        const groupId = parseInt(tokenElement.getAttribute('data-group-id') || '-1');
        const tokenIndices = groupId !== -1 ? getGroupTokenIndices(groupId) : [tokenIndex];
        return { tokenIndex, groupId, tokenIndices };
    };

    const calculatePosition = (tokenElement: HTMLElement, groupId: number, isStart: boolean) => {
        const rect = tokenElement.getBoundingClientRect();
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return null;

        const x = groupId !== -1 ? calculateGroupCenter(groupId, tokenElement) : rect.left + rect.width / 2;
        const y = isStart ? rect.bottom - svgRect.top : rect.top - svgRect.top;
        
        return { x: x - svgRect.left, y };
    };

    const handleTokenMouseDown = (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => {
        const target = e.target as HTMLElement;
        const tokenElement = target.closest('[data-token-id]') as HTMLElement;
        if (!tokenElement || !isHighlighted(tokenElement)) return;

        const { tokenIndices, groupId } = getTokenData(tokenElement);
        if (checkIfAlreadyConnected(tokenIndices)) return;

        const position = calculatePosition(tokenElement, groupId, true);
        if (!position) return;

        setIsDragging(true);
        setCurrentConnection({
            start: { ...position, tokenIndices, counterIndex }
        });
    };

    const handleTokenMouseUp = (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => {
        if (!isDragging || !currentConnection.start) {
            setIsDragging(false);
            setCurrentConnection({});
            return;
        }

        const target = e.target as HTMLElement;
        const tokenElement = target.closest('[data-token-id]') as HTMLElement;
        
        if (!tokenElement || !isHighlighted(tokenElement) || 
            counterIndex === currentConnection.start.counterIndex) {
            setIsDragging(false);
            setCurrentConnection({});
            return;
        }

        const { tokenIndices, groupId } = getTokenData(tokenElement);
        if (checkIfAlreadyConnected(tokenIndices)) {
            setIsDragging(false);
            setCurrentConnection({});
            return;
        }

        const position = calculatePosition(tokenElement, groupId, false);
        if (position) {
            const endPoint = { ...position, tokenIndices, counterIndex };
            addConnection({
                start: currentConnection.start,
                end: endPoint
            } as Connection);
        }

        setIsDragging(false);
        setCurrentConnection({});
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !svgRef.current) return;
        
        const svgRect = svgRef.current.getBoundingClientRect();
        setCurrentConnection(prev => ({
            ...prev,
            end: {
                x: e.clientX - svgRect.left,
                y: e.clientY - svgRect.top,
                tokenIndices: [],
                counterIndex: -1
            }
        }));
    }, [isDragging]);

    // Change cursor while dragging
    useEffect(() => {
        document.body.style.cursor = isDragging ? 'pointer' : 'default';
        return () => { document.body.style.cursor = 'default'; };
    }, [isDragging]);

    // Handle keyboard events for connection deletion
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Backspace' && selectedEdgeIndex !== null) {
                removeConnectionByIndex(selectedEdgeIndex);
                setSelectedEdgeIndex(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedEdgeIndex, removeConnectionByIndex]);

    // Handle window mouse up for connection cancellation
    useEffect(() => {
        const handleWindowMouseUp = (e: MouseEvent) => {
            if (!isDragging) return;
            
            const target = e.target as HTMLElement;
            const tokenElement = target.closest('[data-token-id]') as HTMLElement;
            
            if (!tokenElement || !isHighlighted(tokenElement)) {
                setIsDragging(false);
                setCurrentConnection({});
            }
        };

        window.addEventListener('mouseup', handleWindowMouseUp);
        return () => window.removeEventListener('mouseup', handleWindowMouseUp);
    }, [isDragging]);

    // Handle mouse movement during dragging
    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [handleMouseMove]);

    const handleEdgeSelect = (index: number) => setSelectedEdgeIndex(index);
    const handleBackgroundClick = () => setSelectedEdgeIndex(null);

    const handleFreezeTokenClick = (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => {
        const target = e.target as HTMLElement;
        const tokenElement = target.closest('[data-token-id]') as HTMLElement;
        if (!tokenElement) return;

        const tokenId = parseInt(tokenElement.getAttribute('data-token-id') || '-1');
        if (tokenId === -1) return;

        // Check if already frozen and toggle
        const isAlreadyFrozen = frozenTokens.some(t => t.tokenId === tokenId && t.counterId === counterIndex);
        if (isAlreadyFrozen) {
            removeFrozenToken(tokenId, counterIndex);
        } else {
            addFrozenToken(tokenId, counterIndex);
        }
    };

    const handleAblateTokenClick = (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => {
        const target = e.target as HTMLElement;
        const tokenElement = target.closest('[data-token-id]') as HTMLElement;
        if (!tokenElement) return;

        const tokenId = parseInt(tokenElement.getAttribute('data-token-id') || '-1');
        if (tokenId === -1) return;

        // Check if already ablated and toggle
        const isAlreadyAblated = ablatedTokens.some(t => t.tokenId === tokenId && t.counterId === counterIndex);
        if (isAlreadyAblated) {
            removeAblatedToken(tokenId, counterIndex);
        } else {
            addAblatedToken(tokenId, counterIndex);
        }
    };

    return {
        connections,
        isDragging,
        currentConnection,
        selectedEdgeIndex,
        svgRef,
        frozenTokens,
        ablatedTokens,
        handleTokenMouseDown,
        handleTokenMouseUp,
        handleFreezeTokenClick,
        handleAblateTokenClick,
        handleEdgeSelect,
        handleBackgroundClick,
        removeConnection,
        clearConnections,
    };
}
