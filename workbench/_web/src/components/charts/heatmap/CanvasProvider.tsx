import React, { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useHeatmapData } from "./HeatmapDataProvider";
import { heatmapMargin as margin } from "../theming";
import { getCellDimensions } from "./heatmap-geometry";
import { HeatmapBounds } from "@/types/charts";
import { useDpr } from "../useDpr";

interface CanvasContextValue {
    selectionCanvasRef: React.RefObject<HTMLCanvasElement>
    rafRef: React.MutableRefObject<number | null>
    draw: (bounds: HeatmapBounds) => void
    clear: () => void
}

const CanvasContext = createContext<CanvasContextValue | null>(null)

export const useCanvasProvider = () => {
    const ctx = useContext(CanvasContext)
    if (!ctx) throw new Error("useCanvasProvider must be used within a CanvasProvider")
    return ctx
}

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const selectionCanvasRef = useRef<HTMLCanvasElement>(null)
    const { filteredData: data } = useHeatmapData()
    const rafRef = useRef<number | null>(null)

    // DPR/resize handling
    useDpr(selectionCanvasRef)

    const clear = useCallback(() => {
        const canvas = selectionCanvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    }, [])

    const draw = useCallback((bounds: HeatmapBounds) => {
        const canvas = selectionCanvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
        const dims = getCellDimensions(selectionCanvasRef, data)
        if (!dims) return
        const minCol = Math.min(bounds.minCol, bounds.maxCol)
        const maxCol = Math.max(bounds.minCol, bounds.maxCol)
        const minRow = Math.min(bounds.minRow, bounds.maxRow)
        const maxRow = Math.max(bounds.minRow, bounds.maxRow)
        const x = margin.left + minCol * dims.cellWidth
        const y = margin.top + minRow * dims.cellHeight
        const w = (maxCol - minCol + 1) * dims.cellWidth
        const h = (maxRow - minRow + 1) * dims.cellHeight
        ctx.fillStyle = 'rgba(239,68,68,0.25)'
        ctx.strokeStyle = '#ef4444'
        ctx.lineWidth = 1
        ctx.fillRect(x, y, w, h)
        const sx = x + 0.5
        const sy = y + 0.5
        const sw = Math.max(0, w - 1)
        const sh = Math.max(0, h - 1)
        ctx.strokeRect(sx, sy, sw, sh)
    }, [data])

    // Consumers call draw/clear explicitly

    const contextValue: CanvasContextValue = {
        selectionCanvasRef,
        rafRef,
        draw,
        clear,
    }

    return (
        <CanvasContext.Provider value={contextValue}>
            {children}
        </CanvasContext.Provider>
        // <div className="size-full relative" onMouseDown={onMouseDown}>
        //     <canvas
        //         ref={selectionCanvasRef}
        //         className="absolute inset-0 size-full pointer-events-auto z-20"
        //     />
        //     <CanvasContext.Provider value={contextValue}>
        //         {children}
        //     </CanvasContext.Provider>
        // </div>
    )
}