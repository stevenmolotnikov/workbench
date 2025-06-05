import { useState, useRef, useEffect, useCallback } from 'react';
import { Connection } from '@/types/patching';

interface UseConnectionReturn {
    connections: Connection[];
    isDragging: boolean;
    currentConnection: Partial<Connection>;
    selectedEdgeIndex: number | null;
    svgRef: React.RefObject<SVGSVGElement>;
    handleBoxMouseDown: (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => void;
    handleBoxMouseUp: (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => void;
    handleEdgeSelect: (index: number) => void;
    handleBackgroundClick: () => void;
    removeConnection: (tokenIndex: number, counterIndex: number) => void;
    clearConnections: () => void;
}

// Utility functions
const isHighlighted = (tokenElement: HTMLElement) => 
    tokenElement.classList.contains('bg-primary/50');

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
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [currentConnection, setCurrentConnection] = useState<Partial<Connection>>({});
    const [selectedEdgeIndex, setSelectedEdgeIndex] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const clearConnections = () => setConnections([]);

    const removeConnection = (tokenIndex: number, counterIndex: number) => {
        setConnections(prev => prev.filter(conn => 
            !conn.start.tokenIndices.includes(tokenIndex) && conn.start.counterIndex !== counterIndex
        ));
    };

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

    const handleBoxMouseDown = (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => {
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

    const handleBoxMouseUp = (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => {
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
            setConnections(prev => [...prev, {
                start: currentConnection.start,
                end: endPoint
            } as Connection]);
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

    // Effects
    useEffect(() => {
        document.body.style.cursor = isDragging ? 'pointer' : 'default';
        return () => { document.body.style.cursor = 'default'; };
    }, [isDragging]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Backspace' && selectedEdgeIndex !== null) {
                setConnections(prev => prev.filter((_, i) => i !== selectedEdgeIndex));
                setSelectedEdgeIndex(null);
            }
        };

        const handleWindowMouseUp = (e: MouseEvent) => {
            if (!isDragging) return;
            
            const target = e.target as HTMLElement;
            const tokenElement = target.closest('[data-token-id]') as HTMLElement;
            
            if (!tokenElement || !isHighlighted(tokenElement)) {
                setIsDragging(false);
                setCurrentConnection({});
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mouseup', handleWindowMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [isDragging, selectedEdgeIndex, handleMouseMove]);

    const handleEdgeSelect = (index: number) => setSelectedEdgeIndex(index);
    const handleBackgroundClick = () => setSelectedEdgeIndex(null);

    return {
        connections,
        isDragging,
        currentConnection,
        selectedEdgeIndex,
        svgRef,
        handleBoxMouseDown,
        handleBoxMouseUp,
        handleEdgeSelect,
        handleBackgroundClick,
        removeConnection,
        clearConnections,
    };
}
