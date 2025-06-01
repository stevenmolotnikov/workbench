"use client";

import {
    Line,
    LineChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceArea,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { LineGraphData } from "@/types/charts";
import { CustomTooltip } from "./Tooltip";
import { useAnnotations } from "@/stores/useAnnotations";
import { LineGraphAnnotation, LineGraphRangeAnnotation } from "@/types/lens";
import { useState } from "react";

interface DataPoint {
    layer: number;
    [key: string]: number;
}


export function LineGraph({ data }: { data?: LineGraphData }) {
    const { addPendingAnnotation, emphasizedAnnotation, annotations, pendingAnnotation } =
        useAnnotations();
    const [refAreaLeft, setRefAreaLeft] = useState<string>("");
    const [refAreaRight, setRefAreaRight] = useState<string>("");
    const [highlightedLine, setHighlightedLine] = useState<string | null>(null);

    const [lineHighlights, setLineHighlights] = useState<
        Record<string, { start: number; end: number }>
    >({});

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
        addPendingAnnotation({ type: "lineGraph", data: newAnnotation });
    };

    const handleDotMouseDown = (lineId: string, layer: number) => {

        setHighlightedLine(lineId);
        setRefAreaLeft(layer.toString());
        setRefAreaRight(layer.toString());
    };


    const handleMouseUp = () => {
        if (!highlightedLine) return;

        setLineHighlights((prev) => {
            const newHighlights = { ...prev };
            newHighlights[highlightedLine] = {
                start: Number(refAreaLeft) / maxLayer * 100,
                end: Number(refAreaRight) / maxLayer * 100,
            };
            return newHighlights;
        });

        const newAnnotation: LineGraphRangeAnnotation = {
            id: Date.now().toString(),
            text: "New Annotation",
            lineId: highlightedLine,
            start: Number(refAreaLeft) / maxLayer * 100,
            end: Number(refAreaRight) / maxLayer * 100,
        };
        addPendingAnnotation({ type: "lineGraphRange", data: newAnnotation });

        setRefAreaLeft("");
        setRefAreaRight("");
        setHighlightedLine(null);
    };

    const isAnnotatedOrPending = (lineId: string, layer: number) => {
        return (
            (pendingAnnotation?.type !== null &&
                pendingAnnotation?.type === "lineGraph" &&
                pendingAnnotation?.data.lineId === lineId &&
                pendingAnnotation?.data.layer === layer) ||
            annotations.some(
                (annotation) =>
                    annotation.type === "lineGraph" &&
                    annotation.data.lineId === lineId &&
                    annotation.data.layer === layer
            )
        );
    };

    const renderDot = (props: any) => {
        const { cx, cy, payload, index } = props;
        const { lineId, layer } = transformObject(payload);

        const emphasized =
            emphasizedAnnotation?.type === "lineGraph" &&
            emphasizedAnnotation?.data.lineId === lineId &&
            emphasizedAnnotation?.data.layer === layer;

        const isAnnotated = isAnnotatedOrPending(lineId, layer);
        const r = emphasized ? 6 : isAnnotated ? 4 : 0;

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

        const emphasized =
            emphasizedAnnotation?.type === "lineGraph" &&
            emphasizedAnnotation?.data.lineId === lineId &&
            emphasizedAnnotation?.data.layer === layer;

        const isAnnotated = isAnnotatedOrPending(lineId, layer);
        const r = emphasized ? 6 : isAnnotated ? 4 : 0;

        return (
            <g>
                <circle
                    key={`active-dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={r}
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
                    onMouseDown={() => handleDotMouseDown(lineId, layer)}
                />
            </g>
        );
    };

    const getGradient = (seriesKey: string, color: string) => {
        if (!lineHighlights[seriesKey]) {
            return (
                <linearGradient
                    key={`gradient-${seriesKey}`}
                    id={String(seriesKey).replace(" ", "")}
                    x1="0%"
                    y1="0"
                    x2="100%"
                    y2="0"
                >
                    <stop offset="0%" stopColor={color} />
                    <stop offset="100%" stopColor={color} />
                </linearGradient>
            );
        }
        return (
            <linearGradient
                key={`gradient-${seriesKey}`}
                id={String(seriesKey).replace(" ", "")}
                x1="0%"
                y1="0"
                x2="100%"
                y2="0"
            >
                <stop offset="0%" stopColor={color} />
                <stop
                    offset={`${Math.min(
                        lineHighlights[seriesKey].start,
                        lineHighlights[seriesKey].end
                    )}%`}
                    stopColor={color}
                />
                <stop
                    offset={`${Math.min(
                        lineHighlights[seriesKey].start,
                        lineHighlights[seriesKey].end
                    )}%`}
                    stopColor="white"
                />
                <stop
                    offset={`${Math.max(
                        lineHighlights[seriesKey].start,
                        lineHighlights[seriesKey].end
                    )}%`}
                    stopColor="white"
                />
                <stop
                    offset={`${Math.max(
                        lineHighlights[seriesKey].start,
                        lineHighlights[seriesKey].end
                    )}%`}
                    stopColor={color}
                />
                <stop offset="100%" stopColor={color} />
            </linearGradient>
        );
    };

    return (
        <div className="w-full h-full">
            <ChartContainer config={chartConfig} className="w-full h-full">
                <LineChart
                    data={chartData}
                    margin={{ left: 12, right: 12, top: 10, bottom: 10 }}
                    onMouseDown={(e) => e.activeLabel && setRefAreaLeft(e.activeLabel)}
                    onMouseMove={(e) =>
                        refAreaLeft && e.activeLabel && setRefAreaRight(e.activeLabel)
                    }
                    onMouseUp={handleMouseUp}
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

                    <defs>
                        {Object.keys(chartConfig).map((seriesKey) => {
                            return getGradient(seriesKey, chartConfig[seriesKey].color);
                        })}
                    </defs>


                    {Object.keys(chartConfig).map((seriesKey) => (
                        <Line
                            key={seriesKey}
                            dataKey={seriesKey}
                            type="linear"
                            stroke={`url(#${String(seriesKey).replace(" ", "")})`}
                            strokeWidth={highlightedLine === seriesKey ? 4 : 2}
                            dot={renderDot}
                            activeDot={activeDot}
                            connectNulls={true}
                        />
                    ))}

                    {refAreaLeft && refAreaRight && (
                        <ReferenceArea
                            x1={refAreaLeft}
                            x2={refAreaRight}
                            strokeOpacity={0.3}
                            fill="hsl(var(--chart-1))"
                            fillOpacity={0.1}
                        />
                    )}
                </LineChart>
            </ChartContainer>
        </div>
    );
}
