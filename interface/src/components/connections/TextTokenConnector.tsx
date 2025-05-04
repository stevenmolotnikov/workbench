"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { Area, TokenRef, Point, Connection } from "@/components/types"
import { tokenizeText, getGroupCenter, findTokenGroups } from "@/components/utils"
import TokenArea from "@/components/connections/TokenArea"
import Connections from "@/components/connections/Connections"
import { Textarea } from "@/components/ui/textarea"

export const TextTokenConnector: React.FC = () => {
  // State for text areas
  const [topText, setTopText] = useState("")
  const [bottomText, setBottomText] = useState("")

  // State for tokenized text
  const [topTokens, setTopTokens] = useState<string[]>([])
  const [bottomTokens, setBottomTokens] = useState<string[]>([])

  // State for token selection
  const [topSelectedTokens, setTopSelectedTokens] = useState<number[]>([])
  const [bottomSelectedTokens, setBottomSelectedTokens] = useState<number[]>([])

  // State for drag operation
  const [isDragging, setIsDragging] = useState(false)
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 })
  const [isOverDropZone, setIsOverDropZone] = useState(false)
  const [dropTokenIndex, setDropTokenIndex] = useState<number | null>(null)
  const [sourceArea, setSourceArea] = useState<Area>(null)
  const [sourceGroup, setSourceGroup] = useState<number[]>([])

  // State for connections
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null)

  // State for selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(true)
  const [isMouseDown, setIsMouseDown] = useState(false)

  // Refs
  const topAreaRef = useRef<HTMLDivElement>(null)
  const bottomAreaRef = useRef<HTMLDivElement>(null)
  const topTokensRef = useRef<TokenRef[]>([])
  const bottomTokensRef = useRef<TokenRef[]>([])

  // Tokenize text
  const handleTokenize = () => {
    // Simple tokenization by splitting on spaces and punctuation
    const topWords = tokenizeText(topText)
    const bottomWords = tokenizeText(bottomText)

    setTopTokens(topWords)
    setBottomTokens(bottomWords)

    // Reset selections
    setTopSelectedTokens([])
    setBottomSelectedTokens([])

    // Reset connections that might be invalid after re-tokenizing
    setConnections([])
  }

  // Handle token selection in the top area
  const handleTopTokenClick = (index: number, event: React.MouseEvent) => {
    if (isSelectionMode) {
      // In selection mode, start selecting tokens
      setIsMouseDown(true)
      toggleTopTokenSelection(index)
      return
    }

    if (event.shiftKey && topSelectedTokens.length > 0) {
      // Handle shift+click for range selection
      const lastIndex = topSelectedTokens[topSelectedTokens.length - 1]
      const start = Math.min(lastIndex, index)
      const end = Math.max(lastIndex, index)
      const newSelection = Array.from({ length: end - start + 1 }, (_, i) => start + i)
      setTopSelectedTokens([...newSelection])
    } else if (event.ctrlKey || event.metaKey) {
      // Handle ctrl/cmd+click for individual selection
      if (topSelectedTokens.includes(index)) {
        setTopSelectedTokens(topSelectedTokens.filter((i) => i !== index))
      } else {
        setTopSelectedTokens([...topSelectedTokens, index])
      }
    } else {
      // Normal click selects only this token
      setTopSelectedTokens([index])
    }
  }

  // Handle token selection in the bottom area
  const handleBottomTokenClick = (index: number, event: React.MouseEvent) => {
    if (isSelectionMode) {
      // In selection mode, start selecting tokens
      setIsMouseDown(true)
      toggleBottomTokenSelection(index)
      return
    }

    if (event.shiftKey && bottomSelectedTokens.length > 0) {
      // Handle shift+click for range selection
      const lastIndex = bottomSelectedTokens[bottomSelectedTokens.length - 1]
      const start = Math.min(lastIndex, index)
      const end = Math.max(lastIndex, index)
      const newSelection = Array.from({ length: end - start + 1 }, (_, i) => start + i)
      setBottomSelectedTokens([...newSelection])
    } else if (event.ctrlKey || event.metaKey) {
      // Handle ctrl/cmd+click for individual selection
      if (bottomSelectedTokens.includes(index)) {
        setBottomSelectedTokens(bottomSelectedTokens.filter((i) => i !== index))
      } else {
        setBottomSelectedTokens([...bottomSelectedTokens, index])
      }
    } else {
      // Normal click selects only this token
      setBottomSelectedTokens([index])
    }
  }

  // Toggle token selection for top area
  const toggleTopTokenSelection = (index: number) => {
    if (topSelectedTokens.includes(index)) {
      setTopSelectedTokens(topSelectedTokens.filter((i) => i !== index))
    } else {
      setTopSelectedTokens([...topSelectedTokens, index])
    }
  }

  // Toggle token selection for bottom area
  const toggleBottomTokenSelection = (index: number) => {
    if (bottomSelectedTokens.includes(index)) {
      setBottomSelectedTokens(bottomSelectedTokens.filter((i) => i !== index))
    } else {
      setBottomSelectedTokens([...bottomSelectedTokens, index])
    }
  }

  // Handle token mouse enter for selection mode
  const handleTopTokenMouseEnter = (index: number) => {
    if (isSelectionMode && isMouseDown) {
      toggleTopTokenSelection(index)
    }
  }

  // Handle token mouse enter for selection mode
  const handleBottomTokenMouseEnter = (index: number) => {
    if (isSelectionMode && isMouseDown) {
      toggleBottomTokenSelection(index)
    }
  }

  // Start dragging from a token
  const handleTokenDragStart = (area: Area, index: number, event: React.MouseEvent) => {
    if (isSelectionMode) return // Skip if in selection mode

    // Only allow dragging if the token is selected
    const isSelected = area === "top" ? topSelectedTokens.includes(index) : bottomSelectedTokens.includes(index)

    if (!isSelected) return

    event.preventDefault()

    // Find the group that this token belongs to
    const selectedTokens = area === "top" ? topSelectedTokens : bottomSelectedTokens
    const groups = findTokenGroups(selectedTokens)

    // Find which group this token belongs to
    const group = groups.find((g) => g.tokens.includes(index))

    if (!group) return

    // Get the center of the group
    const tokenRefs = area === "top" ? topTokensRef : bottomTokensRef
    const center = getGroupCenter(tokenRefs.current, group.tokens)

    setStartPoint(center)
    setIsDragging(true)
    setSourceArea(area)
    setSourceGroup(group.tokens)
  }

  // Check if mouse is over valid drop zone (tokens in the opposite area)
  const checkOverDropZone = (mousePos: Point): boolean => {
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
          return true
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
          return true
        }
      }
    }

    setDropTokenIndex(null)
    return false
  }

  // Handle connection selection
  const handleConnectionClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedConnection(idx)
  }

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

  // Handle mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newMousePosition = { x: e.clientX, y: e.clientY }

      if (isDragging) {
        setMousePosition(newMousePosition)
        setIsOverDropZone(checkOverDropZone(newMousePosition))
      }
    }

    const handleMouseUp = () => {
      setIsMouseDown(false)

      if (isDragging && isOverDropZone && dropTokenIndex !== null) {
        // Complete the connection
        let targetTokens, targetElement

        if (sourceArea === "top") {
          targetTokens = [dropTokenIndex]
          targetElement = bottomTokensRef.current[dropTokenIndex]
        } else {
          targetTokens = [dropTokenIndex]
          targetElement = topTokensRef.current[dropTokenIndex]
        }

        if (startPoint && targetElement) {
          // Get the center of the target token
          const targetCenter = getGroupCenter(
            sourceArea === "top" ? bottomTokensRef.current : topTokensRef.current,
            targetTokens,
          )

          const newConnection = {
            start: { ...startPoint },
            end: { ...targetCenter },
            sourceArea,
            sourceTokens: [...sourceGroup],
            targetArea: sourceArea === "top" ? "bottom" : "top",
            targetTokens: [...targetTokens],
          }

          setConnections([...connections, newConnection])
        }
      }

      setIsDragging(false)
      setIsOverDropZone(false)
      setSourceArea(null)
      setDropTokenIndex(null)
      setSourceGroup([])
    }

    const handleClickOutside = (e: MouseEvent) => {
      // Check if the click is outside of any connection
      const target = e.target as HTMLElement
      if (!target.closest("path") && !target.closest("g")) {
        setSelectedConnection(null)
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("click", handleClickOutside)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("click", handleClickOutside)
    }
  }, [
    isDragging,
    isOverDropZone,
    connections,
    startPoint,
    sourceArea,
    dropTokenIndex,
    topSelectedTokens,
    bottomSelectedTokens,
    isMouseDown,
    sourceGroup,
  ])

  return (
    <div className="h-screen w-full relative p-6 flex flex-col">
      <div className="flex justify-between mb-4">
        <div className="flex space-x-4">
          <button onClick={handleTokenize} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Tokenize
          </button>
          <button
            onClick={() => {
              setConnections([])
              setSelectedConnection(null)
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Clear Connections
          </button>
          <button
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={`px-4 py-2 rounded-md ${
              isSelectionMode
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-gray-300 text-gray-800 hover:bg-gray-400"
            }`}
          >
            {isSelectionMode ? "Selection Mode" : "Connection Mode"}
          </button>
        </div>
        {selectedConnection !== null && (
          <div className="text-sm text-gray-600">Press Backspace or Delete to remove the selected connection</div>
        )}
      </div>

      <div className="flex flex-col space-y-8 flex-grow">
        {/* Top text area */}
        <div className="flex-1 flex flex-col">
          <label className="mb-2 font-medium">Prompt 1:</label>
          {topTokens.length === 0 ? (
            <Textarea
              value={topText}
              onChange={(e) => setTopText(e.target.value)}
              placeholder="Enter text here..."
              className="w-full p-3 border border-gray-300 rounded-md h-32"
              ref={topAreaRef as any}
            />
          ) : (
            <TokenArea
              area="top"
              tokens={topTokens}
              selectedTokens={topSelectedTokens}
              isSelectionMode={isSelectionMode}
              sourceArea={sourceArea}
              isOverDropZone={isOverDropZone}
              dropTokenIndex={dropTokenIndex}
              onTokenClick={handleTopTokenClick}
              onTokenDragStart={handleTokenDragStart}
              onTokenMouseEnter={handleTopTokenMouseEnter}
              tokenRefs={topTokensRef}
              areaRef={topAreaRef}
            />
          )}
        </div>

        {/* Bottom text area */}
        <div className="flex-1 flex flex-col">
          <label className="mb-2 font-medium">Prompt 2:</label>
          {bottomTokens.length === 0 ? (
            <Textarea
              value={bottomText}
              onChange={(e) => setBottomText(e.target.value)}
              placeholder="Enter text here..."
              className="w-full p-3 border border-gray-300 rounded-md h-32"
              ref={bottomAreaRef as any}
            />
          ) : (
            <TokenArea
              area="bottom"
              tokens={bottomTokens}
              selectedTokens={bottomSelectedTokens}
              isSelectionMode={isSelectionMode}
              sourceArea={sourceArea}
              isOverDropZone={isOverDropZone}
              dropTokenIndex={dropTokenIndex}
              onTokenClick={handleBottomTokenClick}
              onTokenDragStart={handleTokenDragStart}
              onTokenMouseEnter={handleBottomTokenMouseEnter}
              tokenRefs={bottomTokensRef}
              areaRef={bottomAreaRef}
            />
          )}
        </div>
      </div>

      {/* SVG for Bezier curves */}
      <Connections
        connections={connections}
        selectedConnection={selectedConnection}
        isDragging={isDragging}
        startPoint={startPoint}
        mousePosition={mousePosition}
        isOverDropZone={isOverDropZone}
        onConnectionClick={handleConnectionClick}
      />
    </div>
  )
}

export default TextTokenConnector
