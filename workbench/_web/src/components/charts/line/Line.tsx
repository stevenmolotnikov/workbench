"use client";

import type { LineGraphData } from "@/types/charts";
import { ResponsiveLine } from '@nivo/line'
import type { PointOrSliceMouseHandler } from '@nivo/line'
import type { Line as ChartLine } from '@/types/charts'
import { lineMargin, lineTheme, lineColors } from '../theming'
import { useMemo } from "react";
import { resolveThemeCssVars } from "@/lib/utils";
import { Margin } from "@nivo/core";

interface LineProps {
    data: LineGraphData;
    onLegendClick?: (lineId: string) => void;
    margin?: Margin;
    yRange?: [number, number];
    highlightedLines?: Set<string>;
    onMouseDown?: PointOrSliceMouseHandler<ChartLine>;
    onMouseMove?: PointOrSliceMouseHandler<ChartLine>;
    onMouseUp?: PointOrSliceMouseHandler<ChartLine>;
    onMouseLeave?: PointOrSliceMouseHandler<ChartLine>;
}

export interface RangeSelection {
    lineId: string;
    ranges: Array<[number, number]>;
}

export function Line({ data, margin = lineMargin, onLegendClick = () => { }, yRange = [0, 1], highlightedLines = new Set<string>(), onMouseDown, onMouseMove, onMouseUp, onMouseLeave }: LineProps) {
    const resolvedTheme = useMemo(() => resolveThemeCssVars(lineTheme), [])

    const handleLegendClick = (lineId: string) => {
        onLegendClick(lineId)
    };

    // Create color mapping for lines
    const colorFn = useMemo(() => {
        const hasHighlighted = highlightedLines.size > 0;
        return (line: { id: string }) => {
            const lineIndex = data.lines.findIndex(l => l.id === line.id);
            const baseColor = lineColors[lineIndex % lineColors.length];
            if (!hasHighlighted || highlightedLines.has(line.id)) return baseColor;
            return '#d3d3d3';
        };
    }, [data.lines, highlightedLines]);

    return (
        <div className="h-full">
            <div
                className="flex flex-row gap-3 justify-center h-[5%]"
            >
                {data.lines.map((line, index) => {
                    const color = lineColors[index % lineColors.length];
                    const isHighlighted = highlightedLines.has(line.id);
                    const hasAnyHighlighted = highlightedLines.size > 0;

                    return (
                        <button
                            key={line.id}
                            onClick={() => handleLegendClick(line.id)}
                            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            style={{
                                opacity: hasAnyHighlighted && !isHighlighted ? 0.5 : 1
                            }}
                        >
                            <span
                                className="w-3 h-3 rounded-full"
                                style={{
                                    backgroundColor: hasAnyHighlighted && !isHighlighted ? '#d3d3d3' : color
                                }}
                            />
                            <span className="text-sm">{line.id}</span>
                        </button>
                    );
                })}
            </div>
            <div className="h-[95%] select-none">
                <ResponsiveLine
                    data={data.lines}
                    margin={margin}
                    yScale={{
                        type: 'linear',
                        min: yRange[0],
                        max: yRange[1],
                        stacked: false,
                        reverse: false,
                    }}
                    axisBottom={{
                        legend: 'Layer',
                        legendOffset: 35,
                        tickSize: 0,
                        tickPadding: 10,
                        tickRotation: 0,
                    }}
                    axisLeft={{
                        legend: 'Probability',
                        legendOffset: -45,
                        tickSize: 0,
                        tickPadding: 10,
                        tickRotation: 0,
                    }}
                    theme={resolvedTheme}
                    colors={colorFn}
                    enableGridX={false}
                    isInteractive={true}
                    yFormat=">-.2f"
                    animate={false}
                    enableSlices={"x"}
                    enableGridY={true}
                    enablePoints={true}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseLeave}
                />
            </div>
        </div>
    );
}