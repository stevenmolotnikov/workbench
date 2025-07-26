import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useAnnotations } from "@/stores/useAnnotations";
import type { CellPosition, HeatmapAnnotation } from "@/types/lens";
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
    chartIndex: number;
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
    chartIndex,
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

    console.log(data);

    const { annotations, pendingAnnotation, addPendingAnnotation, setAnnotations } =
        useAnnotations();

    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
    const [tempSelectedCells, setTempSelectedCells] = useState<Set<string>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<CellPosition | null>(null);
    const [dragEnd, setDragEnd] = useState<CellPosition | null>(null);

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

    // Helper function to create cell key
    const getCellKey = (row: number, col: number): string => `${row}-${col}`;

    // Helper function to check if a cell is selected
    const isCellSelected = (row: number, col: number): boolean => {
        return selectedCells.has(getCellKey(row, col));
    };

    // Helper function to check if a cell is annotated
    const isCellAnnotated = (row: number, col: number): boolean => {
        return annotations.some(
            (annotation) =>
                annotation.type === "heatmap" &&
                annotation.data.positions.some((pos) => pos.row === row && pos.col === col)
        );
    };

    // Helper function to check if a cell is part of pending annotation
    const isCellPending = (row: number, col: number): boolean => {
        return tempSelectedCells.has(getCellKey(row, col));
    };

    // Helper function to check if a cell is in drag selection
    const isCellInDragSelection = (row: number, col: number): boolean => {
        if (!isDragging || !dragStart || !dragEnd) return false;

        const minRow = Math.min(dragStart.row, dragEnd.row);
        const maxRow = Math.max(dragStart.row, dragEnd.row);
        const minCol = Math.min(dragStart.col, dragEnd.col);
        const maxCol = Math.max(dragStart.col, dragEnd.col);

        return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
    };

    // Handle drag start
    const handleMouseDown = (row: number, col: number, event: React.MouseEvent) => {
        event.preventDefault();
        setIsDragging(true);
        setDragStart({ row, col });
        setDragEnd({ row, col });
    };

    // Handle drag move
    const handleMouseEnterCell = (row: number, col: number) => {
        if (isDragging) {
            setDragEnd({ row, col });
        }
    };

    // Handle drag end
    const handleMouseUp = () => {
        if (isDragging && dragStart && dragEnd) {
            // Check if this was a single click (no drag movement)
            const isSingleClick = dragStart.row === dragEnd.row && dragStart.col === dragEnd.col;

            const selectedPositions: CellPosition[] = [];

            if (isSingleClick) {
                // Handle single cell selection/deselection
                const cellKey = getCellKey(dragStart.row, dragStart.col);
                const wasSelected = selectedCells.has(cellKey);

                setSelectedCells((prev) => {
                    const newSet = new Set(prev);
                    if (newSet.has(cellKey)) {
                        newSet.delete(cellKey);
                    } else {
                        newSet.add(cellKey);
                    }
                    return newSet;
                });

                if (!wasSelected) {
                    selectedPositions.push({ row: dragStart.row, col: dragStart.col });
                }
            } else {
                // Handle drag selection
                const minRow = Math.min(dragStart.row, dragEnd.row);
                const maxRow = Math.max(dragStart.row, dragEnd.row);
                const minCol = Math.min(dragStart.col, dragEnd.col);
                const maxCol = Math.max(dragStart.col, dragEnd.col);

                for (let r = minRow; r <= maxRow; r++) {
                    for (let c = minCol; c <= maxCol; c++) {
                        selectedPositions.push({ row: r, col: c });
                    }
                }

                setSelectedCells((prev) => {
                    const newSet = new Set(prev);
                    for (let r = minRow; r <= maxRow; r++) {
                        for (let c = minCol; c <= maxCol; c++) {
                            newSet.add(getCellKey(r, c));
                        }
                    }
                    return newSet;
                });
            }

            // Create pending annotation if cells were selected
            if (selectedPositions.length > 0) {
                const newAnnotation: HeatmapAnnotation = {
                    id: Date.now().toString(),
                    text: "New Annotation",
                    positions: selectedPositions,
                    chartIndex,
                };

                // Set temp selected cells for visual feedback
                const tempCellKeys = new Set(
                    selectedPositions.map((pos) => getCellKey(pos.row, pos.col))
                );
                setTempSelectedCells(tempCellKeys);

                // Clear regular selected cells since they're now pending
                setSelectedCells(new Set());

                addPendingAnnotation({ type: "heatmap", data: newAnnotation });
            }
        }

        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
    };

    // Add global mouse up listener
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDragging) {
                handleMouseUp();
            }
        };

        document.addEventListener("mouseup", handleGlobalMouseUp);
        return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
    }, [isDragging, dragStart, dragEnd]);

    // Handle pending annotation cancellation
    useEffect(() => {
        if (!pendingAnnotation || pendingAnnotation.type !== "heatmap") {
            setTempSelectedCells(new Set());
        }
    }, [pendingAnnotation]);

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

    // Check if container height is less than half of screen height
    const shouldHideColorbar = containerDimensions.height < window.innerHeight / 2;

    // Calculate space allocation as percentages of container size
    const yLabelSpace = yAxisLabel ? containerWidth * 0.04 : 0;
    const yTickSpace = yTickLabels.length > 0 ? containerWidth * 0.04 : 0;

    const xTickSpace = xTickLabels.length > 0 ? containerHeight * 0.04 : 0;
    const xLabelSpace = xAxisLabel ? containerHeight * 0.04 : 0;

    // const xLabelOffset = shouldHideColorbar ? 10 : 20;
    // const colorScaleSpace = shouldHideColorbar ? 0 : containerHeight * 0.1;
    const xLabelOffset = shouldHideColorbar ? 10 : 20;
    const colorScaleSpace = containerHeight * 0;

    const chartStartX = yLabelSpace + yTickSpace;
    const chartStartY = containerHeight * 0; // Small top margin proportional to height

    // Calculate available space for the heatmap cells
    const availableWidthForCells = containerWidth - chartStartX;
    const availableHeightForCells =
        containerHeight - chartStartY - xTickSpace - xLabelSpace - colorScaleSpace;

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
    const svgHeight = chartStartY + chartHeight + xTickSpace + xLabelSpace + colorScaleSpace;

    // Function to get cell text content
    const getCellText = (value: number, rowIndex: number, colIndex: number): string | null => {
        if (labels && labels[rowIndex] && labels[rowIndex][colIndex] !== undefined) {
            return labels[rowIndex][colIndex];
        }
        return null; // Return null when no labels are provided
    };

    // Handle mouse events for tooltip
    const handleMouseEnter = (event: React.MouseEvent, value: number) => {
        if (!isDragging) {
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
        }
    };

    const handleMouseLeave = () => {
        if (!isDragging) {
            setTooltip((prev) => ({ ...prev, visible: false }));
        }
    };

    // Create gradient for continuous color bar
    const gradientId = `heatmap-gradient-${Math.random().toString(36).substr(2, 9)}`;

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
                        row.map((value, colIndex) => {
                            const isSelected = isCellSelected(rowIndex, colIndex);
                            const isInDragSelection = isCellInDragSelection(rowIndex, colIndex);
                            const isAnnotated = isCellAnnotated(rowIndex, colIndex);
                            const isPending = isCellPending(rowIndex, colIndex);

                            // Determine border style based on state
                            let strokeColor = "none";
                            let strokeWidth = 0;

                            if (isAnnotated) {
                                strokeColor = "#16a34a"; // green for annotated
                                strokeWidth = 2;
                            } else if (isPending) {
                                strokeColor = "#f59e0b"; // amber for pending
                                strokeWidth = 2;
                            } else if (isSelected || isInDragSelection) {
                                strokeColor = "#2563eb"; // blue for selected
                                strokeWidth = 2;
                            }

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
                                                    stroke={strokeColor}
                                                    strokeWidth={strokeWidth}
                                                    className="cursor-pointer transition-opacity hover:opacity-80"
                                                    onMouseEnter={(e) => {
                                                        handleMouseEnter(e, value);
                                                        handleMouseEnterCell(rowIndex, colIndex);
                                                    }}
                                                    onMouseLeave={handleMouseLeave}
                                                    onMouseDown={(e) =>
                                                        handleMouseDown(rowIndex, colIndex, e)
                                                    }
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
                                                stroke={strokeColor}
                                                strokeWidth={strokeWidth}
                                                className="cursor-pointer transition-opacity hover:opacity-80"
                                                onMouseEnter={(e) => {
                                                    handleMouseEnter(e, value);
                                                    handleMouseEnterCell(rowIndex, colIndex);
                                                }}
                                                onMouseLeave={handleMouseLeave}
                                                onMouseDown={(e) =>
                                                    handleMouseDown(rowIndex, colIndex, e)
                                                }
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
                {yTickLabels.length > 0 && !shouldHideColorbar && (
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
                {/* {!shouldHideColorbar && ( */}
                {false && (
                    <g
                        transform={`translate(${chartStartX}, ${
                            chartStartY + chartHeight + xTickSpace + (xAxisLabel ? 50 : 10)
                        })`}
                    >
                        {/* Continuous color bar */}
                        <rect
                            x={0}
                            y={0}
                            width={chartWidth * 0.6}
                            height={6}
                            rx={3}
                            ry={3}
                            fill={`url(#${gradientId})`}
                            stroke="#cccccc"
                            strokeWidth={0.2}
                            className="cursor-pointer"
                            onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const svgRect = (e.currentTarget.closest('svg') as SVGElement).getBoundingClientRect();
                                const relativeX = e.clientX - rect.left;
                                const ratio = relativeX / rect.width;
                                const value = minValue + (maxValue - minValue) * Math.max(0, Math.min(1, ratio));
                                
                                setTooltip({
                                    value,
                                    x: ((rect.left + relativeX - svgRect.left) / svgRect.width) * 100,
                                    y: ((rect.top - svgRect.top) / svgRect.height) * 100,
                                    visible: true,
                                    isColorbar: true,
                                });
                            }}
                            onMouseMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const svgRect = (e.currentTarget.closest('svg') as SVGElement).getBoundingClientRect();
                                const relativeX = e.clientX - rect.left;
                                const ratio = relativeX / rect.width;
                                const value = minValue + (maxValue - minValue) * Math.max(0, Math.min(1, ratio));
                                
                                setTooltip({
                                    value,
                                    x: ((rect.left + relativeX - svgRect.left) / svgRect.width) * 100,
                                    y: ((rect.top - svgRect.top) / svgRect.height) * 100,
                                    visible: true,
                                    isColorbar: true,
                                });
                            }}
                            onMouseLeave={() => {
                                setTooltip(prev => ({ ...prev, visible: false }));
                            }}
                        />
                        
                        {/* End labels */}
                        <text
                            x={0}
                            y={25}
                            textAnchor="start"
                            dominantBaseline="hanging"
                            className="fill-muted-foreground"
                            fontSize={fontSize * 0.9}
                        >
                            {minValue.toFixed(2)}
                        </text>
                        <text
                            x={chartWidth * 0.6}
                            y={25}
                            textAnchor="end"
                            dominantBaseline="hanging"
                            className="fill-muted-foreground"
                            fontSize={fontSize * 0.9}
                        >
                            {maxValue.toFixed(2)}
                        </text>
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
