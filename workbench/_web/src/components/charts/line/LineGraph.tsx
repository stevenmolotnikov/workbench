"use client";

import { useState, useMemo } from 'react';
import type { LineGraphData } from "@/types/charts";
import { ResponsiveLine } from '@nivo/line'
import { lineTheme } from '../primatives/theming'
import { LineSeries, LineCustomSvgLayerProps, PointOrSliceMouseHandler } from '@nivo/line'
import { LineAnnotationLayer } from './LineAnnotationLayer'

interface LineGraphProps {
    data?: LineGraphData;
}

export interface RangeSelection {
    lineId: string;
    ranges: Array<[number, number]>;
}

export function LineGraph({ data }: LineGraphProps) {
    const [selection, setSelection] = useState<RangeSelection | null>(null);
    const [firstClick, setFirstClick] = useState<{ lineId: string; index: number } | null>(null);

    const lineAnnotationLayer = useMemo(() => {
        return (props: LineCustomSvgLayerProps<LineSeries>) => {
            return LineAnnotationLayer({ ...props, selection });
        };
    }, [selection]);

    if (!data) return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
            No data to display
        </div>
    )

    const handlePointClick: PointOrSliceMouseHandler<LineSeries> = (datum) => {
        // Only handle point clicks, not slice clicks
        if (!('seriesId' in datum)) return;
        
        const lineId = datum.seriesId as string;
        const index = datum.indexInSeries as number;
        console.log(lineId, index);

        if (!firstClick) {
            // First click - start selection
            setFirstClick({ lineId, index });
        } else if (firstClick.lineId === lineId && firstClick.index === index) {
            // Clicking same point - clear all selections
            setFirstClick(null);
            setSelection(null);
        } else if (firstClick.lineId === lineId) {
            // Second click on same line - add/complete range
            const newRange: [number, number] = [
                Math.min(firstClick.index, index),
                Math.max(firstClick.index, index)
            ];

            if (selection?.lineId === lineId) {
                // Add to existing ranges for this line
                setSelection({
                    lineId,
                    ranges: [...selection.ranges, newRange]
                });
            } else {
                // Start new selection for this line
                setSelection({
                    lineId,
                    ranges: [newRange]
                });
            }
            setFirstClick(null);
        } else {
            // Different line - start new selection
            setFirstClick({ lineId, index });
            setSelection(null);
        }
    };

    return (
        <ResponsiveLine
            data={data.lines}
            margin={{ top: 30, right: 25, bottom: 50, left: 50 }}
            yScale={{ type: 'linear', min: 0, max: 1, stacked: true, reverse: false }}
            axisBottom={{
                legend: 'layer',
                legendOffset: 36,
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0
            }}
            axisLeft={{
                legend: 'probability',
                legendOffset: -40,
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0
            }}
            pointSize={8}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'seriesColor' }}
            pointLabelYOffset={-12}
            enableTouchCrosshair={true}
            useMesh={true}
            // enableCrosshair={false}
            theme={lineTheme}
            colors={{ scheme: 'nivo' }}
            enableGridX={true}
            enableGridY={true}
            onClick={handlePointClick}
            enablePoints={false}
            layers={[
                'grid',
                'markers',
                'axes',
                'areas',
                'crosshair',
                lineAnnotationLayer,
                'points',   
                'slices',
                'mesh',
                'legends',
            ]}
            legends={[
                {
                    anchor: 'top',
                    direction: 'row',
                    translateY: -30,
                    itemWidth: 80,
                    itemHeight: 20,
                    itemTextColor: 'hsl(var(--foreground))',
                    symbolSize: 12,
                    symbolShape: 'circle'
                }
            ]}
        />
    );
}