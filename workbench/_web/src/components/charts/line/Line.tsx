"use client";

import type { LineGraphData } from "@/types/charts";
import { ResponsiveLineCanvas } from '@nivo/line'
import { lineMargin, lineTheme } from '../theming'
import { useMemo, useState } from "react";
import { resolveThemeCssVars } from "@/lib/utils";
import { Margin } from "@nivo/core";

interface LineProps {
    data: LineGraphData;
    onLegendClick?: (lineId: string) => void;
    margin?: Margin;
    yRange?: [number, number];
}

export interface RangeSelection {
    lineId: string;
    ranges: Array<[number, number]>;
}

// Define set1 color scheme colors from d3-scale-chromatic
const SET1_COLORS = [
    '#e41a1c', // red
    '#377eb8', // blue
    '#4daf4a', // green
    '#984ea3', // purple
    '#ff7f00', // orange
    '#ffff33', // yellow
    '#a65628', // brown
    '#f781bf', // pink
    '#999999', // gray
];

export function Line({ data, margin = lineMargin, onLegendClick = () => { }, yRange = [0, 1] }: LineProps) {
    const resolvedTheme = useMemo(() => resolveThemeCssVars(lineTheme), [])
    const [highlightedLines, setHighlightedLines] = useState<Set<string>>(new Set())

    const handleLegendClick = (lineId: string) => {
        setHighlightedLines(prev => {
            const newSet = new Set(prev);
            if (newSet.has(lineId)) {
                newSet.delete(lineId);
            } else {
                newSet.add(lineId);
            }
            return newSet;
        });
        onLegendClick(lineId);
    };

    // Create color mapping for lines
    const lineColors = useMemo(() => {
        const hasHighlighted = highlightedLines.size > 0;
        return (line: any) => {
            const lineIndex = data.lines.findIndex(l => l.id === line.id);
            const baseColor = SET1_COLORS[lineIndex % SET1_COLORS.length];

            // If no lines are highlighted, show all with full color
            // If some lines are highlighted, dim the non-highlighted ones
            if (!hasHighlighted || highlightedLines.has(line.id)) {
                return baseColor;
            }
            return '#d3d3d3'; // Light gray for non-highlighted lines
        };
    }, [data.lines, highlightedLines]);

    return (
        <div className="h-full">
            <div
                className="flex flex-row gap-3 justify-center h-[5%]"
            >
                {data.lines.map((line, index) => {
                    const color = SET1_COLORS[index % SET1_COLORS.length];
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
            <div className="h-[95%]">
                <ResponsiveLineCanvas
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
                    colors={lineColors}
                    enableGridX={false}
                    isInteractive={false}
                    yFormat=">-.2f"
                    enableGridY={true}
                    enablePoints={true}
                />
            </div>
        </div>
    );
}