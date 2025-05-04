import type React from "react"
export type TokenRef = HTMLSpanElement | null
export type Area = "top" | "bottom" | null
export type Point = { x: number; y: number }

export interface Connection {
  start: Point
  end: Point
  sourceArea: Area
  sourceTokens: number[]
  targetArea: Area
  targetTokens: number[]
}

export interface TokenAreaProps {
  area: Area
  tokens: string[]
  selectedTokens: number[]
  isSelectionMode: boolean
  sourceArea: Area
  isOverDropZone: boolean
  dropTokenIndex: number | null
  onTokenClick: (index: number, event: React.MouseEvent) => void
  onTokenDragStart: (area: Area, index: number, event: React.MouseEvent) => void
  onTokenMouseEnter: (index: number) => void
  tokenRefs: React.MutableRefObject<TokenRef[]>
  areaRef: React.RefObject<HTMLDivElement>
}

export interface ConnectionsProps {
  connections: Connection[]
  selectedConnection: number | null
  isDragging: boolean
  startPoint: Point | null
  mousePosition: Point
  isOverDropZone: boolean
  onConnectionClick: (idx: number, e: React.MouseEvent) => void
}

export interface TokenProps {
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
  ref: React.Ref<HTMLSpanElement>
}

export interface TokenGroup {
  startIndex: number
  endIndex: number
  tokens: number[]
}

export interface SelectionBoxProps {
  selectionBox: { start: Point; end: Point } | null
}
