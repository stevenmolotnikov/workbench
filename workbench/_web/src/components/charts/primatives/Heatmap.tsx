import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";

// Convert value to color
const getColor = (value: number, minValue: number, maxValue: number, theme: string | undefined): string => {
    if (maxValue === minValue) return "#e5e5e5";

    const normalized = (value - minValue) / (maxValue - minValue);

    let r1, g1, b1;
    if (theme === "light" || theme === undefined) {
        r1 = 224;
        g1 = 242;
        b1 = 254; // #e5e5e5
    } else {
        r1 = 229;
        g1 = 229;
        b1 = 229; // #e5e5e5
    }

    const r2 = 96,
        g2 = 165,
        b2 = 250; // #60a5fa

    const r = Math.round(r1 + (r2 - r1) * normalized);
    const g = Math.round(g1 + (g2 - g1) * normalized);
    const b = Math.round(b1 + (b2 - b1) * normalized);

    return `rgb(${r}, ${g}, ${b})`;
};

interface TooltipData {
    value: number;
    x: number;
    y: number;
    visible: boolean;
    isColorbar?: boolean;
}

export interface HeatmapProps {
    data: number[][];
    labels?: string[][];
    xTickLabels?: (string | number)[];
    yTickLabels?: (string | number)[];
    xAxisLabel?: string;
    yAxisLabel?: string;
    fontSize?: number;
    cellSpacing?: number;
}

export function Heatmap({
    data,
    labels,
    xTickLabels = [],
    yTickLabels = [],
    xAxisLabel = "",
    yAxisLabel = "",
    fontSize = 12,
}: HeatmapProps) {
    const [tooltip, setTooltip] = useState<TooltipData>({
        value: 0,
        x: 0,
        y: 0,
        visible: false,
        isColorbar: false,
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerDimensions, setContainerDimensions] = useState({
        width: 1000,
        height: 800,
    });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerDimensions({
                    width: rect.width,
                    height: rect.height * 0.95,
                });
            }
        };

        updateDimensions();

        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);


    // Find min and max values for color scaling
    const flatData = data.flat();
    const minValue = Math.min(...flatData);
    const maxValue = Math.max(...flatData);

    const { theme } = useTheme();

    const rows = data.length;
    const cols = data[0].length;

    // Use actual container dimensions and make spacing proportional
    const containerWidth = containerDimensions.width;
    const containerHeight = containerDimensions.height;

    // Calculate space allocation as percentages of container size
    const yLabelSpace = yAxisLabel ? containerWidth * 0.04 : 0;
    const yTickSpace = yTickLabels.length > 0 ? containerWidth * 0.04 : 0;

    const xTickSpace = xTickLabels.length > 0 ? containerHeight * 0.04 : 0;
    const xLabelSpace = xAxisLabel ? containerHeight * 0.04 : 0;

    const xLabelOffset = 10;

    const chartStartX = yLabelSpace + yTickSpace;
    const chartStartY = containerHeight * 0; // Small top margin proportional to height

    // Calculate available space for the heatmap cells
    const availableWidthForCells = containerWidth - chartStartX;
    const availableHeightForCells =
        containerHeight - chartStartY - xTickSpace - xLabelSpace;

    // Calculate cell dimensions separately to allow rectangular cells
    const cellWidth = availableWidthForCells / cols;
    const cellHeight = availableHeightForCells / rows;

    const spacing = 1; // Fixed 1px spacing
    const actualCellWidth = cellWidth - spacing;
    const actualCellHeight = cellHeight - spacing;

    // Calculate actual chart dimensions
    const chartWidth = cols * cellWidth;
    const chartHeight = rows * cellHeight;

    // Calculate total SVG dimensions needed
    const svgWidth = chartStartX + chartWidth;
    const svgHeight = chartStartY + chartHeight + xTickSpace + xLabelSpace;

    // Function to get cell text content
    const getCellText = (value: number, rowIndex: number, colIndex: number): string | null => {
        if (labels && labels[rowIndex] && labels[rowIndex][colIndex] !== undefined) {
            return labels[rowIndex][colIndex];
        }
        return null; // Return null when no labels are provided
    };

    // Handle mouse events for tooltip
    const handleMouseEnter = (event: React.MouseEvent, value: number) => {
        const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
        const svgRect = (
            event.currentTarget.closest("svg") as SVGElement
        ).getBoundingClientRect();

        setTooltip({
            value,
            x: ((rect.left + rect.width / 2 - svgRect.left) / svgRect.width) * 100,
            y: ((rect.top - svgRect.top) / svgRect.height) * 100,
            visible: true,
            isColorbar: false,
        });
    };

    const handleMouseLeave = () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
    };


    // Calculate Y-axis label skipping
    const calculateYLabelSkip = (): number => {
        if (yTickLabels.length === 0) return 1;

        // Minimum spacing between labels in pixels (including font size)
        const minLabelSpacing = fontSize * 1.5;

        // Available space per label based on cell height
        const spacePerLabel = cellHeight;

        // If we have enough space, show all labels
        if (spacePerLabel >= minLabelSpacing) {
            return 1;
        }

        // Calculate how many labels we need to skip to maintain minimum spacing
        const skipRatio = Math.ceil(minLabelSpacing / spacePerLabel);

        // Ensure we don't skip too many (always show at least a few labels)
        const maxSkip = Math.max(1, Math.floor(yTickLabels.length / 5));

        return Math.min(skipRatio, maxSkip);
    };

    const yLabelSkip = calculateYLabelSkip();

    return (
        <div ref={containerRef} className="relative w-full h-full">
            <svg
                className="w-full h-full"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ userSelect: "none" }}
            >

                {/* Y-axis label */}
                {yAxisLabel && (
                    <text
                        x={0}
                        y={chartStartY + chartHeight / 2 + 10}
                        textAnchor="middle"
                        transform={`rotate(-90, 2, ${chartStartY + chartHeight / 2})`}
                        className="font-medium fill-muted-foreground"
                        fontSize={fontSize}
                    >
                        {yAxisLabel}
                    </text>
                )}

                {/* X-axis label */}
                {xAxisLabel && (
                    <text
                        x={chartStartX + chartWidth / 2}
                        y={chartStartY + chartHeight + xTickSpace + xLabelOffset}
                        textAnchor="middle"
                        className="font-medium fill-muted-foreground"
                        fontSize={fontSize}
                    >
                        {xAxisLabel}
                    </text>
                )}

                {/* Heatmap cells */}
                <g transform={`translate(${chartStartX}, ${chartStartY})`}>
                    {data.map((row, rowIndex) =>
                        row.map((value, colIndex) => {
                            return (
                                <g key={`${rowIndex}-${colIndex}`}>
                                    {(() => {
                                        const x = colIndex * cellWidth + spacing / 2;
                                        const y = rowIndex * cellHeight + spacing / 2;
                                        const w = actualCellWidth;
                                        const h = actualCellHeight;
                                        const r = 5; // radius

                                        // Determine which corners should be rounded
                                        const isTopLeft = rowIndex === 0 && colIndex === 0;
                                        const isTopRight = rowIndex === 0 && colIndex === cols - 1;
                                        const isBottomLeft =
                                            rowIndex === rows - 1 && colIndex === 0;
                                        const isBottomRight =
                                            rowIndex === rows - 1 && colIndex === cols - 1;

                                        // If no corners need rounding, use a simple rect
                                        if (
                                            !isTopLeft &&
                                            !isTopRight &&
                                            !isBottomLeft &&
                                            !isBottomRight
                                        ) {
                                            return (
                                                <rect
                                                    x={x}
                                                    y={y}
                                                    width={w}
                                                    height={h}
                                                    fill={getColor(value, minValue, maxValue, theme)}
                                                    className="cursor-pointer transition-opacity hover:opacity-80"
                                                    onMouseEnter={(e) => handleMouseEnter(e, value)}
                                                    onMouseLeave={handleMouseLeave}
                                                />
                                            );
                                        }

                                        // Create path with selective rounded corners
                                        const pathData = [
                                            `M ${x + (isTopLeft ? r : 0)} ${y}`,
                                            `L ${x + w - (isTopRight ? r : 0)} ${y}`,
                                            isTopRight ? `Q ${x + w} ${y} ${x + w} ${y + r}` : "",
                                            `L ${x + w} ${y + h - (isBottomRight ? r : 0)}`,
                                            isBottomRight
                                                ? `Q ${x + w} ${y + h} ${x + w - r} ${y + h}`
                                                : "",
                                            `L ${x + (isBottomLeft ? r : 0)} ${y + h}`,
                                            isBottomLeft ? `Q ${x} ${y + h} ${x} ${y + h - r}` : "",
                                            `L ${x} ${y + (isTopLeft ? r : 0)}`,
                                            isTopLeft ? `Q ${x} ${y} ${x + r} ${y}` : "",
                                            "Z",
                                        ]
                                            .filter(Boolean)
                                            .join(" ");

                                        return (
                                            <path
                                                d={pathData}
                                                fill={getColor(value, minValue, maxValue, theme)}
                                                className="cursor-pointer transition-opacity hover:opacity-80"
                                                onMouseEnter={(e) => handleMouseEnter(e, value)}
                                                onMouseLeave={handleMouseLeave}
                                            />
                                        );
                                    })()}
                                    {getCellText(value, rowIndex, colIndex) && (
                                        <text
                                            x={colIndex * cellWidth + cellWidth / 2}
                                            y={rowIndex * cellHeight + cellHeight / 2}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="pointer-events-none fill-black"
                                            fontSize={Math.min(
                                                fontSize,
                                                Math.min(actualCellWidth, actualCellHeight) / 2
                                            )}
                                        >
                                            {getCellText(value, rowIndex, colIndex)}
                                        </text>
                                    )}
                                </g>
                            );
                        })
                    )}
                </g>

                {/* Y-axis tick labels */}
                {yTickLabels.length > 0 && (
                    <g transform={`translate(${chartStartX - 10}, ${chartStartY})`}>
                        {yTickLabels.map((label, index) => {
                            // Skip labels based on calculated skip ratio
                            if (index % yLabelSkip !== 0) return null;

                            return (
                                <text
                                    key={index}
                                    x={0}
                                    y={index * cellHeight + cellHeight / 2}
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                    className="fill-muted-foreground"
                                    fontSize={fontSize}
                                >
                                    {label}
                                </text>
                            );
                        })}
                    </g>
                )}

                {/* X-axis tick labels */}
                {xTickLabels.length > 0 && (
                    <g transform={`translate(${chartStartX}, ${chartStartY + chartHeight})`}>
                        {xTickLabels.map((label, index) => (
                            <text
                                key={index}
                                x={index * cellWidth + cellWidth / 2}
                                y={10}
                                textAnchor="middle"
                                dominantBaseline="hanging"
                                className="fill-muted-foreground"
                                fontSize={fontSize}
                            >
                                {label}
                            </text>
                        ))}
                    </g>
                )}

            </svg>

            {/* Tooltip */}
            {tooltip.visible && (
                <div
                    className="absolute pointer-events-none z-10 bg-gray-900 text-white px-2 py-1 rounded text-sm shadow-lg transform -translate-x-1/2 -translate-y-full"
                    style={{
                        left: `${tooltip.x}%`,
                        top: `${tooltip.y}%`,
                        marginTop: "-8px",
                    }}
                >
                    <div className="text-xs text-gray-300">
                        {!tooltip.isColorbar && labels &&
                            labels[Math.floor(tooltip.y / (100 / rows))]?.[
                                Math.floor(tooltip.x / (100 / cols))
                            ] && (
                                <div>
                                    Token:{" "}
                                    {
                                        labels[Math.floor(tooltip.y / (100 / rows))][
                                            Math.floor(tooltip.x / (100 / cols))
                                        ]
                                    }
                                </div>
                            )}
                        <div>Value: {tooltip.value.toFixed(3)}</div>
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
            )}
        </div>
    );
}
