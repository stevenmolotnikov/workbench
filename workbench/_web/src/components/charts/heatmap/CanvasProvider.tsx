import React, { createContext, useContext, ReactNode, useRef } from "react";
import { useHeatmapControls } from "./HeatmapControlsProvider";
import { useCallback, useEffect, useRef as useDomRef, useState } from "react";
import { getCellFromPosition } from "./heatmap-geometry";
import useSelectionRect from "./useSelectionRect";
import { useParams } from "next/navigation";

interface SelectionRect {
    startX: number
    startY: number
    endX: number
    endY: number
}

interface CanvasContextValue {
    canvasRef: React.RefObject<HTMLCanvasElement>
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

export const useCanvas = () => {
    const context = useContext(CanvasContext);
    if (!context) {
        throw new Error("useCanvas must be used within a CanvasProvider");
    }
    return context;
};

interface CanvasProviderProps {
    children: ReactNode;
}

export const CanvasProvider: React.FC<CanvasProviderProps> = ({ children }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null)

    const { filteredData: data, handleZoomComplete: onZoomComplete, isZoomSelecting } = useHeatmapControls();

    const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null)
    const isDraggingRef = useDomRef(false)
    const rafPendingRef = useDomRef<number | null>(null)
    // Keep a ref to latest selectionRect for mouseup finalization
    const selectionRectRef = useDomRef<SelectionRect | null>(null)

    const { chartId } = useParams<{ chartId: string }>();

    useSelectionRect({ canvasRef, data, chartId, selectionRect })

    // Handle canvas resize with proper DPI scaling
    useEffect(() => {
        const updateCanvasSize = () => {
            if (canvasRef.current) {
                const dpr = window.devicePixelRatio || 1
                const rect = canvasRef.current.getBoundingClientRect()
                
                // Set internal size to actual size multiplied by DPR
                canvasRef.current.width = rect.width * dpr
                canvasRef.current.height = rect.height * dpr
                
                // Scale the drawing context to match the device pixel ratio
                const ctx = canvasRef.current.getContext('2d')
                if (ctx) {
                    ctx.scale(dpr, dpr)
                }
            }
        }

        updateCanvasSize()
        window.addEventListener('resize', updateCanvasSize)
        return () => window.removeEventListener('resize', updateCanvasSize)
    }, [canvasRef])

    // Tooltip state
    const [tooltip, setTooltip] = useState<{
        visible: boolean
        left: number
        top: number
        xVal: string | number
        yVal: number | null
        color: string
    }>({ visible: false, left: 0, top: 0, xVal: "", yVal: null, color: "transparent" })

    const valueToBlue = (value: number | null) => {
        if (value === null || Number.isNaN(value)) return "#cccccc"
        const v = Math.max(0, Math.min(1, value))
        const lightness = 90 - v * 60 // 90% (light) to 30% (dark)
        return `hsl(217 91% ${lightness}%)`
    }

    const updateTooltipAtEvent = useCallback((e: { clientX: number; clientY: number }) => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cell = getCellFromPosition(canvasRef, data, x, y)
        if (!cell) {
            setTooltip(prev => prev.visible ? { ...prev, visible: false } : prev)
            return
        }
        const firstRow = data.rows[0]
        const xVal = firstRow?.data[cell.col]?.x ?? ""
        const yVal = data.rows[cell.row]?.data[cell.col]?.y ?? null
        const color = valueToBlue(typeof yVal === 'number' ? yVal : null)
        const containerRect = containerRef.current?.getBoundingClientRect()
        const left = containerRect ? e.clientX - containerRect.left + 12 : x + 12
        const top = containerRect ? e.clientY - containerRect.top - 12 : y - 12
        setTooltip({ visible: true, left, top, xVal, yVal, color })
    }, [canvasRef, data])

    const hideTooltip = useCallback(() => {
        setTooltip(prev => prev.visible ? { ...prev, visible: false } : prev)
    }, [])

    // Drag handling
    const startDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cell = getCellFromPosition(canvasRef, data, x, y)
        if (!cell) return

        const firstRow = data.rows[0]
        const xVal = firstRow?.data[cell.col]?.x
        if (xVal === undefined) return

        isDraggingRef.current = true
        setSelectionRect({
            startX: typeof xVal === 'number' ? xVal : Number(xVal),
            startY: cell.row,
            endX: typeof xVal === 'number' ? xVal : Number(xVal),
            endY: cell.row,
        })

        const onMove = (ev: MouseEvent) => {
            if (!isDraggingRef.current) return
            if (rafPendingRef.current) return
            rafPendingRef.current = requestAnimationFrame(() => {
                rafPendingRef.current = null
                const r = canvasRef.current?.getBoundingClientRect()
                if (!r) return
                const mx = ev.clientX - r.left
                const my = ev.clientY - r.top
                const c = getCellFromPosition(canvasRef, data, mx, my)
                if (!c) return
                const xValMove = firstRow?.data[c.col]?.x
                if (xValMove === undefined) return
                setSelectionRect(prev => prev ? {
                    ...prev,
                    endX: typeof xValMove === 'number' ? xValMove : Number(xValMove),
                    endY: c.row
                } : null)
                updateTooltipAtEvent(ev)
            })
        }

        const onUp = (ev: MouseEvent) => {
            isDraggingRef.current = false
            if (rafPendingRef.current) {
                cancelAnimationFrame(rafPendingRef.current)
                rafPendingRef.current = null
            }

            const finalRect = selectionRectRef.current
            if (finalRect) {
                const minCol = Math.min(finalRect.startX, finalRect.endX)
                const maxCol = Math.max(finalRect.startX, finalRect.endX)
                const minRow = Math.min(finalRect.startY, finalRect.endY)
                const maxRow = Math.max(finalRect.startY, finalRect.endY)

                if (isZoomSelecting) {
                    onZoomComplete?.({ minRow, maxRow, minCol, maxCol })
                    setSelectionRect(null)
                } else {
                    const cells = new Set<string>()
                    for (let row = minRow; row <= maxRow; row++) {
                        for (let col = minCol; col <= maxCol; col++) {
                            cells.add(`${chartId}-${row}-${col}`)
                        }
                    }
                }
            }

            hideTooltip()
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
    }, [canvasRef, data, isDraggingRef, rafPendingRef, onZoomComplete, isZoomSelecting, chartId, hideTooltip, updateTooltipAtEvent, selectionRectRef])

    useEffect(() => { selectionRectRef.current = selectionRect }, [selectionRect, selectionRectRef])

    // Passive hover tooltip on container move (when not dragging)
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isDraggingRef.current) return
        updateTooltipAtEvent(e)
    }, [isDraggingRef, updateTooltipAtEvent])

    const contextValue: CanvasContextValue = {
        canvasRef,
    }

    return (
        <div
            ref={containerRef}
            className="size-full relative"
            onMouseMove={handleMouseMove}
            onMouseLeave={hideTooltip}
            onMouseDown={startDrag}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 size-full pointer-events-none z-10"
            />
            {tooltip.visible && (
                <div
                    className="absolute z-20 px-2 py-1 rounded shadow bg-background border text-sm"
                    style={{ left: tooltip.left, top: tooltip.top }}
                >
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded"
                            style={{ backgroundColor: tooltip.color }}
                        />
                        <span>x: {String(tooltip.xVal)}</span>
                        <span>y: {tooltip.yVal === null ? '—' : tooltip.yVal.toFixed(2)}</span>
                    </div>
                </div>
            )}
            <CanvasContext.Provider value={contextValue}>
                {children}
            </CanvasContext.Provider>
        </div>
    );
};
