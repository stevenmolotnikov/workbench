"use client";

import { ComputedSeries, ComputedDatum, LineSeries, LineCustomSvgLayerProps } from '@nivo/line'
import { Position } from '@/types/charts'
import { LineAnnotation } from '@/types/annotations'
import { useAnnotations } from '@/stores/useAnnotations';

interface Segment {
    points: Position[];
    isAnnotated: boolean;
}

export interface LineAnnotationLayer extends LineCustomSvgLayerProps<LineSeries> {
    annotations: LineAnnotation[] | null;
    hoveredPoint: { lineId: string; index: number } | null;
}

// Custom line layer that renders segments with different colors
export const LineAnnotationLayer = ({ series, lineGenerator, annotations, hoveredPoint }: LineAnnotationLayer) => {
    const { pendingAnnotation } = useAnnotations();

    if (pendingAnnotation && pendingAnnotation.type !== "line") return null;

    return (
        <g>
            {series.map(({ data, id, color }: ComputedSeries<LineSeries>) => {
                let relevantRanges = annotations?.filter(s => s.lineId === id).map(s => [s.layerStart, s.layerEnd]);
                if (pendingAnnotation && pendingAnnotation.lineId === id && "layerEnd" in pendingAnnotation) {
                    if (relevantRanges) {
                        relevantRanges.push([pendingAnnotation.layerStart, pendingAnnotation.layerEnd]);
                    } else {
                        relevantRanges = [[pendingAnnotation.layerStart, pendingAnnotation.layerEnd]];
                    }
                }
                const points = data.map((d: ComputedDatum<LineSeries>) => d.position);

                if (!relevantRanges || relevantRanges.length === 0) {
                    // Render entire line normally
                    return (
                        <path
                            key={id}
                            d={lineGenerator(points) || ''}
                            fill="none"
                            stroke={color}
                            strokeWidth={2}
                        />
                    );
                }

                // Render line in segments based on ranges
                const segments: Segment[] = [];
                for (let i = 0; i < data.length - 1; i++) {
                    const isAnnotated = relevantRanges.some(
                        ([start, end]) => i >= start && i < end
                    );

                    // Group consecutive points with same highlight state
                    if (segments.length === 0 || segments[segments.length - 1].isAnnotated !== isAnnotated) {
                        segments.push({
                            points: [data[i].position],
                            isAnnotated
                        });
                    }
                    segments[segments.length - 1].points.push(data[i + 1].position);
                }

                return (
                    <g key={id}>
                        {segments.map((segment, idx) => (
                            <path
                                key={idx}
                                d={lineGenerator(segment.points) || ''}
                                fill="none"
                                stroke={segment.isAnnotated ? '#3b82f6' : color}
                                strokeWidth={2}
                            />
                        ))}
                    </g>
                );
            })}

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

            {/* Render start point indicator (dashed circle) */}
            {(pendingAnnotation) && (() => {
                const line = series.find(s => s.id === pendingAnnotation.lineId);
                if (!line) return null;
                const startPoint = line.data[pendingAnnotation.layerStart];
                if (!startPoint) return null;

                if (pendingAnnotation.layerEnd) {
                    const endPoint = line.data[pendingAnnotation.layerEnd];
                    if (!endPoint) return null;

                    return (
                        <>
                            <circle
                                cx={startPoint.position.x}
                                cy={startPoint.position.y}
                                r={8}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                strokeDasharray="5,5"
                            />
                            <circle
                                cx={endPoint.position.x}
                                cy={endPoint.position.y}
                                r={8}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                strokeDasharray="5,5"
                            />
                        </>
                    );

                }

                // The position is already in pixel coordinates
                return (
                    <circle
                        cx={startPoint.position.x}
                        cy={startPoint.position.y}
                        r={8}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="5,5"
                    />
                );
            })()}
        </g>
    );
};