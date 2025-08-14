import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useHeatmapControls } from "./HeatmapControlsProvider";
import { heatmapMargin as margin } from "../theming";
import { getCellDimensions, getCellFromPosition } from "./heatmap-geometry";
import { useParams } from "next/navigation";

interface SelectionRect {
    startX: number
    startY: number
    endX: number
    endY: number
}

interface ZoomContextValue {
    zoomCanvasRef: React.RefObject<HTMLCanvasElement>
}

const ZoomContext = createContext<ZoomContextValue | null>(null)

export const useZoomCanvas = () => {
    const ctx = useContext(ZoomContext)
    if (!ctx) throw new Error("useZoomCanvas must be used within a ZoomProvider")
    return ctx
}

export const ZoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const zoomCanvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const { filteredData: data, isZoomSelecting, handleZoomComplete } = useHeatmapControls()

    const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null)
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        const canvas = zoomCanvasRef.current
        if (!canvas) return
        const update = () => {
            const rect = canvas.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1
            canvas.width = Math.max(1, Math.floor(rect.width * dpr))
            canvas.height = Math.max(1, Math.floor(rect.height * dpr))
            const ctx = canvas.getContext('2d')
            if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])

    const draw = useCallback(() => {
        const canvas = zoomCanvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return
        const dpr = window.devicePixelRatio || 1
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
        if (!selectionRect) return
        const dims = getCellDimensions(zoomCanvasRef, data)
        if (!dims) return
        const startXIdx = selectionRect.startX
        const endXIdx = selectionRect.endX
        const bounds = {
            minCol: Math.min(startXIdx, endXIdx),
            maxCol: Math.max(startXIdx, endXIdx),
            minRow: Math.min(selectionRect.startY, selectionRect.endY),
            maxRow: Math.max(selectionRect.startY, selectionRect.endY),
        }
        const x = margin.left + bounds.minCol * dims.cellWidth
        const y = margin.top + bounds.minRow * dims.cellHeight
        const w = (bounds.maxCol - bounds.minCol + 1) * dims.cellWidth
        const h = (bounds.maxRow - bounds.minRow + 1) * dims.cellHeight
        ctx.fillStyle = 'rgba(59,130,246,0.25)'
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2
        ctx.fillRect(x, y, w, h)
        ctx.strokeRect(x, y, w, h)
    }, [selectionRect, data])

    useEffect(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => draw())
    }, [draw])

    const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!isZoomSelecting) return
        const rect = zoomCanvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cell = getCellFromPosition(zoomCanvasRef, data, x, y)
        if (!cell) return
        setSelectionRect({ startX: cell.col, startY: cell.row, endX: cell.col, endY: cell.row })

        const onMove = (ev: MouseEvent) => {
            const r = zoomCanvasRef.current?.getBoundingClientRect()
            if (!r) return
            const mx = ev.clientX - r.left
            const my = ev.clientY - r.top
            const c = getCellFromPosition(zoomCanvasRef, data, mx, my)
            if (!c) return
            setSelectionRect(prev => prev ? { ...prev, endX: c.col, endY: c.row } : null)
        }

        const onUp = () => {
            const final = selectionRect
            if (final) {
                handleZoomComplete?.({
                    minRow: Math.min(final.startY, final.endY),
                    maxRow: Math.max(final.startY, final.endY),
                    minCol: Math.min(final.startX, final.endX),
                    maxCol: Math.max(final.startX, final.endX),
                })
            }
            setSelectionRect(null)
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
    }, [isZoomSelecting, data, handleZoomComplete, selectionRect])

    return (
        <div ref={containerRef} className="size-full relative" onMouseDown={onMouseDown}>
            <canvas
                ref={zoomCanvasRef}
                className={isZoomSelecting ? "absolute inset-0 size-full pointer-events-auto z-20" : "absolute inset-0 size-full pointer-events-none z-20"}
            />
            <ZoomContext.Provider value={{ zoomCanvasRef }}>
                {children}
            </ZoomContext.Provider>
        </div>
    )
}


