import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLineCanvas } from "./LineCanvasProvider";
import { useLineData } from "./LineDataProvider";
import { lineMargin as margin } from "../theming";
import { SelectionBounds } from "@/types/charts";
import { drawRectPx, clear } from "./draw";

interface UseSelectionProps {
    rafRef: React.MutableRefObject<number | null>;
}

export const useSelection = ({ rafRef }: UseSelectionProps) => {
    const { lineCanvasRef, getNearestX } = useLineCanvas();
    const [activeSelection, setActiveSelection] = useState<SelectionBounds | null>(null);
    const { setXRange, setYRange, xRange, yRange, bounds } = useLineData();

    const selectionRef = useRef<SelectionBounds | null>(null);
    const didDragRef = useRef<boolean>(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        const rect = lineCanvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const startXRaw = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        const startX = getNearestX(startXRaw, true);
        const start = { xMin: startX, yMin: startY, xMax: startX, yMax: startY };
        selectionRef.current = start;
        setActiveSelection(start);
        didDragRef.current = false;

        let lastXRaw = startXRaw;
        let lastY = startY;

        const onMove = (ev: MouseEvent) => {
            const r = lineCanvasRef.current?.getBoundingClientRect();
            if (!r) return;
            const mxRaw = ev.clientX - r.left;
            const my = ev.clientY - r.top;
            const mx = getNearestX(mxRaw, true);
            const next = { xMin: start.xMin, yMin: start.yMin, xMax: mx, yMax: my };
            selectionRef.current = next;
            setActiveSelection(next);
            lastXRaw = mxRaw;
            lastY = my;
            if (Math.abs(lastXRaw - startXRaw) > 3 || Math.abs(lastY - startY) > 3) {
                didDragRef.current = true;
            }
        };

        const onUp = () => {
            const final = selectionRef.current;
            if (final) setActiveSelection(final);
            selectionRef.current = null;

            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, [lineCanvasRef, getNearestX, setActiveSelection]);

    const clearSelection = useCallback(async () => {
        setActiveSelection(null);
        selectionRef.current = null;
    }, [setActiveSelection]);

    // Zoom into the active selection
    const zoomIntoActiveSelection = useCallback(async (activeSelection: SelectionBounds | null) => {
        if (!activeSelection) return;
        const canvas = lineCanvasRef.current;
        if (!canvas) return;

        const minX = Math.max(margin.left, Math.min(activeSelection.xMin, activeSelection.xMax));
        const maxX = Math.min(canvas.clientWidth - margin.right, Math.max(activeSelection.xMin, activeSelection.xMax));
        const minY = Math.max(margin.top, Math.min(activeSelection.yMin, activeSelection.yMax));
        const maxY = Math.min(canvas.clientHeight - margin.bottom, Math.max(activeSelection.yMin, activeSelection.yMax));

        const innerWidth = Math.max(1, canvas.clientWidth - margin.left - margin.right);
        const innerHeight = Math.max(1, canvas.clientHeight - margin.top - margin.bottom);

        const xMinData = xRange[0] + ((minX - margin.left) / innerWidth) * (xRange[1] - xRange[0]);
        const xMaxData = xRange[0] + ((maxX - margin.left) / innerWidth) * (xRange[1] - xRange[0]);
        const yMinData = yRange[0] + (1 - (maxY - margin.top) / innerHeight) * (yRange[1] - yRange[0]);
        const yMaxData = yRange[0] + (1 - (minY - margin.top) / innerHeight) * (yRange[1] - yRange[0]);

        await clearSelection();
        const newXMin = Math.min(xMinData, xMaxData);
        const newXMax = Math.max(xMinData, xMaxData);
        const newYMin = Math.min(yMinData, yMaxData);
        const newYMax = Math.max(yMinData, yMaxData);
        setXRange([newXMin, newXMax]);
        setYRange([newYMin, newYMax]);
    }, [lineCanvasRef, clearSelection, setXRange, setYRange, xRange, yRange]);

    // Reset the zoom to the default range
    const resetZoom = useCallback(async () => {
        await clearSelection();
        setXRange([bounds.xMin, bounds.xMax]);
        setYRange([0, 1]);
    }, [clearSelection, setXRange, setYRange, bounds]);

    // Draw the selection rectangle
    useEffect(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            if (activeSelection) {
                drawRectPx(lineCanvasRef, activeSelection.xMin, activeSelection.yMin, activeSelection.xMax, activeSelection.yMax);
            } else {
                clear(lineCanvasRef);
            }
        });
    }, [activeSelection, rafRef, lineCanvasRef]);

    return {
        handleMouseDown,
        clearSelection,
        zoomIntoActiveSelection,
        resetZoom,
        activeSelection,
        didDragRef,
        getNearestX,
    };
};
