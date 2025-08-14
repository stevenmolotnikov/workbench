import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useHeatmapControls } from "./HeatmapControlsProvider";
import { heatmapMargin as margin } from "../theming";
import { getCellDimensions, getCellFromPosition } from "./heatmap-geometry";
import { useDpr } from "../useDpr";
 
interface SelectionRect {
    startX: number
    startY: number
    endX: number
    endY: number
}

interface SelectionContextValue {
    selectionCanvasRef: React.RefObject<HTMLCanvasElement>
}

const SelectionContext = createContext<SelectionContextValue | null>(null)

export const useSelection = () => {
    const ctx = useContext(SelectionContext)
    if (!ctx) throw new Error("useSelection must be used within a SelectionProvider")
    return ctx
}

export const SelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const selectionCanvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const { filteredData: data, setActiveSelection, activeSelection } = useHeatmapControls()
    const selectionRef = useRef<SelectionRect | null>(null)
    const rafRef = useRef<number | null>(null)

    // DPR/resize handling
    useDpr(selectionCanvasRef)

    // Selection drawing state (drag in progress)
    const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null)

    const draw = useCallback(() => {
        const canvas = selectionCanvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
        const dims = getCellDimensions(selectionCanvasRef, data)
        if (!dims) return
        const drawBounds = (b: { minRow: number; maxRow: number; minCol: number; maxCol: number }) => {
            const x = margin.left + b.minCol * dims.cellWidth
            const y = margin.top + b.minRow * dims.cellHeight
            const w = (b.maxCol - b.minCol + 1) * dims.cellWidth
            const h = (b.maxRow - b.minRow + 1) * dims.cellHeight
            ctx.fillStyle = 'rgba(239,68,68,0.25)'
            ctx.strokeStyle = '#ef4444'
            ctx.lineWidth = 2
            ctx.fillRect(x, y, w, h)
            ctx.strokeRect(x, y, w, h)
        }
        if (selectionRect) {
            const bounds = {
                minCol: Math.min(selectionRect.startX, selectionRect.endX),
                maxCol: Math.max(selectionRect.startX, selectionRect.endX),
                minRow: Math.min(selectionRect.startY, selectionRect.endY),
                maxRow: Math.max(selectionRect.startY, selectionRect.endY),
            }
            drawBounds(bounds)
        } else if (activeSelection) {
            drawBounds(activeSelection)
        }
    }, [selectionRect, data, activeSelection])

    useEffect(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => draw())
    }, [draw])

    const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = selectionCanvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cell = getCellFromPosition(selectionCanvasRef, data, x, y)
        if (!cell) return
        const start = { startX: cell.col, startY: cell.row, endX: cell.col, endY: cell.row }
        selectionRef.current = start
        setSelectionRect(start)

        const onMove = (ev: MouseEvent) => {
            const r = selectionCanvasRef.current?.getBoundingClientRect()
            if (!r) return
            const mx = ev.clientX - r.left
            const my = ev.clientY - r.top
            const c = getCellFromPosition(selectionCanvasRef, data, mx, my)
            if (!c) return
            setSelectionRect(prev => {
                const next = prev ? { ...prev, endX: c.col, endY: c.row } : null
                selectionRef.current = next
                return next
            })
        }

        const onUp = () => {
            const final = selectionRef.current
            if (final) {
                const bounds = {
                    minRow: Math.min(final.startY, final.endY),
                    maxRow: Math.max(final.startY, final.endY),
                    minCol: Math.min(final.startX, final.endX),
                    maxCol: Math.max(final.startX, final.endX),
                }
                // Notify controls provider for persistence/toolbar behavior
                setActiveSelection(bounds)
            }
            selectionRef.current = null
            setSelectionRect(null)
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
    }, [data, setActiveSelection])


    return (
        <div ref={containerRef} className="size-full relative" onMouseDown={onMouseDown}>
            <canvas
                ref={selectionCanvasRef}
                className="absolute inset-0 size-full pointer-events-auto z-20"
            />
            <SelectionContext.Provider value={{ selectionCanvasRef }}>
                {children}
            </SelectionContext.Provider>
        </div>
    )
}