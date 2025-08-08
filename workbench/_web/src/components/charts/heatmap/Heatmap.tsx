"use client";

import { useState, useEffect, useRef, useCallback } from 'react'
// import { ResponsiveHeatMap } from '@nivo/heatmap'
import { ResponsiveHeatMapCanvas } from '@nivo/heatmap'
import { HeatmapData, HeatmapCell } from '@/types/charts'
import { heatmapTheme } from '../theming'
import { CellComponentProps } from '@nivo/heatmap'
import { useAnnotations } from '@/stores/useAnnotations';
import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '@/stores/useWorkspace';
import { getAnnotations } from '@/lib/queries/annotationQueries';
import { HeatmapAnnotation } from '@/types/annotations';


interface HeatmapProps {
    data: HeatmapData
}

interface SelectionRect {
    startX: number
    startY: number
    endX: number
    endY: number
}

export function Heatmap({
    data,
}: HeatmapProps) {
    const { pendingAnnotation, setPendingAnnotation } = useAnnotations()
    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
    const [isDragging, setIsDragging] = useState(false)
    const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationFrameRef = useRef<number>()

    const { activeTab: chartId } = useWorkspace();

    const { data: allAnnotations } = useQuery({
        queryKey: ["annotations"],
        queryFn: () => getAnnotations(chartId as string),
        enabled: !!chartId,
    });

    const annotations: HeatmapAnnotation[] = allAnnotations?.filter(a => a.type === "heatmap").map(a => a.data as HeatmapAnnotation) || []

    // Heatmap dimensions (matching Nivo's defaults)
    const margin = { top: 50, right: 80, bottom: 70, left: 80 }

    useEffect(() => {   
        if (!pendingAnnotation || pendingAnnotation.type !== 'heatmap') {
            setSelectedCells(new Set())
            setSelectionRect(null)
        }
    }, [pendingAnnotation])

    // Calculate cell dimensions based on container size and data
    const getCellDimensions = useCallback(() => {
        if (!containerRef.current || !data.rows.length || !data.rows[0].data.length) {
            return null
        }

        const container = containerRef.current
        const width = container.offsetWidth
        const height = container.offsetHeight

        const gridWidth = width - margin.left - margin.right
        const gridHeight = height - margin.top - margin.bottom

        const numCols = data.rows[0].data.length
        const numRows = data.rows.length

        const cellWidth = gridWidth / numCols
        const cellHeight = gridHeight / numRows

        return {
            cellWidth,
            cellHeight,
            gridWidth,
            gridHeight,
            numCols,
            numRows
        }
    }, [data.rows, margin.top, margin.right, margin.bottom, margin.left])

    // Convert mouse position to cell indices
    const getCellFromPosition = useCallback((x: number, y: number) => {
        const dims = getCellDimensions()
        if (!dims) return null

        const gridX = x - margin.left
        const gridY = y - margin.top

        if (gridX < 0 || gridY < 0 || gridX >= dims.gridWidth || gridY >= dims.gridHeight) {
            return null
        }

        const col = Math.floor(gridX / dims.cellWidth)
        const row = Math.floor(gridY / dims.cellHeight)

        if (col >= 0 && col < dims.numCols && row >= 0 && row < dims.numRows) {
            return { col, row }
        }

        return null
    }, [getCellDimensions, margin.left, margin.top])

    // Draw selection on canvas
    const drawSelection = useCallback(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        const dims = getCellDimensions()
        if (!dims) return

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw existing annotations
        if (annotations && chartId) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'
            ctx.strokeStyle = 'red'
            ctx.lineWidth = 2

            annotations.forEach(annotation => {
                if (Array.isArray(annotation.cellIds)) {
                    annotation.cellIds.forEach(cellId => {
                        const parts = cellId.split('-')
                        if (parts.length >= 3) {
                            const row = parseInt(parts[parts.length - 2])
                            const col = parseInt(parts[parts.length - 1])
                            
                            if (!isNaN(row) && !isNaN(col)) {
                                const x = margin.left + col * dims.cellWidth
                                const y = margin.top + row * dims.cellHeight
                                
                                ctx.fillRect(x, y, dims.cellWidth, dims.cellHeight)
                                ctx.strokeRect(x, y, dims.cellWidth, dims.cellHeight)
                            }
                        }
                    })
                }
            })
        }

        // Draw current selection rectangle
        if (selectionRect) {
            const minCol = Math.min(selectionRect.startX, selectionRect.endX)
            const maxCol = Math.max(selectionRect.startX, selectionRect.endX)
            const minRow = Math.min(selectionRect.startY, selectionRect.endY)
            const maxRow = Math.max(selectionRect.startY, selectionRect.endY)

            const x = margin.left + minCol * dims.cellWidth
            const y = margin.top + minRow * dims.cellHeight
            const width = (maxCol - minCol + 1) * dims.cellWidth
            const height = (maxRow - minRow + 1) * dims.cellHeight

            ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'
            ctx.strokeStyle = '#3b82f6'
            ctx.lineWidth = 2

            ctx.fillRect(x, y, width, height)
            ctx.strokeRect(x, y, width, height)
        }
    }, [selectionRect, getCellDimensions, annotations, chartId, margin])

    // Handle canvas resize
    useEffect(() => {
        const updateCanvasSize = () => {
            if (canvasRef.current && containerRef.current) {
                canvasRef.current.width = containerRef.current.offsetWidth
                canvasRef.current.height = containerRef.current.offsetHeight
                drawSelection()
            }
        }

        updateCanvasSize()
        window.addEventListener('resize', updateCanvasSize)
        return () => window.removeEventListener('resize', updateCanvasSize)
    }, [drawSelection])

    // Redraw when selection changes
    useEffect(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }
        animationFrameRef.current = requestAnimationFrame(() => {
            drawSelection()
        })
    }, [selectionRect, drawSelection])

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cell = getCellFromPosition(x, y)

        if (cell) {
            setIsDragging(true)
            setSelectionRect({
                startX: cell.col,
                startY: cell.row,
                endX: cell.col,
                endY: cell.row
            })
            setSelectedCells(new Set())
        }
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging || !selectionRect) return

        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cell = getCellFromPosition(x, y)

        if (cell) {
            setSelectionRect(prev => prev ? {
                ...prev,
                endX: cell.col,
                endY: cell.row
            } : null)
        }
    }

    const handleMouseUp = () => {
        if (isDragging && selectionRect && chartId) {
            const minCol = Math.min(selectionRect.startX, selectionRect.endX)
            const maxCol = Math.max(selectionRect.startX, selectionRect.endX)
            const minRow = Math.min(selectionRect.startY, selectionRect.endY)
            const maxRow = Math.max(selectionRect.startY, selectionRect.endY)

            const cells = new Set<string>()
            for (let row = minRow; row <= maxRow; row++) {
                for (let col = minCol; col <= maxCol; col++) {
                    cells.add(`${chartId}-${row}-${col}`)
                }
            }

            setSelectedCells(cells)
            setPendingAnnotation({
                type: "heatmap",
                cellIds: Array.from(cells),
                text: ""
            })
        }
        setIsDragging(false)
    }

    return (
        <div 
            ref={containerRef}
            className="size-full relative"
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDragging(false)}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-auto z-10"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                style={{ cursor: 'crosshair' }}
            />
            <ResponsiveHeatMapCanvas
                data={data.rows}
                margin={{ top: 50, right: 80, bottom: 70, left: 80 }}
                valueFormat=">-.2f"
                axisTop={null}
                axisBottom={{
                    legend: 'Layer',
                    legendOffset: 40,
                    tickSize: 0,
                    tickPadding: 10,
                }}
                axisLeft={{
                    tickSize: 0,
                    tickPadding: 10,
                    format: (value) => String(value).replace(/-\d+$/, ''),
                }}
                label={(cell) => cell.data.label || ''}
                labelTextColor={(cell) => {
                    // Use white text for dark cells, black for light cells
                    const value = cell.data.y
                    return value !== null && value > 0.5 ? '#ffffff' : '#000000'
                }}
                colors={{
                    type: 'sequential',
                    scheme: 'blues',
                    minValue: 0,
                    maxValue: 1
                }}
                hoverTarget="cell"
                emptyColor="hsl(var(--muted))"
                inactiveOpacity={1}
                theme={heatmapTheme}
                animate={false}
                legends={[
                    {
                        anchor: 'right',
                        translateX: 30,
                        translateY: 0,
                        length: 400,
                        thickness: 8,
                        direction: 'column',
                        tickPosition: 'after',
                        tickSize: 3,
                        tickSpacing: 4,
                        tickOverlap: false,
                        tickFormat: '>-.2f',
                        titleAlign: 'start',
                    }
                ]}
            />
        </div>
    )
}