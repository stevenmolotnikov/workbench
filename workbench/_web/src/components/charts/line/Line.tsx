"use client";

import type { LineGraphData } from "@/types/charts";
import { LineSeries, PointOrSliceMouseHandler, ResponsiveLine } from '@nivo/line'
import { lineTheme } from '../theming'
import { useLineAnnotationLayer, LineAnnotationLayer } from './LineAnnotationLayer'
import { useState } from "react";

interface LineProps {
    data?: LineGraphData;
    yRange?: [number, number];
}

export interface RangeSelection {
    lineId: string;
    ranges: Array<[number, number]>;
}

export function Line({ data, yRange }: LineProps) {
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
            margin={{ top: 50, right: 30, bottom: 70, left: 75 }}
            yScale={{ 
                type: 'linear', 
                min: yRange ? yRange[0] : 0, 
                max: yRange ? yRange[1] : 1, 
                stacked: false, 
                reverse: false,
            }}
            axisBottom={{
                legend: 'Layer',
                legendOffset: 35,
                tickSize: 0,
                tickPadding: 10,
                tickRotation: 0
            }}
            axisLeft={{
                legend: 'Probability',
                legendOffset: -45,
                tickSize: 0,
                tickPadding: 10,
                tickRotation: 0,
            }}
            useMesh={true}
            theme={lineTheme}
            colors={{ scheme: 'set1' }}
            enableGridX={false}
            animate={false}
            yFormat=">-.2f"
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
                    itemWidth: 60,
                    itemHeight: 20,
                    itemTextColor: 'hsl(var(--foreground))',
                    symbolSize: 6,
                    symbolShape: 'square'
                }
            ]}
        />
    );
}