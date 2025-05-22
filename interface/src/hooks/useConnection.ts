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

export function useConnection(): UseConnectionReturn {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [currentConnection, setCurrentConnection] = useState<Partial<Connection>>({});
    const [selectedEdgeIndex, setSelectedEdgeIndex] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Add effect to change cursor style when dragging
    useEffect(() => {
        if (isDragging) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
        
        return () => {
            document.body.style.cursor = 'default';
        };
    }, [isDragging]);

    const clearConnections = () => {
        setConnections([]);
    }

    const isHighlighted = (tokenElement: HTMLElement) => {
        return tokenElement.classList.contains('bg-primary/50');
    }

    const removeConnection = (tokenIndex: number, counterIndex: number) => {
        setConnections(prev => prev.filter(conn => 
            !conn.start.tokenIndices.includes(tokenIndex) && conn.start.counterIndex !== counterIndex
        ));
    }

    const calculateGroupCenter = (groupId: number, tokenElement: HTMLElement) => {
        // Find all tokens in the group
        const groupTokens = Array.from(document.querySelectorAll(`[data-group-id="${groupId}"]`));
        if (groupTokens.length <= 1) {
            return tokenElement.getBoundingClientRect().left + tokenElement.getBoundingClientRect().width / 2;
        }

        // Group tokens by their vertical position (line)
        const lineGroups = new Map<number, HTMLElement[]>();
        groupTokens.forEach(token => {
            const rect = token.getBoundingClientRect();
            // Round to nearest pixel to account for small floating point differences
            const lineY = Math.round(rect.top);
            if (!lineGroups.has(lineY)) {
                lineGroups.set(lineY, []);
            }
            lineGroups.get(lineY)!.push(token as HTMLElement);
        });

        // Find the line that contains our current token
        const currentRect = tokenElement.getBoundingClientRect();
        const currentLineY = Math.round(currentRect.top);
        const currentLineTokens = lineGroups.get(currentLineY) || [];

        // Calculate center for the current line
        const lineBounds = currentLineTokens.reduce((bounds, token) => {
            const tokenRect = token.getBoundingClientRect();
            return {
                left: Math.min(bounds.left, tokenRect.left),
                right: Math.max(bounds.right, tokenRect.right)
            };
        }, { left: Infinity, right: -Infinity });

        return (lineBounds.left + lineBounds.right) / 2;
    };

    const checkIfAlreadyConnected = (tokenIndices: number[]) => {
        return connections.some(conn => 
            conn.start.tokenIndices.some(idx => tokenIndices.includes(idx)) || 
            conn.end.tokenIndices.some(idx => tokenIndices.includes(idx))
        );
    }

    const getGroupTokenIndices = (groupId: number): number[] => {
        const groupTokens = Array.from(document.querySelectorAll(`[data-group-id="${groupId}"]`));
        return groupTokens.map(token => parseInt(token.getAttribute('data-token-id') || '-1')).filter(idx => idx !== -1);
    }

    const handleBoxMouseDown = (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => {
        const target = e.target as HTMLElement;
        const tokenElement = target.closest('[data-token-id]') as HTMLElement;
        if (!tokenElement) return;

        // Check if the token is highlighted
        if (!isHighlighted(tokenElement)) return;

        const tokenIndex = parseInt(tokenElement.getAttribute('data-token-id') || '-1');
        const groupId = parseInt(tokenElement.getAttribute('data-group-id') || '-1');
        if (tokenIndex === -1) return;

        // Get all token indices in the group
        const tokenIndices = groupId !== -1 ? getGroupTokenIndices(groupId) : [tokenIndex];

        // Don't connect if has already been connected
        if (checkIfAlreadyConnected(tokenIndices)) {
            console.log("already connected");
            return;
        };

        const rect = tokenElement.getBoundingClientRect();
        const svgRect = svgRef.current?.getBoundingClientRect();

        if (svgRect) {
            setIsDragging(true);
            
            // Calculate x position based on group or single token
            const x = groupId !== -1 ? 
                calculateGroupCenter(groupId, tokenElement) : 
                rect.left + rect.width / 2;

            setCurrentConnection({
                start: {
                    x: x - svgRect.left,
                    y: rect.bottom - svgRect.top,
                    tokenIndices,
                    counterIndex
                }
            });
        }
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging && svgRef.current) {
            const svgRect = svgRef.current.getBoundingClientRect();
            setCurrentConnection(prev => ({
                ...prev,
                end: {
                    x: e.clientX - svgRect.left,
                    y: e.clientY - svgRect.top,
                    tokenIndices: [], // Will be set on mouse up
                    counterIndex: -1 // Will be set on mouse up
                }
            }));
        }
    }, [isDragging]);

    const handleBoxMouseUp = (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => {
        if (isDragging && currentConnection.start) {
            const target = e.target as HTMLElement;
            const tokenElement = target.closest('[data-token-id]') as HTMLElement;

            console.log("up")
            
            // Only connect to token elements
            if (!tokenElement) {
                setIsDragging(false);
                setCurrentConnection({});
                return;
            }
            
            // Don't connect to unhighlighted tokens
            if (!isHighlighted(tokenElement)) {
                setIsDragging(false);
                setCurrentConnection({});
                return;
            }

            const tokenIndex = parseInt(tokenElement.getAttribute('data-token-id') || '-1');
            const groupId = parseInt(tokenElement.getAttribute('data-group-id') || '-1');
            
            // Get all token indices in the group
            const tokenIndices = groupId !== -1 ? getGroupTokenIndices(groupId) : [tokenIndex];

            // Don't connect if it has already been connected
            if (checkIfAlreadyConnected(tokenIndices)) {
                setIsDragging(false);
                setCurrentConnection({});
                return;
            }

            // Prevent connecting to the same counter
            if (counterIndex === currentConnection.start.counterIndex) {
                setIsDragging(false);
                setCurrentConnection({});
                return;
            }

            const rect = tokenElement.getBoundingClientRect();
            const svgRect = svgRef.current?.getBoundingClientRect();

            if (svgRect) {
                // Calculate x position based on group or single token
                const x = groupId !== -1 ? 
                    calculateGroupCenter(groupId, tokenElement) : 
                    rect.left + rect.width / 2;

                // Use the top of the token for the second counter
                const endPoint = {
                    x: x - svgRect.left,
                    y: rect.top - svgRect.top,
                    tokenIndices,
                    counterIndex
                };

                setConnections(prev => [...prev, {
                    start: currentConnection.start,
                    end: endPoint
                } as Connection]);
            }
        }
        setIsDragging(false);
        setCurrentConnection({});
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Backspace' && selectedEdgeIndex !== null) {
                setConnections(prev => prev.filter((_, i) => i !== selectedEdgeIndex));
                setSelectedEdgeIndex(null);
            }
        };

        const handleWindowMouseUp = (e: MouseEvent) => {
            if (isDragging) {
                // Only clear if we're not over a valid token
                const target = e.target as HTMLElement;
                const tokenElement = target.closest('[data-token-id]') as HTMLElement;
                
                if (!tokenElement || !isHighlighted(tokenElement)) {
                    setIsDragging(false);
                    setCurrentConnection({});
                }
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

    const handleEdgeSelect = (index: number) => {
        setSelectedEdgeIndex(index);
    };

    const handleBackgroundClick = () => {
        setSelectedEdgeIndex(null);
    };

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
