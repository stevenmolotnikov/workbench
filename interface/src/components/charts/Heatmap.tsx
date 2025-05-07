import React, { useState, useMemo } from 'react';

// Color definitions for grayscale-to-blue scheme
const GrayToBlueColors = {
  lightGray: [229, 229, 229], // #e5e5e5 - for lower values
  blue: [59, 130, 246],       // #3b82f6 - for higher values
};

// Helper function to interpolate between two colors based on a value's position
const interpolateColor = (value: number, min: number, max: number, color1: number[], color2: number[]): string => {
  // Ensure components are integers
  const c1 = color1.map(Math.round);
  const c2 = color2.map(Math.round);

  // Calculate the interpolation factor t (0 to 1)
  const t = (max - min === 0) ? 1 : (value - min) / (max - min); // Avoid division by zero
  
  // Interpolate between color1 and color2
  const r = Math.round(c1[0] * (1 - t) + c2[0] * t);
  const g = Math.round(c1[1] * (1 - t) + c2[1] * t);
  const b = Math.round(c1[2] * (1 - t) + c2[2] * t);
  
  return `rgb(${Math.max(0, Math.min(255, r))},${Math.max(0, Math.min(255, g))},${Math.max(0, Math.min(255, b))})`;
};

interface HoveredCellInfo {
  row: number;
  col: number;
  value: number | string; // Allow string for 'N/A'
  xPos: number;
  yPos: number;
}

interface HeatmapProps {
  data: (number | string | null)[][];
  rowLabels: (string | number)[];
  colLabels: (string | number)[];
  width?: number;
  height?: number;
  cellPadding?: number;
  activeAnnotation: { x: number; y: number } | null;
  setActiveAnnotation: (coords: { x: number; y: number } | null) => void;
  annotations: { id: string; x: number; y: number; text: string; timestamp: number }[];
}

/**
 * Heatmap Component
 * @param {object} props
 * @param {number[][]} props.data - 2D array of numerical data for the heatmap.
 * @param {string[]|number[]} props.rowLabels - Array of labels for rows (Y-axis).
 * @param {string[]|number[]} props.colLabels - Array of labels for columns (X-axis).
 * @param {number} [props.width=600] - Total width of the SVG container.
 * @param {number} [props.height=450] - Total height of the SVG container.
 * @param {number} [props.cellPadding=1] - Padding between cells in pixels.
 * @param {object} props.activeAnnotation - The currently active annotation coordinates.
 * @param {function} props.setActiveAnnotation - Function to set the active annotation.
 * @param {Array} props.annotations - Array of existing annotations.
 */
export const Heatmap = ({
  data,
  rowLabels,
  colLabels,
  width = 600,
  height = 450,
  cellPadding = 1,
  activeAnnotation,
  setActiveAnnotation,
  annotations = [],
}: HeatmapProps) => {
  // State to store information about the currently hovered cell for the tooltip
  const [hoveredCell, setHoveredCell] = useState<HoveredCellInfo | null>(null);

  // Define margins and dimensions for the heatmap elements
  const MARGIN = { top: 40, right: 130, bottom: 60, left: 90 }; // Adjusted for labels and color bar
  const COLOR_BAR_WIDTH = 20;
  const COLOR_BAR_PADDING = 15;
  const AXIS_LABEL_PADDING = 8; // Padding for axis labels from the heatmap
  const TOOLTIP_OFFSET_Y = -10; // Offset for the tooltip above the cell center

  // Memoize calculation of min and max values from the data
  const { minVal, maxVal } = useMemo(() => {
    const numRows = data?.length || 0;
    const numCols = data?.[0]?.length || 0;

    if (numRows === 0 || numCols === 0) {
      return { minVal: 0, maxVal: 0 };
    }

    let min = Infinity;
    let max = -Infinity;
    data.forEach((row: (number | string | null)[]) => row.forEach((val: number | string | null) => {
      if (typeof val === 'number' && !isNaN(val)) { // Ensure value is a valid number
        if (val < min) min = val;
        if (val > max) max = val;
      }
    }));
    
    // Handle cases where no valid numeric data is found or all data is non-numeric
    if (min === Infinity || max === -Infinity) {
        return { minVal: 0, maxVal: 0 };
    }
    return { minVal: min, maxVal: max };
  }, [data]);

  // Calculate dimensions of the main chart area
  const chartWidth = width - MARGIN.left - MARGIN.right;
  const chartHeight = height - MARGIN.top - MARGIN.bottom;

  const numRows = data?.length || 0;
  const numCols = data?.[0]?.length || 0;

  // Calculate individual cell dimensions, accounting for padding
  const cellWidth = numCols > 0 ? (chartWidth - (numCols - 1) * cellPadding) / numCols : 0;
  const cellHeight = numRows > 0 ? (chartHeight - (numRows - 1) * cellPadding) / numRows : 0;

  // Function to get the color for a given data value
  const getColor = (value: number | string | null): string => {
    if (typeof value !== 'number' || isNaN(value)) return 'rgb(200,200,200)'; // Default gray for non-numeric
    if (maxVal === minVal) return `rgb(${GrayToBlueColors.lightGray.join(',')})`; // Single color if no range

    // Clamp value to the min/max range to prevent extrapolation issues
    const clampedValue = Math.max(minVal, Math.min(maxVal, value));
    return interpolateColor(clampedValue, minVal, maxVal, GrayToBlueColors.lightGray, GrayToBlueColors.blue);
  };

  // Prepare labels for the color bar
  const colorBarLabels = useMemo(() => {
    const labels = [];
    if (minVal === maxVal) {
      labels.push({ value: minVal, yPos: MARGIN.top + chartHeight / 2 });
    } else {
      labels.push({ value: minVal, yPos: MARGIN.top + chartHeight }); // Bottom
      labels.push({ value: maxVal, yPos: MARGIN.top }); // Top
    }
    return labels;
  }, [minVal, maxVal, MARGIN.top, chartHeight]);

  if (numRows === 0 || numCols === 0 || cellWidth <=0 || cellHeight <=0) {
    return <div className="p-4">Not enough data or space to render heatmap.</div>;
  }

  return (
    <svg width={width} height={height} className="bg-transparent">
      {/* Main group for heatmap cells and axes, translated by margin */}
      <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
        {/* Heatmap Cells */}
        {data.map((row: (number | string | null)[], rowIndex: number) =>
          row.map((value: number | string | null, colIndex: number) => {
            const x = colIndex * (cellWidth + cellPadding);
            const y = rowIndex * (cellHeight + cellPadding);
            
            // Check if this cell is currently selected for annotation
            const isActive = activeAnnotation && 
                            activeAnnotation.x === colIndex && 
                            activeAnnotation.y === rowIndex;
            
            // Check if this cell has an existing annotation
            const hasAnnotation = annotations.some(
              annotation => annotation.x === colIndex && 
                           annotation.y === rowIndex && 
                           annotation.text.trim() !== ""
            );
            
            // This cell should have a border if it's either active or has an annotation
            const shouldHighlight = isActive || hasAnnotation;

            return (
              <rect
                key={`cell-${rowIndex}-${colIndex}`}
                x={x}
                y={y}
                width={Math.max(0, cellWidth)} // Ensure non-negative width
                height={Math.max(0, cellHeight)} // Ensure non-negative height
                fill={getColor(value)}
                onClick={() => setActiveAnnotation({ x: colIndex, y: rowIndex })}
                onMouseEnter={() => setHoveredCell({
                  row: rowIndex,
                  col: colIndex,
                  value: typeof value === 'number' ? value : (value === null ? 'N/A' : value),
                  // Tooltip position: center of the cell
                  xPos: MARGIN.left + x + cellWidth / 2,
                  yPos: MARGIN.top + y + cellHeight / 2
                })}
                onMouseLeave={() => setHoveredCell(null)}
                className="cursor-pointer transition-opacity duration-150 hover:opacity-75"
                rx="2"
                ry="2"
                stroke={shouldHighlight ? "white" : "none"}
                strokeWidth={shouldHighlight ? 3 : 0}
              />
            );
          })
        )}

        {/* Y-Axis Labels (Row Labels) */}
        {rowLabels.slice(0, numRows).map((label: string | number, i: number) => (
          <text
            key={`row-label-${i}`}
            x={-AXIS_LABEL_PADDING} // Position to the left of the heatmap
            y={i * (cellHeight + cellPadding) + cellHeight / 2}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-xs select-none"
            fill="currentColor"
          >
            {label}
          </text>
        ))}

        {/* X-Axis Labels (Column Labels) */}
        {colLabels.slice(0, numCols).map((label: string | number, i: number) => (
          <text
            key={`col-label-${i}`}
            x={i * (cellWidth + cellPadding) + cellWidth / 2}
            y={chartHeight + AXIS_LABEL_PADDING} // Position below the heatmap
            textAnchor="middle"
            dominantBaseline="hanging"
            className="text-xs select-none"
            fill="currentColor"
          >
            {label}
          </text>
        ))}
      </g>

      {/* Color Bar Elements */}
      <g transform={`translate(${MARGIN.left + chartWidth + COLOR_BAR_PADDING}, ${MARGIN.top})`}>
        {/* Gradient definition for the color bar */}
        <defs>
          <linearGradient id="colorBarGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            {/* Gradient stops from min to max values */}
            <stop offset="0%" stopColor={getColor(minVal)} />
            <stop offset="100%" stopColor={getColor(maxVal)} />
          </linearGradient>
        </defs>
        {/* Color bar rectangle filled with the gradient */}
        <rect
          x={0}
          y={0}
          width={COLOR_BAR_WIDTH}
          height={chartHeight}
          fill="url(#colorBarGradient)"
          stroke="#ccc"
          strokeWidth="0.5"
        />
        {/* Labels for the color bar (min, max values) */}
        {colorBarLabels.map(({ value, yPos }, idx) => (
          <text
            key={`colorbar-label-${idx}`}
            x={COLOR_BAR_WIDTH + AXIS_LABEL_PADDING / 2}
            // Adjust yPos from SVG top to color bar relative position
            y={yPos - MARGIN.top} 
            textAnchor="start"
            dominantBaseline="middle"
            className="text-xs select-none"
            fill="currentColor"
          >
            {typeof value === 'number' ? value.toFixed(1) : 'N/A'}
          </text>
        ))}
      </g>
      
      {/* Tooltip for Hovered Cell */}
      {hoveredCell && (
        // Group for tooltip elements, positioned by hovered cell's center
        <g transform={`translate(${hoveredCell.xPos}, ${hoveredCell.yPos + TOOLTIP_OFFSET_Y})`} className="pointer-events-none">
           {/* Background for the tooltip text */}
          <rect 
            x="-35" // Centered based on text length guess
            y="-12" 
            width="70" // Adjust width as needed
            height="20" 
            fill="rgba(0,0,0,0.75)" 
            rx="4" // Rounded corners
            ry="4"
          />
          {/* Tooltip text displaying the cell value */}
          <text
            x="0" // Centered horizontally
            y="0" // Centered vertically in the rect
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-semibold select-none"
            fill="currentColor"
          >
            {hoveredCell.value !== 'N/A' && typeof hoveredCell.value === 'number' ? hoveredCell.value.toFixed(2) : hoveredCell.value}
          </text>
        </g>
      )}
    </svg>
  );
};

