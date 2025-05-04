"use client"

import type React from "react"

import { useState } from "react"
import type { Area, Point, TokenRef } from "../types"

export function useSelectionMode() {
  const [isSelectionMode, setIsSelectionMode] = useState(true)
  const [selectionBox, setSelectionBox] = useState<{ start: Point; end: Point } | null>(null)
  const [selectionArea, setSelectionArea] = useState<Area>(null)

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
  }

  const startSelectionBox = (area: Area, point: Point) => {
    if (!isSelectionMode) return

    setSelectionBox({
      start: point,
      end: point,
    })
    setSelectionArea(area)
  }

  const updateSelectionBox = (
    point: Point,
    topTokensRef: React.MutableRefObject<TokenRef[]>,
    bottomTokensRef: React.MutableRefObject<TokenRef[]>,
    setTopSelectedTokens: React.Dispatch<React.SetStateAction<number[]>>,
    setBottomSelectedTokens: React.Dispatch<React.SetStateAction<number[]>>,
  ) => {
    if (!selectionBox) return

    setSelectionBox({
      start: selectionBox.start,
      end: point,
    })

    // Check which tokens are within the selection box
    if (selectionArea === "top") {
      const newSelection = topTokensRef.current
        .map((token, index) => ({ token, index }))
        .filter(({ token }) => {
          if (!token) return false

          const rect = token.getBoundingClientRect()
          const minX = Math.min(selectionBox.start.x, point.x)
          const maxX = Math.max(selectionBox.start.x, point.x)
          const minY = Math.min(selectionBox.start.y, point.y)
          const maxY = Math.max(selectionBox.start.y, point.y)

          // Check if the token intersects with the selection box
          return rect.right >= minX && rect.left <= maxX && rect.bottom >= minY && rect.top <= maxY
        })
        .map(({ index }) => index)

      setTopSelectedTokens(newSelection)
    } else if (selectionArea === "bottom") {
      const newSelection = bottomTokensRef.current
        .map((token, index) => ({ token, index }))
        .filter(({ token }) => {
          if (!token) return false

          const rect = token.getBoundingClientRect()
          const minX = Math.min(selectionBox.start.x, point.x)
          const maxX = Math.max(selectionBox.start.x, point.x)
          const minY = Math.min(selectionBox.start.y, point.y)
          const maxY = Math.max(selectionBox.start.y, point.y)

          // Check if the token intersects with the selection box
          return rect.right >= minX && rect.left <= maxX && rect.bottom >= minY && rect.top <= maxY
        })
        .map(({ index }) => index)

      setBottomSelectedTokens(newSelection)
    }
  }

  const endSelectionBox = () => {
    setSelectionBox(null)
    setSelectionArea(null)
  }

  return {
    isSelectionMode,
    selectionBox,
    selectionArea,
    toggleSelectionMode,
    startSelectionBox,
    updateSelectionBox,
    endSelectionBox,
  }
}
