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
    const { clickedComponent, setClickedComponent } = useLensWorkspace();

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

        const handleOnClick = () => {
            if (typeof layerIndex !== 'number') {
                throw new Error('Layer index is not a number')
            }

            setClickedComponent({
                layerIndex,
                tokenIndex,
                componentType: 'resid'
            })
            onClick?.(cell)
        }

        const strokeWidth = isActive ? 2 : borderWidth
        const adjustedWidth = cell.width - strokeWidth
        const adjustedHeight = cell.height - strokeWidth

        return (
            <g
                transform={`translate(${cell.x}, ${cell.y})`}
                onMouseEnter={onMouseEnter?.(cell)}
                onMouseMove={onMouseMove?.(cell)}
                onMouseLeave={onMouseLeave?.(cell)}
                onClick={handleOnClick}
            >
                <rect
                    x={-adjustedWidth / 2}
                    y={-adjustedHeight / 2}
                    width={adjustedWidth}
                    height={adjustedHeight}
                    fill={cell.color}
                    fillOpacity={cell.opacity}
                    strokeWidth={strokeWidth}
                    stroke={isActive ? 'red' : cell.borderColor}
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
