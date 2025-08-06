"use client";

import { ResponsiveHeatMap } from '@nivo/heatmap'
import { HeatmapData, HeatmapCell } from '@/types/charts'
import { heatmapTheme } from './theming'
import { CellComponentProps } from '@nivo/heatmap'
import { useLensWorkspace } from '@/stores/useLensWorkspace';


interface HeatmapProps {
    data: HeatmapData
}


export function Heatmap({
    data,
}: HeatmapProps) {
    const { clickedComponent } = useLensWorkspace();

    const CustomCell = ({
        cell,
        borderWidth,
        onMouseEnter,
        onMouseMove,
        onMouseLeave,
        onClick,
        enableLabels,
        animatedProps
    }: CellComponentProps<HeatmapCell>) => {
        if (cell.value === null) return null

        // Get the actual x,y indices from the cell's data
        const layerIndex = cell.data.x
        const tokenIndex = data.rows.findIndex(row => row.id === cell.serieId)

        const isActive = layerIndex === clickedComponent?.layerIndex && tokenIndex === clickedComponent?.tokenIndex

        return (
            <g
                transform={`translate(${cell.x}, ${cell.y})`}
                onMouseEnter={onMouseEnter?.(cell)}
                onMouseMove={onMouseMove?.(cell)}
                onMouseLeave={onMouseLeave?.(cell)}
                onClick={onClick?.(cell)}
            >
                <rect
                    x={-cell.width / 2}
                    y={-cell.height / 2}
                    width={cell.width}
                    height={cell.height}
                    fill={cell.color}
                    fillOpacity={cell.opacity}
                    strokeWidth={isActive ? 3 : borderWidth}
                    stroke={isActive ? 'hsl(var(--primary))' : cell.borderColor}
                />
                {enableLabels && (
                    <text
                        dominantBaseline="central"
                        textAnchor="middle"
                        style={{ fill: cell.labelTextColor, fontSize: 10 }}
                    >
                        {cell.formattedValue}
                    </text>
                )}
            </g>
        )
    }

    return <ResponsiveHeatMap
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
        annotations={[]}
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
}
