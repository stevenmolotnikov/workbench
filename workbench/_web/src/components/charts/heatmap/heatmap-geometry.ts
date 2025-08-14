import { HeatmapData } from "@/types/charts";
import { heatmapMargin as margin } from "../theming";

// Calculate cell dimensions based on canvas size and data
const getCellDimensions = (canvasRef: React.RefObject<HTMLCanvasElement>, data: HeatmapData) => {
    if (!canvasRef.current || !data.rows.length || !data.rows[0].data.length) {
        return null;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const gridWidth = width - margin.left - margin.right;
    const gridHeight = height - margin.top - margin.bottom;

    const numCols = data.rows[0].data.length;
    const numRows = data.rows.length;

    const cellWidth = gridWidth / numCols;
    const cellHeight = gridHeight / numRows;

    return {
        cellWidth,
        cellHeight,
        gridWidth,
        gridHeight,
        numCols,
        numRows,
    };
};

// Convert mouse position to cell indices
const getCellFromPosition = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    data: HeatmapData,
    x: number,
    y: number
) => {
    const dims = getCellDimensions(canvasRef, data);
    if (!dims) return null;

    const gridX = Math.max(0, x - margin.left);
    const gridY = Math.max(0, y - margin.top);

    if (gridX < 0 || gridY < 0 || gridX >= dims.gridWidth || gridY >= dims.gridHeight) {
        return null;
    }

    const col = Math.floor(gridX / dims.cellWidth);
    const row = Math.floor(gridY / dims.cellHeight);

    if (col >= 0 && col < dims.numCols && row >= 0 && row < dims.numRows) {
        return { col, row };
    }

    return null;
};

// Helper function to get bounding box from cell IDs
const getCellBounds = (
    cellIds: string[]
) => {
    let minRow = Infinity,
        maxRow = -Infinity;
    let minCol = Infinity,
        maxCol = -Infinity;

    cellIds.forEach((cellId) => {
        const parts = cellId.split("-");
        if (parts.length >= 3) {
            const row = parseInt(parts[parts.length - 2]);
            const col = parseInt(parts[parts.length - 1]);

            if (!isNaN(row) && !isNaN(col)) {
                minRow = Math.min(minRow, row);
                maxRow = Math.max(maxRow, row);
                minCol = Math.min(minCol, col);
                maxCol = Math.max(maxCol, col);
            }
        }
    });

    return minRow !== Infinity ? { minRow, maxRow, minCol, maxCol } : null;
};

export { getCellDimensions, getCellFromPosition, getCellBounds };