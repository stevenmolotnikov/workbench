import { useCallback, useEffect, useRef } from "react";
import { HeatmapData } from "@/types/charts";
import { heatmapMargin as margin } from "../theming";
import { getCellDimensions } from "./heatmap-geometry";

export const usePaintCanvas = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    data: HeatmapData,
    highlightedCellIds: Set<string>,
) => {
    const animationFrameRef = useRef<number | null>(null)

    const draw = useCallback(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext("2d")
        if (!canvas || !ctx) return

        // Clear respecting device pixel ratio
        const dpr = window.devicePixelRatio || 1
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

        const dims = getCellDimensions(canvasRef, data)
        if (!dims) return

        // Since our ids are `${chartId}-${row}-${col}` and chartId varies,
        // parse row/col from the tail, and rebuild neighbor keys similarly.
        const keyFor = (r: number, c: number) => `${r}-${c}`
        const paintedRC = new Set<string>()
        highlightedCellIds.forEach((cellId) => {
            const parts = cellId.split("-")
            if (parts.length >= 3) {
                const row = parseInt(parts[parts.length - 2])
                const col = parseInt(parts[parts.length - 1])
                if (!Number.isNaN(row) && !Number.isNaN(col)) {
                    paintedRC.add(keyFor(row, col))
                }
            }
        })

        const hasRC = (r: number, c: number) => paintedRC.has(keyFor(r, c))

        // 1) Fill interior slightly red
        ctx.fillStyle = "rgba(239, 68, 68, 0.12)" // red-500 @ ~12% opacity
        paintedRC.forEach((rc) => {
            const [rStr, cStr] = rc.split("-")
            const row = parseInt(rStr)
            const col = parseInt(cStr)
            const x = margin.left + col * dims.cellWidth
            const y = margin.top + row * dims.cellHeight
            ctx.fillRect(x, y, dims.cellWidth, dims.cellHeight)
        })

        // 2) Draw only the outer border of the painted area
        ctx.strokeStyle = "#ef4444" // red-500
        ctx.lineWidth = 2
        ctx.beginPath()

        paintedRC.forEach((rc) => {
            const [rStr, cStr] = rc.split("-")
            const row = parseInt(rStr)
            const col = parseInt(cStr)
            const x = margin.left + col * dims.cellWidth
            const y = margin.top + row * dims.cellHeight

            // Top edge
            if (!hasRC(row - 1, col)) {
                ctx.moveTo(x + 0.5, y + 0.5)
                ctx.lineTo(x + dims.cellWidth - 0.5, y + 0.5)
            }
            // Bottom edge
            if (!hasRC(row + 1, col)) {
                const by = y + dims.cellHeight
                ctx.moveTo(x + 0.5, by - 0.5)
                ctx.lineTo(x + dims.cellWidth - 0.5, by - 0.5)
            }
            // Left edge
            if (!hasRC(row, col - 1)) {
                ctx.moveTo(x + 0.5, y + 0.5)
                ctx.lineTo(x + 0.5, y + dims.cellHeight - 0.5)
            }
            // Right edge
            if (!hasRC(row, col + 1)) {
                const rx = x + dims.cellWidth
                ctx.moveTo(rx - 0.5, y + 0.5)
                ctx.lineTo(rx - 0.5, y + dims.cellHeight - 0.5)
            }
        })

        ctx.stroke()
    }, [canvasRef, data, highlightedCellIds])

    useEffect(() => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = requestAnimationFrame(() => {
            draw()
        })
    }, [draw])
}

export default usePaintCanvas;

