import { Connection } from "@/types/patching";

interface EdgeProps {
    connections: Connection[];
    isDragging: boolean;
    currentConnection: Partial<Connection>;
    svgRef: React.RefObject<SVGSVGElement>;
    onEdgeSelect: (index: number) => void;
    selectedEdgeIndex: number | null;
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

export function Edges({ connections, isDragging, currentConnection, svgRef, onEdgeSelect, selectedEdgeIndex }: EdgeProps) {
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
                            onEdgeSelect(i);
                        }}
                    />
                    {/* Visible stroke */}
                    <path
                        d={createStepPath(conn.start, conn.end)}
                        fill="none"
                        stroke={ "#3b82f6"}
                        strokeWidth={selectedEdgeIndex === i ? "2" : "1"}
                        markerEnd="url(#arrowhead)"
                    />
                </g>
            ))}
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