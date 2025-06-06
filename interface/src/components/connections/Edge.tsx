import { Connection } from "@/types/patching";
import { useConnection } from "@/hooks/useConnection";

interface EdgeProps {
    useConnections: ReturnType<typeof useConnection>;
}

function createStepPath(start: { x: number; y: number }, end: { x: number; y: number }): string {
    // Calculate the midpoint for the vertical-horizontal-vertical pattern
    const midY = (start.y + end.y) / 2;
    
    // Create control points that encourage vertical-horizontal-vertical movement
    const controlPoint1 = { x: start.x, y: midY };
    const controlPoint2 = { x: end.x, y: midY };
    
    // Create a cubic Bezier curve path that follows vertical-horizontal-vertical pattern
    return `M ${start.x} ${start.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${end.x} ${end.y}`;
}

function createSelfLoopPath(center: { x: number; y: number }): string {
    const radius = 15;
    const loopHeight = 25;
    
    // Create a loop that goes up and curves back to itself
    const startX = center.x;
    const startY = center.y;
    const topY = startY - loopHeight;
    
    // Create a circular loop path using cubic bezier curves
    const controlOffset = radius * 0.552; // Magic number for circular bezier curves
    
    return `M ${startX} ${startY} 
            L ${startX} ${topY + radius}
            C ${startX} ${topY + radius - controlOffset}, ${startX + controlOffset} ${topY}, ${startX + radius} ${topY}
            C ${startX + radius + controlOffset} ${topY}, ${startX + 2 * radius} ${topY + radius - controlOffset}, ${startX + 2 * radius} ${topY + radius}
            C ${startX + 2 * radius} ${topY + radius + controlOffset}, ${startX + radius + controlOffset} ${topY + 2 * radius}, ${startX + radius} ${topY + 2 * radius}
            C ${startX + controlOffset} ${topY + 2 * radius}, ${startX} ${topY + radius + controlOffset}, ${startX} ${topY + radius}
            L ${startX} ${startY}`;
}

export function Edges({ useConnections }: EdgeProps) {
    const { connections, isDragging, currentConnection, svgRef, handleEdgeSelect, selectedEdgeIndex, frozenTokens } = useConnections;

    // Function to get token position for frozen tokens
    const getTokenPosition = (tokenId: number, counterId: number): { x: number; y: number } | null => {
        const tokenElement = document.querySelector(`[data-token-id="${tokenId}"]`) as HTMLElement;
        if (!tokenElement || !svgRef.current) return null;

        const rect = tokenElement.getBoundingClientRect();
        const svgRect = svgRef.current.getBoundingClientRect();
        
        return {
            x: rect.left + rect.width / 2 - svgRect.left,
            y: rect.top - svgRect.top
        };
    };

    return (
        <svg
            ref={svgRef}
            className="w-full h-full absolute"
        >
            {/* Define arrow marker */}
            <defs>
                <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                >
                    <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#3b82f6"
                    />
                </marker>
            </defs>

            {/* Regular connections */}
            {connections.map((conn, i) => (
                <g key={i}>
                    {/* Clickable area (invisible) */}
                    <path
                        d={createStepPath(conn.start, conn.end)}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="8"
                        className="cursor-pointer"
                        pointerEvents="auto"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEdgeSelect(i);
                        }}
                    />
                    {/* Visible stroke */}
                    <path
                        d={createStepPath(conn.start, conn.end)}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth={selectedEdgeIndex === i ? "2" : "1"}
                        markerEnd="url(#arrowhead)"
                    />
                </g>
            ))}

            {/* Self-loops for frozen tokens */}
            {frozenTokens.map((frozenToken, i) => {
                const position = getTokenPosition(frozenToken.tokenId, frozenToken.counterId);
                if (!position) return null;
                
                return (
                    <g key={`frozen-${frozenToken.tokenId}-${frozenToken.counterId}`}>
                        {/* Visible self-loop */}
                        <path
                            d={createSelfLoopPath(position)}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="1"
                            markerEnd="url(#arrowhead)"
                        />
                    </g>
                );
            })}

            {/* Current dragging connection */}
            {isDragging && currentConnection.start && currentConnection.end && (
                <g>
                    {/* Clickable area (invisible) */}
                    <path
                        d={createStepPath(currentConnection.start, currentConnection.end)}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="8"
                        pointerEvents="none"
                    />
                    {/* Visible stroke */}
                    <path
                        d={createStepPath(currentConnection.start, currentConnection.end)}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="1"
                        strokeDasharray="5,5"
                        markerEnd="url(#arrowhead)"
                    />
                </g>
            )}
        </svg>
    );
}