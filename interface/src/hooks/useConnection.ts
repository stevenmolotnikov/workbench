import { useState, useRef, useEffect, useCallback } from 'react';
import { Connection } from '@/types/activation-patching';

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
}

export function useConnection(): UseConnectionReturn {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [currentConnection, setCurrentConnection] = useState<Partial<Connection>>({});
    const [selectedEdgeIndex, setSelectedEdgeIndex] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const isHighlighted = (tokenElement: HTMLElement) => {
        return tokenElement.classList.contains('bg-primary/50');
    }

    const handleBoxMouseDown = (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => {
        const target = e.target as HTMLElement;
        // Closest moves up parent elements until it finds a [data-token-id] element
        const tokenElement = target.closest('[data-token-id]');
        if (!tokenElement) return;

        // Check if the token is highlighted
        if (!isHighlighted(tokenElement)) return;

        const tokenIndex = parseInt(tokenElement.getAttribute('data-token-id') || '-1');
        if (tokenIndex === -1) return;

        const rect = tokenElement.getBoundingClientRect();
        const svgRect = svgRef.current?.getBoundingClientRect();
        
        if (svgRect) {
            setIsDragging(true);
            setCurrentConnection({
                start: {
                    x: rect.left + rect.width / 2 - svgRect.left,
                    y: rect.top + rect.height / 2 - svgRect.top,
                    tokenIndex,
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
                    tokenIndex: -1, // Will be set on mouse up
                    counterIndex: -1 // Will be set on mouse up
                }
            }));
        }
    }, [isDragging]);

    const handleBoxMouseUp = (e: React.MouseEvent<HTMLDivElement>, counterIndex: number) => {
        if (isDragging && currentConnection.start) {
            const target = e.target as HTMLElement;
            const tokenElement = target.closest('[data-token-id]');
            if (!tokenElement) {
                setIsDragging(false);
                setCurrentConnection({});
                return;
            }

            if (!isHighlighted(tokenElement)) {
                setIsDragging(false);
                setCurrentConnection({});
                return;
            }

            const tokenIndex = parseInt(tokenElement.getAttribute('data-token-id') || '-1');
            if (tokenIndex === -1) {
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
                const endPoint = {
                    x: rect.left + rect.width / 2 - svgRect.left,
                    y: rect.top + rect.height / 2 - svgRect.top,
                    tokenIndex,
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

        window.addEventListener('keydown', handleKeyDown);
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('keydown', handleKeyDown);
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
    };
}
