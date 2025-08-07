"use client";

import { useState, useEffect } from 'react'
import { ResponsiveHeatMap } from '@nivo/heatmap'
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

export function Heatmap({
    data,
}: HeatmapProps) {
    const { pendingAnnotation, setPendingAnnotation } = useAnnotations()
    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
    const [isDragging, setIsDragging] = useState(false)

    const { activeTab: chartId } = useWorkspace();

    const { data: allAnnotations } = useQuery({
        queryKey: ["annotations"],
        queryFn: () => getAnnotations(chartId as string),
        enabled: !!chartId,
    });

    const annotations: HeatmapAnnotation[] = allAnnotations?.filter(a => a.type === "heatmap").map(a => a.data as HeatmapAnnotation) || []

    useEffect(() => {   
        if (!pendingAnnotation || pendingAnnotation.type !== 'heatmap') {
            setSelectedCells(new Set())
        }
    }, [pendingAnnotation])

    const CustomCell = ({
        cell,
        borderWidth,
        onMouseEnter,
        onMouseMove,
        onMouseLeave,
        enableLabels,
    }: CellComponentProps<HeatmapCell>) => {

        if (cell.value === null || chartId === undefined) return null

        const cellId = `${chartId}-${cell.serieId}-${cell.data.x}`

        let isSelected = false
        if (selectedCells.has(cellId) || annotations?.some(a => {
            return Array.isArray(a.cellIds) && a.cellIds.includes(cellId);
        })) {
            isSelected = true
        }

        const handleMouseDown = () => {
            setIsDragging(true)
            setSelectedCells(new Set([cellId]))
        }

        const handleMouseEnter = () => {
            if (isDragging) {
                setSelectedCells(prev => new Set([...prev, cellId]))
            }
            onMouseEnter?.(cell)
        }

        const strokeWidth = isSelected ? 2 : borderWidth
        const adjustedWidth = cell.width - strokeWidth
        const adjustedHeight = cell.height - strokeWidth

        return (
            <g
                transform={`translate(${cell.x}, ${cell.y})`}
                onMouseDown={handleMouseDown}
                onMouseEnter={handleMouseEnter}
                onMouseMove={onMouseMove?.(cell)}
                onMouseLeave={onMouseLeave?.(cell)}
                style={{ cursor: 'pointer' }}
            >
                <rect
                    x={-adjustedWidth / 2}
                    y={-adjustedHeight / 2}
                    width={adjustedWidth}
                    height={adjustedHeight}
                    fill={cell.color}
                    fillOpacity={isSelected ? cell.opacity * 0.7 : cell.opacity}
                    strokeWidth={strokeWidth}
                    stroke={isSelected ? 'red' : cell.borderColor}
                />
                {enableLabels && (
                    <text
                        dominantBaseline="central"
                        textAnchor="middle"
                        className="select-none"
                        style={{ fill: cell.labelTextColor, fontSize: 10 }}
                    >
                        {cell.formattedValue}
                    </text>
                )}
            </g>
        )
    }


    const handleMouseUp = () => {
        setIsDragging(false)
        setPendingAnnotation({
            type: "heatmap",
            cellIds: Array.from(selectedCells),
            text: ""
        })
    }

    return (
        <div 
            className="size-full"
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDragging(false)}
        >
            <ResponsiveHeatMap
                data={data.rows}
                margin={{ top: 50, right: 80, bottom: 50, left: 50 }}
                valueFormat=">-.2f"
                axisTop={null}
                axisBottom={{
                    legend: 'layer',
                    tickRotation: 0,
                    legendOffset: 30,
                    tickSize: 5,
                    tickPadding: 5
                }}
                axisLeft={{
                    tickSize: 5,
                    tickPadding: 5
                }}
                label={(cell) => cell.data.label || ''}
                labelTextColor='hsl(var(--foreground))'
                colors={{
                    type: 'sequential',
                    scheme: 'blues',
                    minValue: 0,
                    maxValue: 1
                }}
                hoverTarget="cell"
                emptyColor="hsl(var(--muted))"
                inactiveOpacity={1}
                cellComponent={CustomCell}
                theme={heatmapTheme}
                animate={false}
                legends={[
                    {
                        anchor: 'right',
                        translateX: 30,
                        translateY: 0,
                        length: 400,
                        thickness: 6,
                        direction: 'column',
                        tickPosition: 'after',
                        tickSize: 3,
                        tickSpacing: 4,
                        tickOverlap: false,
                        tickFormat: '>-.2f',
                        titleAlign: 'start',
                        titleOffset: 4
                    }
                ]}
            />
        </div>
    )
}