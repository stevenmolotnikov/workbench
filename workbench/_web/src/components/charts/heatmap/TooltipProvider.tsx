import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useHeatmapControls } from "./HeatmapControlsProvider";
import { useSelection } from "./SelectionProvider";
import { getCellFromPosition } from "./heatmap-geometry";

type TooltipContextValue = object;

const TooltipContext = createContext<TooltipContextValue | null>(null)

export const useHeatmapTooltip = () => {
    const ctx = useContext(TooltipContext)
    if (!ctx) throw new Error("useHeatmapTooltip must be used within a TooltipProvider")
    return ctx
}

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const { filteredData: data } = useHeatmapControls()
    const { selectionCanvasRef } = useSelection()

    const [tooltip, setTooltip] = useState<{ visible: boolean; left: number; top: number; xVal: string | number; yVal: number | null; color: string }>(
        { visible: false, left: 0, top: 0, xVal: "", yVal: null, color: "transparent" }
    )

    const valueToBlue = (value: number | null) => {
        if (value === null || Number.isNaN(value)) return "#cccccc"
        const v = Math.max(0, Math.min(1, value))
        const lightness = 90 - v * 60
        return `hsl(217 91% ${lightness}%)`
    }

    const handleMove = useCallback((e: MouseEvent) => {
        const canvasRect = selectionCanvasRef.current?.getBoundingClientRect()
        if (!canvasRect) return setTooltip(prev => prev.visible ? { ...prev, visible: false } : prev)
        const x = e.clientX - canvasRect.left
        const y = e.clientY - canvasRect.top
        const cell = getCellFromPosition(selectionCanvasRef, data, x, y)
        if (!cell) {
            setTooltip(prev => prev.visible ? { ...prev, visible: false } : prev)
            return
        }
        const firstRow = data.rows[0]
        const xVal = firstRow?.data[cell.col]?.x ?? ""
        const yVal = data.rows[cell.row]?.data[cell.col]?.y ?? null
        const color = valueToBlue(typeof yVal === 'number' ? yVal : null)
        const contRect = containerRef.current?.getBoundingClientRect()
        const left = contRect ? e.clientX - contRect.left + 12 : x + 12
        const top = contRect ? e.clientY - contRect.top - 12 : y - 12
        setTooltip({ visible: true, left, top, xVal, yVal, color })
    }, [selectionCanvasRef, data])

    const handleLeave = useCallback(() => {
        setTooltip(prev => prev.visible ? { ...prev, visible: false } : prev)
    }, [])

    useEffect(() => {
        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseleave', handleLeave)
        return () => {
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseleave', handleLeave)
        }
    }, [handleMove, handleLeave])

    return (
        <div ref={containerRef} className="size-full relative">
            {tooltip.visible && (
                <div
                    className="absolute z-30 px-2 py-1 rounded shadow bg-background border text-sm pointer-events-none"
                    style={{ left: tooltip.left, top: tooltip.top }}
                >
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: tooltip.color }} />
                        <span>x: {String(tooltip.xVal)}</span>
                        <span>y: {tooltip.yVal === null ? '—' : tooltip.yVal.toFixed(2)}</span>
                    </div>
                </div>
            )}
            <TooltipContext.Provider value={{}}>
                {children}
            </TooltipContext.Provider>
        </div>
    )
}


