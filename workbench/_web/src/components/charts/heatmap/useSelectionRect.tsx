import { heatmapMargin as margin } from "../theming";
import { getCellDimensions } from "./heatmap-geometry";
import { HeatmapData } from "@/types/charts";
import { useCallback, useEffect, useMemo, useRef } from "react";

interface SelectionRect {
    startX: number
    startY: number
    endX: number
    endY: number
}

interface useSelectionRectProps {
    canvasRef: React.RefObject<HTMLCanvasElement>
    data: HeatmapData
    chartId: string | null
    selectionRect: SelectionRect | null
    highlightedCellIds: Set<string>
}

const useSelectionRect = ({ canvasRef, data, chartId, selectionRect, highlightedCellIds }: useSelectionRectProps) => {
    const animationFrameRef = useRef<number>()

    // Map x values to their column index for fast lookup during draw
    const xIndexByValue = useMemo(() => {
        const firstRow = data.rows[0]
        const map = new Map<number, number>()
        if (firstRow) {
            for (let i = 0; i < firstRow.data.length; i++) {
                const xVal = firstRow.data[i]?.x as number
                if (typeof xVal === 'number') {
                    map.set(xVal, i)
                }
            }
        }
        return map
    }, [data])


    const drawCellBorder = (
        ctx: CanvasRenderingContext2D,
        row: number,
        col: number,
        dims: { cellWidth: number; cellHeight: number },
        style: { strokeStyle: string; lineWidth: number }
    ) => {
        const x = margin.left + col * dims.cellWidth
        const y = margin.top + row * dims.cellHeight
        const width = dims.cellWidth
        const height = dims.cellHeight
        ctx.strokeStyle = style.strokeStyle
        ctx.lineWidth = style.lineWidth
        ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, width - 1), Math.max(0, height - 1))
    }

    // Draw selection on canvas
    const drawSelection = useCallback((
        chartId: string | null,
        selectionRect: SelectionRect | null
    ) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");

        if (!canvas || !ctx) return;

        const dims = getCellDimensions(canvasRef, data);
        if (!dims) return;

        // Clear canvas (accounting for device pixel ratio)
        const dpr = window.devicePixelRatio || 1;
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        // Draw highlighted cells (persisted + pending view)
        if (highlightedCellIds && highlightedCellIds.size > 0) {
            highlightedCellIds.forEach((cellId) => {
                const parts = cellId.split("-")
                if (parts.length >= 3) {
                    const row = parseInt(parts[parts.length - 2])
                    const col = parseInt(parts[parts.length - 1])
                    if (!Number.isNaN(row) && !Number.isNaN(col)) {
                        drawCellBorder(ctx, row, col, dims, { strokeStyle: "#ef4444", lineWidth: 2 })
                    }
                }
            })
        }

        // Draw current selection rectangle
        if (selectionRect) {
            // Translate absolute x values to column indices
            const startXIdx = xIndexByValue.get(selectionRect.startX) ?? -1;
            const endXIdx = xIndexByValue.get(selectionRect.endX) ?? -1;
            if (startXIdx === -1 || endXIdx === -1) return;

            const bounds = {
                minCol: Math.min(startXIdx, endXIdx),
                maxCol: Math.max(startXIdx, endXIdx),
                minRow: Math.min(selectionRect.startY, selectionRect.endY),
                maxRow: Math.max(selectionRect.startY, selectionRect.endY),
            };

            // Draw a translucent blue overlay for zoom selection
            const x = margin.left + bounds.minCol * dims.cellWidth;
            const y = margin.top + bounds.minRow * dims.cellHeight;
            const width = (bounds.maxCol - bounds.minCol + 1) * dims.cellWidth;
            const height = (bounds.maxRow - bounds.minRow + 1) * dims.cellHeight;
            ctx.fillStyle = "rgba(59, 130, 246, 0.25)";
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 2;
            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);
        }
    }, [canvasRef, data, xIndexByValue, highlightedCellIds]);

    // Redraw when selection changes
    useEffect(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }
        animationFrameRef.current = requestAnimationFrame(() => {
            drawSelection(chartId, selectionRect)
        })
    }, [selectionRect, chartId, drawSelection])
}

export default useSelectionRect;