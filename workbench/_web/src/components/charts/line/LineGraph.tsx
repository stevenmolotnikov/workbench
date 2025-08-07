"use client";

import type { LineGraphData } from "@/types/charts";
import { LineSeries, PointOrSliceMouseHandler, ResponsiveLine } from '@nivo/line'
import { lineTheme } from '../primatives/theming'
import { useLineAnnotationLayer, LineAnnotationLayer } from './LineAnnotationLayer'
import { useState } from "react";

interface LineGraphProps {
    data?: LineGraphData;
}

export interface RangeSelection {
    lineId: string;
    ranges: Array<[number, number]>;
}

export function LineGraph({ data }: LineGraphProps) {
    const { addPendingAnnotation } = useLineAnnotationLayer();
    const [hoveredPoint, setHoveredPoint] = useState<{ lineId: string; index: number } | null>(null);

    if (!data) return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
            No data to display
        </div>
    )

    const HoverIndicatorLayer = ({ series }: any) => {
        return (
            <g>
                {/* Render hover indicator (solid circle) */}
                {hoveredPoint && (() => {
                    const line = series.find(s => s.id === hoveredPoint.lineId);
                    if (!line) return null;
                    const point = line.data[hoveredPoint.index];
                    if (!point) return null;
    
                    return (
                        <circle
                            cx={point.position.x}
                            cy={point.position.y}
                            r={8}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth={2}
                        />
                    );
                })()}
            </g>
        );
    };

    const handleMouseMove: PointOrSliceMouseHandler<LineSeries> = (datum) => {
        if (!datum || !('seriesId' in datum)) {
            setHoveredPoint(null);
            return;
        }
        setHoveredPoint({
            lineId: datum.seriesId as string,
            index: datum.indexInSeries as number
        });
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
            useMesh={true}
            theme={lineTheme}
            colors={{ scheme: 'nivo' }}
            enableGridX={true}
            enableGridY={true}
            onClick={addPendingAnnotation}
            onMouseMove={handleMouseMove}
            enablePoints={false}
            layers={[
                'grid',
                'axes',
                'legends',
                HoverIndicatorLayer,
                LineAnnotationLayer,
                'mesh',
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