"use client";

import { ResponsiveHeatMap } from '@nivo/heatmap'
import { HeatmapData } from '@/types/charts'
import { heatmapTheme } from './theming'

interface HeatmapProps {
    data: HeatmapData
}

export function Heatmap({
    data,
}: HeatmapProps) {
    console.log(data.rows);
    return <ResponsiveHeatMap
        data={data.rows}
        margin={{ top: 60, right: 30, bottom: 100, left: 50 }}
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
        label={(cell) => cell.data.label}
        labelTextColor='hsl(var(--foreground))'
        colors={{
            type: 'sequential',
            scheme: 'blues',
            minValue: 0,
            maxValue: 1
        }}
        emptyColor="hsl(var(--muted))"
        theme={heatmapTheme}
        legends={[
            {
                anchor: 'bottom',
                translateX: 0,
                translateY: 70,
                length: 400,
                thickness: 8,
                direction: 'row',
                tickPosition: 'after',
                tickSize: 3,
                tickSpacing: 4,
                tickOverlap: false,
                tickFormat: '>-.2f',
                title: 'Value →',
                titleAlign: 'start',
                titleOffset: 4
            }
        ]}
    />
}
