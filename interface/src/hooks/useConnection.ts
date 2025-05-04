import { useState, useRef, useEffect } from 'react';

interface Connection {
    start: { x: number; y: number };
    end: { x: number; y: number };
}

interface UseConnectionReturn {
    connections: Connection[];
    isDragging: boolean;
    currentConnection: Partial<Connection>;
    selectedEdgeIndex: number | null;
    svgRef: React.RefObject<SVGSVGElement>;
    handleBoxMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    handleBoxMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
    handleEdgeSelect: (index: number) => void;
    handleBackgroundClick: () => void;
}

export function useConnection(): UseConnectionReturn {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [currentConnection, setCurrentConnection] = useState<Partial<Connection>>({});
    const [selectedEdgeIndex, setSelectedEdgeIndex] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const handleBoxMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const svgRect = svgRef.current?.getBoundingClientRect();
        
        if (svgRect) {
            setIsDragging(true);
            setCurrentConnection({
                start: {
                    x: rect.left + rect.width / 2 - svgRect.left,
                    y: rect.top + rect.height / 2 - svgRect.top
                }
            });
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging && svgRef.current) {
            const svgRect = svgRef.current.getBoundingClientRect();
            setCurrentConnection(prev => ({
                ...prev,
                end: {
                    x: e.clientX - svgRect.left,
                    y: e.clientY - svgRect.top
                }
            }));
        }
    };

    const handleBoxMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging && currentConnection.start) {
            const rect = e.currentTarget.getBoundingClientRect();
            const svgRect = svgRef.current?.getBoundingClientRect();
            
            if (svgRect) {
                const endPoint = {
                    x: rect.left + rect.width / 2 - svgRect.left,
                    y: rect.top + rect.height / 2 - svgRect.top
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
    }, [isDragging, selectedEdgeIndex]);

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
