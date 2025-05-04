"use client"

import type React from "react"
import type { ConnectionsProps } from "../types"
import { generatePath } from "../utils"

const Connections: React.FC<ConnectionsProps> = ({
  connections,
  selectedConnection,
  isDragging,
  startPoint,
  mousePosition,
  isOverDropZone,
  onConnectionClick,
}) => {
  // Path for the active drag
  const activeDragPath = isDragging && startPoint ? generatePath(startPoint, mousePosition) : ""

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
      {/* Active dragging path */}
      {isDragging && (
        <path
          d={activeDragPath}
          stroke={isOverDropZone ? "#22c55e" : "#3b82f6"}
          strokeWidth={isOverDropZone ? "3" : "2"}
          fill="none"
          strokeDasharray={isOverDropZone ? "0" : "5,5"}
        />
      )}

      {/* Established connections */}
      {connections.map((conn, idx) => (
        <g
          key={idx}
          onClick={(e: any) => onConnectionClick(idx, e)}
          style={{ pointerEvents: "all", cursor: "pointer" }}
        >
          <path
            d={generatePath(conn.start, conn.end)}
            stroke={selectedConnection === idx ? "#ef4444" : "#3b82f6"}
            strokeWidth={selectedConnection === idx ? "3" : "2"}
            fill="none"
            className="transition-all duration-150"
          />
          <polygon
            points="0,-4 8,0 0,4"
            fill={selectedConnection === idx ? "#ef4444" : "#3b82f6"}
            className="transition-all duration-150"
            transform={`translate(${conn.end.x},${conn.end.y}) rotate(${Math.atan2(conn.end.y - conn.start.y, conn.end.x - conn.start.x) * (180 / Math.PI)})`}
          />
        </g>
      ))}
    </svg>
  )
}

export default Connections
