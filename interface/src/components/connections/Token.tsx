"use client"

import type React from "react"
import { forwardRef } from "react"
import type { Area } from "../types"

interface TokenProps {
  token: string
  index: number
  isSelected: boolean
  isDropTarget: boolean
  isPartOfGroup: boolean
  isFirstInGroup: boolean
  isLastInGroup: boolean
  onTokenClick: (index: number, event: React.MouseEvent) => void
  onTokenDragStart: (area: Area, index: number, event: React.MouseEvent) => void
  onTokenMouseEnter: (index: number) => void
  area: Area
  isSelectionMode: boolean
}

const Token = forwardRef<HTMLSpanElement, TokenProps>(
  (
    {
      token,
      index,
      isSelected,
      isDropTarget,
      isPartOfGroup,
      isFirstInGroup,
      isLastInGroup,
      onTokenClick,
      onTokenDragStart,
      onTokenMouseEnter,
      area,
      isSelectionMode,
    },
    ref,
  ) => {
    // Determine border radius based on position in group
    let borderRadius = "rounded"
    if (isPartOfGroup) {
      if (isFirstInGroup && isLastInGroup) {
        borderRadius = "rounded"
      } else if (isFirstInGroup) {
        borderRadius = "rounded-l"
      } else if (isLastInGroup) {
        borderRadius = "rounded-r"
      } else {
        borderRadius = "rounded-none"
      }
    }

    return (
      <span
        ref={ref}
        className={`inline-block px-1 py-0.5 m-0.5 ${borderRadius} cursor-pointer select-none
          ${isSelected ? "bg-blue-200 ring-2 ring-blue-500" : isDropTarget ? "bg-green-200 ring-2 ring-green-500" : ""}
          ${isPartOfGroup && !isFirstInGroup ? "-ml-1" : ""}
        `}
        onClick={(e) => onTokenClick(index, e)}
        onMouseDown={(e) => {
          if (!isSelectionMode && isSelected) {
            onTokenDragStart(area, index, e)
          }
        }}
        onMouseEnter={() => {
          if (isSelectionMode) {
            onTokenMouseEnter(index)
          }
        }}
      >
        {token}
      </span>
    )
  },
)

Token.displayName = "Token"

export default Token
