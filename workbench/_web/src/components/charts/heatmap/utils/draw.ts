import { heatmapMargin as margin } from "../../theming";
import { getCellDimensions, getCellBounds } from "./heatmap-geometry";
import { HeatmapData } from "@/types/charts";
import { HeatmapAnnotation } from "@/types/annotations";

// Helper function to draw a bounding rectangle
const drawBoundingRect = (
    ctx: CanvasRenderingContext2D,
    bounds: { minRow: number; maxRow: number; minCol: number; maxCol: number },
    dims: { cellWidth: number; cellHeight: number },
    style: { fillStyle: string; strokeStyle: string; lineWidth: number }
) => {
    const x = margin.left + bounds.minCol * dims.cellWidth;
    const y = margin.top + bounds.minRow * dims.cellHeight;
    const width = (bounds.maxCol - bounds.minCol + 1) * dims.cellWidth;
    const height = (bounds.maxRow - bounds.minRow + 1) * dims.cellHeight;

    ctx.fillStyle = style.fillStyle;
    ctx.strokeStyle = style.strokeStyle;
    ctx.lineWidth = style.lineWidth;

    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
};

// Draw selection on canvas
const drawSelection = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    data: HeatmapData,
    annotations: HeatmapAnnotation[],
    chartId: string,
    selectionRect: { startX: number; startY: number; endX: number; endY: number }
) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dims = getCellDimensions(canvasRef, data);
    if (!dims) return;

    // Clear canvas (accounting for device pixel ratio)
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Draw existing annotations
    if (annotations && chartId) {
        annotations.forEach((annotation) => {
            if (Array.isArray(annotation.cellIds) && annotation.cellIds.length > 0) {
                const bounds = getCellBounds(annotation.cellIds);
                if (bounds) {
                    drawBoundingRect(ctx, bounds, dims, {
                        fillStyle: "rgba(255, 0, 0, 0.2)",
                        strokeStyle: "red",
                        lineWidth: 2,
                    });
                }
            }
        });
    }

    // Draw current selection rectangle
    if (selectionRect) {
        // Translate absolute x values to column indices
        const firstRow = data.rows[0];
        const toIdx = (xVal: number) => firstRow.data.findIndex((c) => c.x === xVal);
        const startXIdx = toIdx(selectionRect.startX);
        const endXIdx = toIdx(selectionRect.endX);
        if (startXIdx === -1 || endXIdx === -1) return;

        const bounds = {
            minCol: Math.min(startXIdx, endXIdx),
            maxCol: Math.max(startXIdx, endXIdx),
            minRow: Math.min(selectionRect.startY, selectionRect.endY),
            maxRow: Math.max(selectionRect.startY, selectionRect.endY),
        };

        drawBoundingRect(ctx, bounds, dims, {
            fillStyle: "rgba(59, 130, 246, 0.3)",
            strokeStyle: "#3b82f6",
            lineWidth: 2,
        });
    }
};

export { drawBoundingRect, drawSelection };
