"use client"

import type React from "react"
import type { TokenAreaProps } from "../types"
import Token from "./Token"
import { Card } from "@/components/ui/card"

const TokenArea: React.FC<TokenAreaProps> = ({
  area,
  tokens,
  selectedTokens,
  isSelectionMode,
  sourceArea,
  isOverDropZone,
  dropTokenIndex,
  onTokenClick,
  onTokenDragStart,
  onTokenMouseEnter,
  tokenRefs,
  areaRef,
}) => {
  // Find consecutive groups of selected tokens
  const findGroups = () => {
    const groups: { [key: number]: boolean } = {}

    // Mark tokens that are part of a group (have adjacent selected tokens)
    selectedTokens.forEach((index) => {
      if (selectedTokens.includes(index - 1) || selectedTokens.includes(index + 1)) {
        groups[index] = true
      }
    })

    return groups
  }

  const isFirstInGroup = (index: number) => {
    return selectedTokens.includes(index) && !selectedTokens.includes(index - 1)
  }

  const isLastInGroup = (index: number) => {
    return selectedTokens.includes(index) && !selectedTokens.includes(index + 1)
  }

  const groups = findGroups()

  return (
    <Card
      className="w-full p-3 h-32 overflow-auto"
      ref={areaRef}
      onMouseDown={(e) => {
        // We'll handle selection directly on tokens now
      }}
    >
      {tokens.map((token, index) => (
        <Token
          key={`${area}-${index}`}
          ref={(el) => (tokenRefs.current[index] = el)}
          token={token}
          index={index}
          isSelected={selectedTokens.includes(index)}
          isDropTarget={sourceArea !== area && isOverDropZone && dropTokenIndex === index}
          isPartOfGroup={groups[index] || false}
          isFirstInGroup={isFirstInGroup(index)}
          isLastInGroup={isLastInGroup(index)}
          onTokenClick={onTokenClick}
          onTokenDragStart={onTokenDragStart}
          onTokenMouseEnter={onTokenMouseEnter}
          area={area}
          isSelectionMode={isSelectionMode}
        />
      ))}
    </Card>
  )
}

export default TokenArea
