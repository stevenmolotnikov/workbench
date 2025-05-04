"use client"

import type React from "react"

import { useState } from "react"
import type { Area, Point, TokenRef } from "../types"
import { getTokenCenter } from "../utils"

export function useDragOperation() {
  const [isDragging, setIsDragging] = useState(false)
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 })
  const [isOverDropZone, setIsOverDropZone] = useState(false)
  const [dropTokenIndex, setDropTokenIndex] = useState<number | null>(null)
  const [sourceArea, setSourceArea] = useState<Area>(null)

  const startDragging = (
    area: Area,
    index: number,
    tokenRefs: React.MutableRefObject<TokenRef[]>,
    isSelectionMode: boolean,
  ) => {
    if (isSelectionMode) return false

    const tokenElement = tokenRefs.current[index]
    if (!tokenElement) return false

    const center = getTokenCenter(tokenElement)
    setStartPoint(center)
    setIsDragging(true)
    setSourceArea(area)
    return true
  }

  const updateDragging = (
    mousePos: Point,
    topTokensRef: React.MutableRefObject<TokenRef[]>,
    bottomTokensRef: React.MutableRefObject<TokenRef[]>,
  ) => {
    setMousePosition(mousePos)

    // Check if mouse is over valid drop zone
    if (sourceArea === "top") {
      // Check bottom tokens
      for (let i = 0; i < bottomTokensRef.current.length; i++) {
        const token = bottomTokensRef.current[i]
        if (!token) continue

        const rect = token.getBoundingClientRect()
        if (
          mousePos.x >= rect.left &&
          mousePos.x <= rect.right &&
          mousePos.y >= rect.top &&
          mousePos.y <= rect.bottom
        ) {
          setDropTokenIndex(i)
          setIsOverDropZone(true)
          return
        }
      }
    } else if (sourceArea === "bottom") {
      // Check top tokens
      for (let i = 0; i < topTokensRef.current.length; i++) {
        const token = topTokensRef.current[i]
        if (!token) continue

        const rect = token.getBoundingClientRect()
        if (
          mousePos.x >= rect.left &&
          mousePos.x <= rect.right &&
          mousePos.y >= rect.top &&
          mousePos.y <= rect.bottom
        ) {
          setDropTokenIndex(i)
          setIsOverDropZone(true)
          return
        }
      }
    }

    setDropTokenIndex(null)
    setIsOverDropZone(false)
  }

  const endDragging = () => {
    setIsDragging(false)
    setIsOverDropZone(false)
    setSourceArea(null)
    setDropTokenIndex(null)
  }

  return {
    isDragging,
    startPoint,
    mousePosition,
    isOverDropZone,
    dropTokenIndex,
    sourceArea,
    startDragging,
    updateDragging,
    endDragging,
  }
}
