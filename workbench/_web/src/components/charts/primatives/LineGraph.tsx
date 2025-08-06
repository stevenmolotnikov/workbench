"use client";

import type { LineGraphData } from "@/types/charts";
import { ResponsiveLine } from '@nivo/line'
import { lineTheme } from './theming'

interface LineGraphProps {
    data?: LineGraphData;
}

export function LineGraph({ data }: LineGraphProps) {
    if (!data) return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
            No data to display
        </div>
    )

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
            enableCrosshair={false}
            theme={lineTheme}
            colors={{ scheme: 'nivo' }}
            enableGridX={true}
            enableGridY={true}
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