"use client";

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { LineGraphData } from "@/types/charts";
import { CustomTooltip } from "./Tooltip";
import { useLineGraphAnnotations } from "@/stores/lineGraphAnnotations";
import { LineGraphAnnotation } from "@/types/lens";

interface DataPoint {
    layer: number;
    [key: string]: number;
}

export function LineGraph({ data }: { data?: LineGraphData }) {
    const { addPendingAnnotation, emphasizedAnnotation, annotations, pendingAnnotation } = useLineGraphAnnotations();

    if (!data) {
        return <div>No data to display.</div>;
    }

    const { chartData, chartConfig, maxLayer } = data;

    if (!chartData || chartData.length === 0) {
        return <div>No data to display.</div>;
    }

    function transformObject(inputObj: DataPoint): { lineId: string; layer: number } {
        // Find the key that's not "layer"
        const idKey = Object.keys(inputObj).find((key) => key !== "layer");

        if (!idKey) {
            throw new Error("No dynamic ID key found in the object");
        }

        return {
            lineId: idKey,
            layer: inputObj.layer,
        };
    }

    const handleDotClick = (lineId: string, layer: number) => {
        const newAnnotation: LineGraphAnnotation = {
            id: Date.now().toString(),
            text: "New Annotation",
            layer: layer,
            lineId: lineId,
        };
        addPendingAnnotation(newAnnotation);
    };

    const isAnnotatedOrPending = (lineId: string, layer: number) => 
        (pendingAnnotation?.lineId === lineId && pendingAnnotation?.layer === layer) ||
        annotations.some(annotation => annotation.lineId === lineId && annotation.layer === layer);

    const renderDot = (props: any) => {
        const { cx, cy, payload, index } = props;
        const { lineId, layer } = transformObject(payload);

        const emphasized =
            emphasizedAnnotation?.lineId === lineId && emphasizedAnnotation?.layer === layer;
        
        const isAnnotated = isAnnotatedOrPending(lineId, layer);
        const r = emphasized ? 6 : (isAnnotated ? 4 : 0);

        return (
            <circle
                key={`dot-${index}`}
                cx={cx}
                cy={cy}
                r={r}
                fill={"hsl(var(--chart-1))"}
                stroke={isAnnotated ? "white" : "transparent"}
                strokeWidth={isAnnotated ? 2 : 0}
                pointerEvents="none"
            />
        );
    };

    // Custom dot renderer
    const activeDot = (props: any) => {
        const { cx, cy, payload, index } = props;

        const { lineId, layer } = transformObject(payload);

        return (
            <g>
                <circle
                    key={`active-dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={"hsl(var(--chart-1))"}
                    pointerEvents="none"
                />
                <circle
                    key={`hidden-dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={12}
                    fill="transparent"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleDotClick(lineId, layer)}
                />
            </g>
        );
    };

    return (
        <div className="w-full h-full">
            <ChartContainer config={chartConfig} className="w-full h-full">
                <LineChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
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
                    <Tooltip content={<CustomTooltip />} />

                    {Object.keys(chartConfig).map((seriesKey) => (
                        <Line
                            key={seriesKey}
                            dataKey={seriesKey}
                            type="linear"
                            stroke={chartConfig[seriesKey]?.color}
                            strokeWidth={2}
                            dot={renderDot}
                            activeDot={activeDot}
                            connectNulls={true}
                        />
                    ))}
                </LineChart>
            </ChartContainer>
        </div>
    );
}
