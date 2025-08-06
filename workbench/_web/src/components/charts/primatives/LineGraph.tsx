"use client";

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import type { LineGraphData } from "@/types/charts";
import { CustomTooltip } from "./Tooltip";

interface LineGraphProps {
    chartIndex: number;
    data?: LineGraphData;
}

export function LineGraph({ chartIndex, data }: LineGraphProps) {
    if (!data?.chartData?.length) {
        return <div>No data to display.</div>;
    }

    const { chartData, chartConfig, maxLayer } = data;

    return (
        <div className="w-full h-full">
            <ChartContainer config={chartConfig} className="w-full h-full">
                <LineChart
                    data={chartData}
                    margin={{ left: 12, right: 12, top: 10, bottom: 10 }}
                >
                    <CartesianGrid vertical={false} />
                    <YAxis
                        domain={[0, 1]}
                        label={{ value: "Probability", angle: -90, position: "insideLeft" }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <XAxis
                        dataKey="layer"
                        type="number"
                        domain={[0, maxLayer]}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                    />
                    <Legend />
                    <Tooltip content={<CustomTooltip />} />

                    {Object.keys(chartConfig).map((seriesKey) => (
                        <Line
                            key={seriesKey}
                            dataKey={seriesKey}
                            type="linear"
                            stroke={chartConfig[seriesKey].color}
                            strokeWidth={2}
                            dot={false}
                            connectNulls={true}
                        />
                    ))}
                </LineChart>
            </ChartContainer>
        </div>
    );
}