import { Connection } from "@/types/activation-patching";

interface EdgeProps {
    connections: Connection[];
    isDragging: boolean;
    currentConnection: Partial<Connection>;
    svgRef: React.RefObject<SVGSVGElement>;
    onEdgeSelect: (index: number) => void;
    selectedEdgeIndex: number | null;
}

export function Edges({ connections, isDragging, currentConnection, svgRef, onEdgeSelect, selectedEdgeIndex }: EdgeProps) {
    return (
        <svg
            ref={svgRef}
            className="w-full h-full absolute"
        >
            {connections.map((conn, i) => (
                <line
                    key={i}
                    x1={conn.start.x}
                    y1={conn.start.y}
                    x2={conn.end.x}
                    y2={conn.end.y}
                    stroke={selectedEdgeIndex === i ? "#bfdbfe" : "#e5e5e5"}
                    strokeWidth={selectedEdgeIndex === i ? "3" : "2"}
                    className="cursor-pointer"
                    pointerEvents="auto"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdgeSelect(i);
                    }}
                />
            ))}
            {isDragging && currentConnection.start && currentConnection.end && (
                <line
                    x1={currentConnection.start.x}
                    y1={currentConnection.start.y}
                    x2={currentConnection.end.x}
                    y2={currentConnection.end.y}
                    stroke="white"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    pointerEvents="auto"
                />
            )}
        </svg>
    );
}