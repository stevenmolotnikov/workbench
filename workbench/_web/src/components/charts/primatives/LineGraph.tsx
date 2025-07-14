"use client";

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import type { LineGraphData } from "@/types/charts";
import { CustomTooltip } from "./Tooltip";
import { useAnnotations } from "@/stores/useAnnotations";
import { useState } from "react";

interface DataPoint {
    layer: number;
    [key: string]: number;
}

interface LineGraphProps {
    chartIndex: number;
    data?: LineGraphData;
}

export function LineGraph({ chartIndex, data }: LineGraphProps) {
    const {
        addPendingAnnotation,
        emphasizedAnnotation,
        annotations,
        pendingAnnotation,
    } = useAnnotations();
    const [refAreaLeft, setRefAreaLeft] = useState<string>("");
    const [refAreaRight, setRefAreaRight] = useState<string>("");
    const [highlightedLine, setHighlightedLine] = useState<string | null>(null);
    const [hoveredDot, setHoveredDot] = useState<{ lineId: string; layer: number } | null>(null);


    if (!data?.chartData?.length) {
        return <div>No data to display.</div>;
    }

    const { chartData, chartConfig, maxLayer, lineData } = data;

    const handleDotClick = (lineId: string, layer: number) => {
        addPendingAnnotation({
            type: "lineGraph",
            data: {
                id: Date.now().toString(),
                text: "New Annotation",
                layer,
                lineId,
                chartIndex,
            },
        });
    };

    const handleDotMouseDown = (lineId: string, layer: number) => {
        console.log(lineId, layer);
        setHighlightedLine(lineId);
        setRefAreaLeft(layer.toString());
        setRefAreaRight(layer.toString());
    };

    const handleMouseUp = () => {
        if (!highlightedLine) return;

        // Store actual layer numbers instead of percentages
        const start = Number(refAreaLeft);
        const end = Number(refAreaRight);

        addPendingAnnotation({
            type: "lineGraphRange",
            data: {
                id: Date.now().toString(),
                text: "New Annotation",
                lineId: highlightedLine,
                start,
                end,
                chartIndex,
            },
        });

        setRefAreaLeft("");
        setRefAreaRight("");
        setHighlightedLine(null);
    };

    // Get range highlights from annotations store
    const getRangeHighlights = (
        lineId: string
    ): Array<{ start: number; end: number; isTemporary?: boolean }> => {
        const highlights: Array<{ start: number; end: number; isTemporary?: boolean }> = [];
        const lineMaxLayer = lineData[lineId] || maxLayer; // Use per-line max layer

        // Add highlights from confirmed annotations (convert layer numbers to percentages)
        annotations.forEach((annotation) => {
            if (annotation.type === "lineGraphRange" && annotation.data.lineId === lineId) {
                highlights.push({
                    start: (annotation.data.start / lineMaxLayer) * 100,
                    end: (annotation.data.end / lineMaxLayer) * 100,
                });
            }
        });

        // Add highlight from pending annotation (convert layer numbers to percentages)
        if (
            pendingAnnotation?.type === "lineGraphRange" &&
            pendingAnnotation?.data.lineId === lineId
        ) {
            highlights.push({
                start: (pendingAnnotation.data.start / lineMaxLayer) * 100,
                end: (pendingAnnotation.data.end / lineMaxLayer) * 100,
            });
        }

        // Add temporary highlight during dragging (convert layer numbers to percentages)
        if (highlightedLine === lineId && refAreaLeft && refAreaRight) {
            highlights.push({
                start: (Number(refAreaLeft) / lineMaxLayer) * 100,
                end: (Number(refAreaRight) / lineMaxLayer) * 100,
                isTemporary: true,
            });
        }

        return highlights;
    };

    // Check if a dot is annotated or pending - consolidated logic
    const isAnnotatedOrPending = (lineId: string, layer: number) => {
        return (
            (pendingAnnotation?.type === "lineGraph" &&
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

    // Check if a dot is emphasized - consolidated logic
    const dotIsEmphasized = (lineId: string, layer: number) => {
        return (
            emphasizedAnnotation?.type === "lineGraph" &&
            emphasizedAnnotation?.data.lineId === lineId &&
            emphasizedAnnotation?.data.layer === layer
        );
    };

    const renderDot = (lineId: string, props: unknown) => {
        const { cx, cy, payload, index } = props as {
            cx: number;
            cy: number;
            payload: DataPoint;
            index: number;
        };

        const { layer } = payload;
        const emphasized = dotIsEmphasized(lineId, layer);
        const annotated = isAnnotatedOrPending(lineId, layer);

        // Calculate radius based on state
        const r = emphasized ? 6 : annotated ? 4 : 0;

        return (
            <circle
                key={`dot-${index}`}
                cx={cx}
                cy={cy}
                r={r}
                fill="hsl(var(--chart-1))"
                stroke={annotated ? "white" : "transparent"}
                strokeWidth={annotated ? 2 : 0}
                pointerEvents="none"
            />
        );
    };

    // Active dot with interaction handlers
    const activeDot = (lineId: string, props: unknown) => {
        const { cx, cy, payload, index } = props as {
            cx: number;
            cy: number;
            payload: DataPoint;
            index: number;
        };

        const { layer } = payload;
        const emphasized = dotIsEmphasized(lineId, layer);
        const annotated = isAnnotatedOrPending(lineId, layer);
        const hovered = hoveredDot?.lineId === lineId && hoveredDot?.layer === layer;

        // Calculate radius based on state priority
        const r = emphasized ? 8 : annotated ? 6 : hovered ? 4 : 0;

        return (
            <g>
                <circle cx={cx} cy={cy} r={r} fill="hsl(var(--chart-1))" pointerEvents="none" />
                <circle
                    cx={cx}
                    cy={cy}
                    r={16}
                    fill="transparent"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleDotClick(lineId, layer)}
                    onMouseDown={() => handleDotMouseDown(lineId, layer)}
                    onMouseEnter={() => setHoveredDot({ lineId, layer })}
                    onMouseLeave={() => setHoveredDot(null)}
                />
            </g>
        );
    };

    const rangeIsEmphasized = (lineId: string, start: number, end: number) => {
        // Convert percentage back to layer numbers for comparison using per-line max layer
        const lineMaxLayer = lineData[lineId] || maxLayer;
        const startLayer = Math.round((start / 100) * lineMaxLayer);
        const endLayer = Math.round((end / 100) * lineMaxLayer);

        const value =
            emphasizedAnnotation?.type === "lineGraphRange" &&
            emphasizedAnnotation?.data.lineId === lineId &&
            (emphasizedAnnotation?.data.start === startLayer ||
                emphasizedAnnotation?.data.start === endLayer) &&
            (emphasizedAnnotation?.data.end === endLayer ||
                emphasizedAnnotation?.data.end === startLayer);

        return value;
    };

    // Ids cannot have special characters
    const fixId = (id: string) => {
        return id
            .replaceAll(" ", "")
            .replaceAll("(", "")
            .replaceAll(")", "")
            .replaceAll("|", "")
            .replaceAll('"', "");
    };

    const getGradient = (seriesKey: string, color: string) => {
        const highlights = getRangeHighlights(seriesKey);

        if (highlights.length === 0) {
            return (
                <linearGradient
                    key={`gradient-${seriesKey}`}
                    id={fixId(seriesKey)}
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

        // Normalize and sort highlights
        const normalized = highlights
            .map((h) => ({
                start: Math.max(0, Math.min(100, Math.min(h.start, h.end))),
                end: Math.max(0, Math.min(100, Math.max(h.start, h.end))),
                isTemporary: h.isTemporary,
            }))
            .sort((a, b) => a.start - b.start);

        // Create gradient stops
        const stops: Array<{ offset: number; color: string }> = [{ offset: 0, color }];

        normalized.forEach(({ start, end, isTemporary }) => {
            // Determine highlight color based on emphasis and temporary state
            let highlightColor = "white"; // Default highlight color

            if (!isTemporary && rangeIsEmphasized(seriesKey, start, end)) {
                highlightColor = "#ffd700"; // Gold color for emphasized ranges
            } else if (isTemporary) {
                highlightColor = "#e0e0e0"; // Light gray for temporary highlights
            }

            if (start > 0) stops.push({ offset: start - 0.001, color });
            stops.push({ offset: start, color: highlightColor });
            stops.push({ offset: end, color: highlightColor });
            if (end < 100) stops.push({ offset: end + 0.001, color });
        });

        stops.push({ offset: 100, color });

        // Remove duplicates and sort
        const uniqueStops = stops
            .sort((a, b) => a.offset - b.offset)
            .filter(
                (stop, i, arr) =>
                    i === 0 || stop.offset !== arr[i - 1].offset || stop.color !== arr[i - 1].color
            );

        return (
            <linearGradient
                key={`gradient-${seriesKey}`}
                id={fixId(seriesKey)}
                x1="0%"
                y1="0"
                x2="100%"
                y2="0"
            >
                {uniqueStops.map((stop, index) => (
                    <stop
                        key={index}
                        offset={`${Math.max(0, Math.min(100, stop.offset))}%`}
                        stopColor={stop.color}
                    />
                ))}
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
                        {Object.keys(chartConfig).map((seriesKey) =>
                            getGradient(seriesKey, chartConfig[seriesKey].color)
                        )}
                    </defs>

                    {Object.keys(chartConfig).map((seriesKey) => (
                        <Line
                            key={seriesKey}
                            dataKey={seriesKey}
                            type="linear"
                            stroke={`url(#${fixId(seriesKey)})`}
                            strokeWidth={highlightedLine === seriesKey ? 4 : 2}
                            dot={(payload: unknown) => renderDot(seriesKey, payload)}
                            activeDot={(payload: unknown) => activeDot(seriesKey, payload)}
                            connectNulls={true}
                        />
                    ))}
                </LineChart>
            </ChartContainer>
        </div>
    );
}
