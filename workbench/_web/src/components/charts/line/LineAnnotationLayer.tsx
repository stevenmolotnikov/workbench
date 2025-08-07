"use client";


import { ComputedSeries, ComputedDatum, LineSeries, LineCustomSvgLayerProps } from '@nivo/line'
import { RangeSelection } from './LineGraph'
import { Position } from '@/types/charts'

interface Segment {
    points: Position[];
    isAnnotated: boolean;
}

export interface LineAnnotationLayer extends LineCustomSvgLayerProps<LineSeries> {
    selection: RangeSelection | null;
}

// Custom line layer that renders segments with different colors
export const LineAnnotationLayer = ({ series, lineGenerator, selection }: LineAnnotationLayer) => {
    return (
        <g>
            {series.map(({ data, id, color }: ComputedSeries<LineSeries>) => {
                const isSelected = selection?.lineId === id;
                const points = data.map((d: ComputedDatum<LineSeries>) => d.position);

                if (!isSelected || !selection?.ranges.length) {
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
                    const isAnnotated = selection.ranges.some(
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
        </g>
    );
};