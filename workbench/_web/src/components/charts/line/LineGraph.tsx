"use client";

import { useState, useMemo } from 'react';
import type { LineGraphData } from "@/types/charts";
import { ResponsiveLine } from '@nivo/line'
import { lineTheme } from '../primatives/theming'
import { LineSeries, PointOrSliceMouseHandler } from '@nivo/line'
import { LineAnnotationLayer } from './LineAnnotationLayer'
import { useAnnotations } from '@/stores/useAnnotations';
import { useQuery } from "@tanstack/react-query";
import { getLineAnnotations } from '@/lib/queries/annotationQueries';

interface LineGraphProps {
    chartId: string;
    data?: LineGraphData;
}

export interface RangeSelection {
    lineId: string;
    ranges: Array<[number, number]>;
}

export function LineGraph({ chartId, data }: LineGraphProps) {
    const { data: lineAnnotations } = useQuery({
        queryKey: ["lineAnnotations"],
        queryFn: () => getLineAnnotations(chartId),
    });

    const [hoveredPoint, setHoveredPoint] = useState<{ lineId: string; index: number } | null>(null);

    const { pendingAnnotation, setPendingAnnotation } = useAnnotations();

    const lineAnnotationLayer = useMemo(() => {
        return (props: any) => {
            return LineAnnotationLayer({ ...props, lineAnnotations, hoveredPoint });
        };
    }, [lineAnnotations, hoveredPoint]);

    if (!data) return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
            No data to display
        </div>
    )

    const handlePointClick: PointOrSliceMouseHandler<LineSeries> = (datum) => {
        // Only handle point clicks, not slice clicks
        if (!('seriesId' in datum)) return;

        const lineId = datum.seriesId as string;
        const layerIndex = datum.indexInSeries as number;

        if (!pendingAnnotation) {
            // First click - start selection
            setPendingAnnotation({ type: "line", lineId, layerStart: layerIndex, text: "" });
        }

        // Narrow type to line annotation
        if (pendingAnnotation && pendingAnnotation.type === "line") {
            // If the annotation is complete, start a new one
            if (pendingAnnotation.layerEnd) {
                setPendingAnnotation({ type: "line", lineId, layerStart: layerIndex, text: "" });
                return;
            };

            if (pendingAnnotation.lineId === lineId && pendingAnnotation.layerStart === layerIndex) {
                // Clicking same point - clear all selections
                setPendingAnnotation(null);
            } else if (pendingAnnotation.lineId === lineId) {
                // Second click on same line - add/complete range
                setPendingAnnotation({
                    ...pendingAnnotation,
                    layerStart: Math.min(pendingAnnotation.layerStart, layerIndex),
                    layerEnd: Math.max(pendingAnnotation.layerStart, layerIndex),
                });

            } else {
                // Different line - start new selection
                setPendingAnnotation({ type: "line", lineId, layerStart: layerIndex, text: "" });
            }
        }
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
            onClick={handlePointClick}
            onMouseMove={handleMouseMove}
            enablePoints={false}
            layers={[
                'grid',
                'axes',
                lineAnnotationLayer,
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