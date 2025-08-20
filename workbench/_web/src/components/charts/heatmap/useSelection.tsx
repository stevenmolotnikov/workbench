import React, { useCallback, useEffect, useRef } from "react";
import { getCellFromPosition } from "./heatmap-geometry";
import { HeatmapBounds, Range, HeatmapViewData } from "@/types/charts";
import { useHeatmapCanvasProvider } from "./HeatmapCanvasProvider";
import { HeatmapView } from "@/db/schema";
import { useHeatmapData } from "./HeatmapDataProvider";
import { useHeatmapView } from "../ViewProvider";


export const useSelection = () => {
    const { filteredData: data, bounds, xStep, xRange, yRange, setXRange, setYRange } = useHeatmapData()
    const { heatmapCanvasRef, activeSelection, setActiveSelection } = useHeatmapCanvasProvider()
    const { view, isViewSuccess, persistView, clearView } = useHeatmapView()

    // Initialize active selection from existing DB view (if present)
    useEffect(() => {
        if (isViewSuccess && view) {
            const hv = view as HeatmapView
            setActiveSelection(hv.data.annotation ?? null)
        }
    }, [view, isViewSuccess, setActiveSelection])

    const updateView = useCallback((selection: HeatmapBounds | null, overrideBounds?: HeatmapBounds) => {
        if (!selection) return
        const viewBounds: HeatmapBounds = overrideBounds ?? {
            minCol: Math.max(bounds.minCol, xRange[0]),
            maxCol: Math.min(bounds.maxCol, xRange[1]),
            minRow: Math.max(bounds.minRow, yRange[0]),
            maxRow: Math.min(bounds.maxRow, yRange[1]),
        }
        const payload: HeatmapViewData = { bounds: viewBounds, xStep: xStep, annotation: selection }
        persistView(payload)
    }, [persistView, bounds.minCol, bounds.maxCol, bounds.minRow, bounds.maxRow, xRange, yRange, xStep])

    const clearSelection = useCallback(async () => {
        setActiveSelection(null)
        clearView()
    }, [clearView, setActiveSelection])

    const selectionRef = useRef<HeatmapBounds | null>(null)
    const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = heatmapCanvasRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cell = getCellFromPosition(heatmapCanvasRef, data, x, y)
        if (!cell) return
        const start = { minCol: cell.col, minRow: cell.row, maxCol: cell.col, maxRow: cell.row }
        selectionRef.current = start
        setActiveSelection(start)

        const onMove = (ev: MouseEvent) => {
            const r = heatmapCanvasRef.current?.getBoundingClientRect()
            if (!r) return
            const mx = ev.clientX - r.left
            const my = ev.clientY - r.top
            const c = getCellFromPosition(heatmapCanvasRef, data, mx, my)
            if (!c) return
            const cur = selectionRef.current
            const next = cur ? { ...cur, maxCol: c.col, maxRow: c.row } : null
            selectionRef.current = next
            setActiveSelection(next)
        }

        const onUp = () => {
            const final = selectionRef.current
            if (final) {
                const bounds = {
                    minRow: Math.min(final.minRow, final.maxRow),
                    maxRow: Math.max(final.minRow, final.maxRow),
                    minCol: Math.min(final.minCol, final.maxCol),
                    maxCol: Math.max(final.minCol, final.maxCol),
                }
                setActiveSelection(bounds)
                updateView(bounds)
            }
            selectionRef.current = null
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
    }, [data, setActiveSelection, heatmapCanvasRef, updateView])

    const zoomIntoActiveSelection = useCallback(async () => {
        if (!activeSelection) return
        const zoomBounds = activeSelection
        const hasX = xRange[0] !== 0 && xRange[1] !== 0;
        const hasY = yRange[0] !== 0 && yRange[1] !== 0;

        const xOffset = 0;
        const yOffset = hasY ? Math.floor(yRange[0]) : 0;

        const absMinCol = Math.max(bounds.minCol, Math.min(bounds.maxCol, xOffset + zoomBounds.minCol));
        const absMaxCol = Math.max(bounds.minCol, Math.min(bounds.maxCol, xOffset + zoomBounds.maxCol));
        const absMinRow = Math.max(bounds.minRow, Math.min(bounds.maxRow, yOffset + zoomBounds.minRow));
        const absMaxRow = Math.max(bounds.minRow, Math.min(bounds.maxRow, yOffset + zoomBounds.maxRow));

        const currentX = hasX ? xRange : [bounds.minCol, bounds.maxCol] as Range;
        const currentY = hasY ? yRange : [bounds.minRow, bounds.maxRow] as Range;

        // Clear only the transient selection; do not delete the saved view
        setActiveSelection(null)

        const nextXRange: Range = [
            Math.max(currentX[0], Math.min(absMinCol, absMaxCol)),
            Math.min(currentX[1], Math.max(absMinCol, absMaxCol))
        ]
        const nextYRange: Range = [
            Math.max(currentY[0], Math.min(absMinRow, absMaxRow)),
            Math.min(currentY[1], Math.max(absMinRow, absMaxRow))
        ]

        setXRange(nextXRange)
        setYRange(nextYRange)

        const nextBounds: HeatmapBounds = {
            minCol: Math.max(bounds.minCol, nextXRange[0]),
            maxCol: Math.min(bounds.maxCol, nextXRange[1]),
            minRow: Math.max(bounds.minRow, nextYRange[0]),
            maxRow: Math.min(bounds.maxRow, nextYRange[1]),
        }

        updateView(zoomBounds, nextBounds)
    }, [setActiveSelection, bounds, xRange, yRange, activeSelection, updateView, setXRange, setYRange])

    return {
        clearSelection,
        onMouseDown,
        zoomIntoActiveSelection,
        activeSelection,
    }

}
