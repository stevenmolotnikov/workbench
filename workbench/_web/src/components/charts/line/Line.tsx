"use client";

import type { LineGraphData } from "@/types/charts";
import { ResponsiveLineCanvas } from '@nivo/line'
import { lineMargin, lineTheme } from '../theming'
import { useMemo } from "react";
import { resolveThemeCssVars } from "@/lib/utils";
import { Margin, Point } from "@nivo/core";

interface LineProps {
    data: LineGraphData;
    onClick?: (point: Point) => void;
    margin?: Margin;
    yRange?: [number, number];
}

export interface RangeSelection {
    lineId: string;
    ranges: Array<[number, number]>;
}

export function Line({ data, margin = lineMargin, onClick = () => {}, yRange = [0, 1] }: LineProps) {
    const resolvedTheme = useMemo(() => resolveThemeCssVars(lineTheme), [])

    return (
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
            colors={{ scheme: 'set1' }}
            enableGridX={false}
            yFormat=">-.2f"
            enableGridY={true}
            onClick={onClick}
            enablePoints={false}
            legends={[
                {
                    anchor: 'top',
                    direction: 'row',
                    translateY: -30,
                    itemWidth: 60,
                    itemHeight: 20,
                    itemTextColor: 'hsl(var(--foreground))',
                    symbolSize: 6,
                    symbolShape: 'square',
                },
            ]}
        />

    );
}