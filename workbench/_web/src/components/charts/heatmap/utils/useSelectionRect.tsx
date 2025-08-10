import { heatmapMargin as margin } from "../../theming";
import { getCellDimensions, getCellBounds } from "./heatmap-geometry";
import { HeatmapData } from "@/types/charts";
import { HeatmapAnnotation } from "@/types/annotations";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { getAnnotations } from "@/lib/queries/annotationQueries";
import { useQuery } from "@tanstack/react-query";
import { Annotation } from "@/db/schema";

interface SelectionRect {
    startX: number
    startY: number
    endX: number
    endY: number
}

interface useSelectionRectProps {
    canvasRef: React.RefObject<HTMLCanvasElement>
    data: HeatmapData
    chartId: string | null
    selectionRect: SelectionRect | null
}

const useSelectionRect = ({ canvasRef, data, chartId, selectionRect }: useSelectionRectProps) => {
    const animationFrameRef = useRef<number>()

    const { data: allAnnotations } = useQuery<Annotation[]>({
        queryKey: ["annotations", chartId],
        queryFn: () => getAnnotations(chartId!),
        enabled: !!chartId,
    });

    const annotations = useMemo(
        () => allAnnotations?.filter((annotation) => annotation.type === "heatmap").map((annotation) => annotation.data as HeatmapAnnotation) ?? [],
        [allAnnotations]
    );

    // Map x values to their column index for fast lookup during draw
    const xIndexByValue = useMemo(() => {
        const firstRow = data.rows[0]
        const map = new Map<number, number>()
        if (firstRow) {
            for (let i = 0; i < firstRow.data.length; i++) {
                const xVal = firstRow.data[i]?.x as number
                if (typeof xVal === 'number') {
                    map.set(xVal, i)
                }
            }
        }
        return map
    }, [data])


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
    const drawSelection = useCallback((
        chartId: string | null,
        selectionRect: SelectionRect | null
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
            const startXIdx = xIndexByValue.get(selectionRect.startX) ?? -1;
            const endXIdx = xIndexByValue.get(selectionRect.endX) ?? -1;
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
    }, [annotations, canvasRef, data, xIndexByValue]);

    // Redraw when selection changes
    useEffect(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }
        animationFrameRef.current = requestAnimationFrame(() => {
            drawSelection(chartId, selectionRect)
        })
    }, [selectionRect, chartId, drawSelection])
}

export default useSelectionRect;