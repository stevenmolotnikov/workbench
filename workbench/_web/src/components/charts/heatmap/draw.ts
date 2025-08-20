import { heatmapMargin as margin } from "../theming"
import { HeatmapBounds } from "@/types/charts"
import { CellDimensions } from "./heatmap-geometry"

export const clearRect = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
}

export const drawRect = (canvasRef: React.RefObject<HTMLCanvasElement>, bounds: HeatmapBounds, dims: CellDimensions) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    const minCol = Math.min(bounds.minCol, bounds.maxCol)
    const maxCol = Math.max(bounds.minCol, bounds.maxCol)
    const minRow = Math.min(bounds.minRow, bounds.maxRow)
    const maxRow = Math.max(bounds.minRow, bounds.maxRow)
    const x = margin.left + minCol * dims.width
    const y = margin.top + minRow * dims.height
    const w = (maxCol - minCol + 1) * dims.width
    const h = (maxRow - minRow + 1) * dims.height
    ctx.fillStyle = 'rgba(239,68,68,0.25)'
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 1
    ctx.fillRect(x, y, w, h)
    const sx = x + 0.5
    const sy = y + 0.5
    const sw = Math.max(0, w - 1)
    const sh = Math.max(0, h - 1)
    ctx.strokeRect(sx, sy, sw, sh)
}