import React, { useState, useRef, useEffect } from "react";
import { HeatmapData } from "@/types/charts";

// Convert value to color
const getColor = (value: number, minValue: number, maxValue: number): string => {
    if (maxValue === minValue) return "#e5e5e5";

    const normalized = (value - minValue) / (maxValue - minValue);

    // Interpolate between #e5e5e5 (light gray) and #3b82f6 (blue)
    const r1 = 229,
        g1 = 229,
        b1 = 229; // #e5e5e5


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
}

export const Heatmap: React.FC<
    HeatmapData & { cellSpacing?: number }
> = ({
    data,
    labels,
    xTickLabels = [],
    yTickLabels = [],
    xAxisLabel = "",
    yAxisLabel = "",
    fontSize = 12,
    cellSpacing = 0.025, // Spacing between cells as percentage of cell size
}) => {
    const [tooltip, setTooltip] = useState<TooltipData>({
        value: 0,
        x: 0,
        y: 0,
        visible: false,
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

        return () => resizeObserver.disconnect();
    }, []);

    // Find min and max values for color scaling
    const flatData = data.flat();
    const minValue = Math.min(...flatData);
    const maxValue = Math.max(...flatData);

    const rows = data.length;
    const cols = data[0].length;

    // Use actual container dimensions and make spacing proportional
    const containerWidth = containerDimensions.width;
    const containerHeight = containerDimensions.height;

    // Check if container height is less than half of screen height
    const shouldHideColorbar = containerDimensions.height < window.innerHeight / 2;

    // Calculate space allocation as percentages of container size
    const yLabelSpace = yAxisLabel ? containerWidth * 0.02 : 0;
    const yTickSpace = yTickLabels.length > 0 ? containerWidth * 0.04 : 0;
    
    const xTickSpace = xTickLabels.length > 0 ? containerHeight * 0.04 : 0;
    const xLabelSpace = xAxisLabel ? containerHeight * 0.04 : 0;
    const xLabelOffset = shouldHideColorbar ? 10 : 20;

    const colorScaleSpace = shouldHideColorbar ? 0 : containerHeight * 0.1; 

    const chartStartX = yLabelSpace + yTickSpace;
    const chartStartY = containerHeight * 0.025; // Small top margin proportional to height

    // Calculate available space for the heatmap cells
    const availableWidthForCells = containerWidth - chartStartX;
    const availableHeightForCells = containerHeight - chartStartY - xTickSpace - xLabelSpace - colorScaleSpace;
    
    // Calculate cell dimensions separately to allow rectangular cells
    const cellWidth = availableWidthForCells / cols;
    const cellHeight = availableHeightForCells / rows;
    
    const spacing = cellWidth * cellSpacing;
    const actualCellWidth = cellWidth - spacing;
    const actualCellHeight = cellHeight - spacing;

    // Calculate actual chart dimensions
    const chartWidth = cols * cellWidth;
    const chartHeight = rows * cellHeight;
    
    // Calculate total SVG dimensions needed
    const svgWidth = chartStartX + chartWidth;
    const svgHeight = chartStartY + chartHeight + xTickSpace + xLabelSpace + colorScaleSpace;

    // Function to get cell text content
    const getCellText = (value: number, rowIndex: number, colIndex: number): string => {
        if (labels && labels[rowIndex] && labels[rowIndex][colIndex] !== undefined) {
            return labels[rowIndex][colIndex];
        }
        return value.toFixed(2);
    };

    // Handle mouse events for tooltip
    const handleMouseEnter = (
        event: React.MouseEvent,
        value: number,
    ) => {
        const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
        const svgRect = (event.currentTarget.closest("svg") as SVGElement).getBoundingClientRect();

        setTooltip({
            value,
            x: ((rect.left + rect.width / 2 - svgRect.left) / svgRect.width) * 100,
            y: ((rect.top - svgRect.top) / svgRect.height) * 100,
            visible: true,
        });
    };

    const handleMouseLeave = () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
    };

    // Create gradient for continuous color bar
    const gradientId = `heatmap-gradient-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div ref={containerRef} className="relative w-full h-full">

            <svg
                className="w-full h-full"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Define gradient for color scale */}
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#e5e5e5" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                </defs>

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
                    {/* Add axis lines */}
                    {data.map((row, rowIndex) =>
                        row.map((value, colIndex) => (
                            <g key={`${rowIndex}-${colIndex}`}>
                                <rect
                                    x={colIndex * cellWidth + spacing / 2}
                                    y={rowIndex * cellHeight + spacing / 2}
                                    width={actualCellWidth}
                                    height={actualCellHeight}
                                    fill={getColor(value, minValue, maxValue)}
                                    stroke="none"
                                    className="cursor-pointer transition-opacity hover:opacity-80"
                                    onMouseEnter={(e) =>
                                        handleMouseEnter(e, value)
                                    }
                                    onMouseLeave={handleMouseLeave}
                                    rx={5}
                                    ry={5}
                                />
                                <text
                                    x={colIndex * cellWidth + cellWidth / 2}
                                    y={rowIndex * cellHeight + cellHeight / 2}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="fill-background pointer-events-none"
                                    fontSize={Math.min(fontSize, Math.min(actualCellWidth, actualCellHeight) / 4)}
                                >
                                    {getCellText(value, rowIndex, colIndex)}
                                </text>
                            </g>
                        ))
                    )}
                </g>

                {/* Y-axis tick labels */}
                {yTickLabels.length > 0 && !shouldHideColorbar && (
                    <g transform={`translate(${chartStartX - 10}, ${chartStartY})`}>
                        {yTickLabels.map((label, index) => (
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
                        ))}
                    </g>
                )}

                {/* X-axis tick labels */}
                {xTickLabels.length > 0 && !shouldHideColorbar && (
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

                {/* Continuous color scale legend */}
                {!shouldHideColorbar && (
                    <g transform={`translate(${chartStartX}, ${chartStartY + chartHeight + xTickSpace + (xAxisLabel ? 50 : 10)})`}>
                        {/* Continuous color bar */}
                        <rect
                            x={0}
                            y={0}
                            width={chartWidth * 0.6}
                            height={10}
                            rx={2.5}
                            ry={2.5}
                            fill={`url(#${gradientId})`}
                            stroke="#cccccc"
                            strokeWidth={0.2}
                        />

                        {/* Scale labels */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                            const value = minValue + (maxValue - minValue) * ratio;
                            const xPos = ratio * (chartWidth * 0.6);
                            return (
                                <g key={index}>
                                    {/* Label */}
                                    <text
                                        x={xPos}
                                        y={25}
                                        textAnchor="middle"
                                        dominantBaseline="hanging"
                                        className="fill-muted-foreground"
                                        fontSize={fontSize * 0.9}
                                    >
                                        {value.toFixed(2)}
                                    </text>
                                </g>
                            );
                        })}
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
                    <div className="text-xs text-gray-300">Value: {tooltip.value.toFixed(3)}</div>
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
            )}
        </div>
    );
};
