import React from "react";
import { HeatmapData } from "@/types/charts";

export const Heatmap: React.FC<HeatmapData> = ({
    data,
    labels,
    xTickLabels = [],
    yTickLabels = [],
    xAxisLabel = "",
    yAxisLabel = "",
    cellSize = 40,
    fontSize = 12,
}) => {
    // Find min and max values for color scaling
    const flatData = data.flat();
    const minValue = Math.min(...flatData);
    const maxValue = Math.max(...flatData);

    // Convert value to color
    const getColor = (value: number): string => {
        if (maxValue === minValue) return "#e5e5e5";

        const normalized = (value - minValue) / (maxValue - minValue);

        // Interpolate between #e5e5e5 (light gray) and #3b82f6 (blue)
        const r1 = 229,
            g1 = 229,
            b1 = 229; // #e5e5e5
        const r2 = 59,
            g2 = 130,
            b2 = 246; // #3b82f6

        const r = Math.round(r1 + (r2 - r1) * normalized);
        const g = Math.round(g1 + (g2 - g1) * normalized);
        const b = Math.round(b1 + (b2 - b1) * normalized);

        return `rgb(${r}, ${g}, ${b})`;
    };

    const rows = data.length;
    const cols = rows > 0 ? data[0].length : 0;

    // Calculate dimensions
    const chartWidth = cols * cellSize;
    const chartHeight = rows * cellSize;
    const margin = { top: 60, right: 60, bottom: 80, left: 80 };
    const totalWidth = chartWidth + margin.left + margin.right;
    const totalHeight = chartHeight + margin.top + margin.bottom;

    // Function to get cell text content
    const getCellText = (value: number, rowIndex: number, colIndex: number): string => {
        if (labels && labels[rowIndex] && labels[rowIndex][colIndex] !== undefined) {
            return labels[rowIndex][colIndex];
        }
        return value.toFixed(2);
    };

    return (
        <div className="p-6 bg-white">
            <svg width={totalWidth} height={totalHeight} className="border border-gray-200">
                {/* Y-axis label */}
                {yAxisLabel && (
                    <text
                        x={20}
                        y={totalHeight / 2}
                        textAnchor="middle"
                        transform={`rotate(-90, 20, ${totalHeight / 2})`}
                        className="fill-gray-700 font-medium"
                        fontSize={fontSize + 2}
                    >
                        {yAxisLabel}
                    </text>
                )}

                {/* X-axis label */}
                {xAxisLabel && (
                    <text
                        x={totalWidth / 2}
                        y={totalHeight - 20}
                        textAnchor="middle"
                        className="fill-gray-700 font-medium"
                        fontSize={fontSize + 2}
                    >
                        {xAxisLabel}
                    </text>
                )}

                {/* Heatmap cells */}
                <g transform={`translate(${margin.left}, ${margin.top})`}>
                    {data.map((row, rowIndex) =>
                        row.map((value, colIndex) => (
                            <g key={`${rowIndex}-${colIndex}`}>
                                <rect
                                    x={colIndex * cellSize}
                                    y={rowIndex * cellSize}
                                    width={cellSize}
                                    height={cellSize}
                                    fill={getColor(value)}
                                    stroke="#ffffff"
                                    strokeWidth={1}
                                />
                                <text
                                    x={colIndex * cellSize + cellSize / 2}
                                    y={rowIndex * cellSize + cellSize / 2}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="fill-gray-800 pointer-events-none"
                                    fontSize={Math.min(fontSize, cellSize / 3)}
                                >
                                    {getCellText(value, rowIndex, colIndex)}
                                </text>
                            </g>
                        ))
                    )}
                </g>

                {/* Y-axis tick labels */}
                <g transform={`translate(${margin.left - 10}, ${margin.top})`}>
                    {yTickLabels.map((label, index) => (
                        <text
                            key={index}
                            x={0}
                            y={index * cellSize + cellSize / 2}
                            textAnchor="end"
                            dominantBaseline="middle"
                            className="fill-gray-600"
                            fontSize={fontSize}
                        >
                            {label}
                        </text>
                    ))}
                </g>

                {/* X-axis tick labels */}
                <g transform={`translate(${margin.left}, ${margin.top + chartHeight + 10})`}>
                    {xTickLabels.map((label, index) => (
                        <text
                            key={index}
                            x={index * cellSize + cellSize / 2}
                            y={0}
                            textAnchor="middle"
                            dominantBaseline="hanging"
                            className="fill-gray-600"
                            fontSize={fontSize}
                        >
                            {label}
                        </text>
                    ))}
                </g>

                {/* Color scale legend */}
                <g transform={`translate(${totalWidth - 50}, ${margin.top})`}>
                    <text x={0} y={-10} className="fill-gray-700 font-medium" fontSize={fontSize}>
                        Scale
                    </text>
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                        const value = minValue + (maxValue - minValue) * ratio;
                        return (
                            <g key={index}>
                                <rect
                                    x={0}
                                    y={index * 20}
                                    width={15}
                                    height={15}
                                    fill={getColor(value)}
                                    stroke="#ffffff"
                                    strokeWidth={1}
                                />
                                <text
                                    x={20}
                                    y={index * 20 + 7.5}
                                    dominantBaseline="middle"
                                    className="fill-gray-600"
                                    fontSize={fontSize - 1}
                                >
                                    {value.toFixed(2)}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};
