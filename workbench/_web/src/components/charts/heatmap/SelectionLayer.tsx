import { useAnnotations } from "@/stores/useAnnotations";
import { useWorkspace } from "@/stores/useWorkspace";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, RefObject } from "react";
import { getAnnotations } from "@/lib/queries/annotationQueries";
import { HeatmapAnnotation } from "@/types/annotations";
import { HeatmapData } from "@/types/charts";
import { getCellFromPosition } from "./utils/heatmap-geometry";
import { drawSelection } from "./utils/draw-utils";
import { useHeatmap } from "./HeatmapProvider";

interface SelectionRect {
    startX: number
    startY: number
    endX: number
    endY: number
}

interface UseSelectionClickProps {
    canvasRef: RefObject<HTMLCanvasElement>
    data: HeatmapData
    mode?: "annotation" | "zoom"
    enabled?: boolean
}

const useSelectionClick = ({ canvasRef, data, mode = 'annotation', enabled = true }: UseSelectionClickProps) => {
    const { handleZoomComplete: onZoomComplete } = useHeatmap()
    const { pendingAnnotation, setPendingAnnotation } = useAnnotations()
    const [isSelecting, setIsSelecting] = useState(false)
    const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null)
    const animationFrameRef = useRef<number>()

    const { activeTab: chartId } = useWorkspace();

    const { data: allAnnotations } = useQuery({
        queryKey: ["annotations", chartId],
        queryFn: () => getAnnotations(chartId as string),
        enabled: !!chartId,
    });

    const annotations: HeatmapAnnotation[] = allAnnotations?.filter(a => a.type === "heatmap").map(a => a.data as HeatmapAnnotation) || []

    // Clear selection when pending annotation cancelled or not a heatmap
    useEffect(() => {   
        if (!pendingAnnotation || pendingAnnotation.type !== 'heatmap') {
            setSelectionRect(null)
        }
    }, [pendingAnnotation])

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
                
                drawSelection(canvasRef, data, annotations, chartId, selectionRect)
            }
        }

        updateCanvasSize()
        window.addEventListener('resize', updateCanvasSize)
        return () => window.removeEventListener('resize', updateCanvasSize)
    }, [drawSelection, canvasRef, data, annotations, chartId, selectionRect])

    // Redraw when selection changes
    useEffect(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }
        animationFrameRef.current = requestAnimationFrame(() => {
            drawSelection(canvasRef, data, annotations, chartId, selectionRect)
        })
    }, [selectionRect, canvasRef, data, annotations, chartId, selectionRect])

    // Handle click from Nivo canvas
    const handleCellClick = useCallback((cell: any) => {
        if (!enabled) return
        if (!chartId) return

        // Extract row and column indices from the cell data
        const rowIndex = data.rows.findIndex(r => r.id === cell.serieId)
        const colIndexXValue = cell.data.x
        
        if (rowIndex === -1 || colIndexXValue === undefined) return

        if (!isSelecting) {
            // Start new selection
            setIsSelecting(true)
            setSelectionRect({
                startX: colIndexXValue,
                startY: rowIndex,
                endX: colIndexXValue,
                endY: rowIndex
            })
        } else if (selectionRect) {
            // Finalize selection
            const minCol = Math.min(selectionRect.startX, colIndexXValue)
            const maxCol = Math.max(selectionRect.startX, colIndexXValue)
            const minRow = Math.min(selectionRect.startY, rowIndex)
            const maxRow = Math.max(selectionRect.startY, rowIndex)

            if (mode === 'zoom') {
                onZoomComplete?.({ minRow, maxRow, minCol, maxCol })
                setIsSelecting(false)
                setSelectionRect(null)
                return
            }

            const cells = new Set<string>()
            for (let row = minRow; row <= maxRow; row++) {
                for (let col = minCol; col <= maxCol; col++) {
                    cells.add(`${chartId}-${row}-${col}`)
                }
            }

            setPendingAnnotation({
                type: "heatmap",
                cellIds: Array.from(cells),
                text: ""
            })
            setIsSelecting(false)
        }
    }, [selectionRect, data.rows, chartId, setPendingAnnotation, mode, enabled, onZoomComplete])

    // Handle mouse move on the container (for selection preview)
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!enabled) return
        if (!isSelecting || !selectionRect) return

        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cell = getCellFromPosition(canvasRef, data, x, y)

        if (cell) {
            const firstRow = data.rows[0]
            const xVal = firstRow.data[cell.col]?.x
            setSelectionRect(prev => prev ? {
                ...prev,
                endX: typeof xVal === 'number' ? xVal : Number(xVal),
                endY: cell.row
            } : null)
        }
    }, [selectionRect, enabled, isSelecting, data.rows])

    return {
        handleCellClick,
        handleMouseMove,
    }
}

export default useSelectionClick