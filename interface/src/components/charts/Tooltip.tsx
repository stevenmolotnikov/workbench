"use client";

import { TooltipProps } from "recharts";
import { memo } from "react";

interface ChartDataPoint {
    layer: number;
    [key: string]: number | string | undefined;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
    payload?: Array<{
        dataKey: string;
        name: string;
        color: string;
        value: number;
        payload: ChartDataPoint;
    }>;
}

export const CustomTooltip = memo(({ active, payload }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null;

    const dataPoint = payload[0].payload;

    return (
        <div className="rounded-lg border bg-background p-2 shadow-md">
            <p className="text-sm font-medium">Layer: {dataPoint.layer}</p>

            {payload.map((entry, index) => {
                if (entry.dataKey === "annotations") return null;
                return (
                    <p key={`value-${index}`} style={{ color: entry.color }} className="text-xs">
                        {entry.name}: {entry.value?.toFixed(4)}
                    </p>
                );
            })}
        </div>
    );
});
CustomTooltip.displayName = "CustomTooltip";
