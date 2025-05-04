"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Connection, Area, Point } from "../types"
import { getTokenCenter } from "../utils"

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null)

  // Handle keyboard events for deleting selected connection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Backspace" || e.key === "Delete") && selectedConnection !== null) {
        setConnections((prevConnections) => prevConnections.filter((_, idx) => idx !== selectedConnection))
        setSelectedConnection(null)
      } else if (e.key === "Escape") {
        setSelectedConnection(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedConnection])

  const handleConnectionClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedConnection(idx)
  }

  const createConnection = (
    startPoint: Point,
    sourceArea: Area,
    sourceTokens: number[],
    targetElement: HTMLElement | null,
    targetArea: Area,
    targetTokens: number[],
  ) => {
    if (!startPoint || !targetElement) return

    const endPoint = getTokenCenter(targetElement)
    const newConnection = {
      start: { ...startPoint },
      end: { ...endPoint },
      sourceArea,
      sourceTokens: [...sourceTokens],
      targetArea,
      targetTokens: [...targetTokens],
    }

    setConnections((prev) => [...prev, newConnection])
  }

  const clearConnections = () => {
    setConnections([])
    setSelectedConnection(null)
  }

  return {
    connections,
    selectedConnection,
    handleConnectionClick,
    createConnection,
    clearConnections,
  }
}
