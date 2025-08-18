import React, { useCallback, useRef } from "react";
import { useLineCanvas } from "./LineCanvasProvider";
import { useLineData } from "./LineDataProvider";
import { lineMargin as margin } from "../theming";
import { SelectionBounds } from "@/types/charts";
import { useLineView } from "../ViewProvider";

export const useSelection = () => {
    const { lineCanvasRef, getNearestX, activeSelection, setActiveSelection } = useLineCanvas();
    const { setXRange, setYRange, xRange, yRange, bounds } = useLineData();
    const { persistView, clearView  } = useLineView();

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
            if (final) {
                setActiveSelection(final);
                persistView({
                    annotation: final,
                });
            }
            selectionRef.current = null;

            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, [lineCanvasRef, getNearestX, setActiveSelection, persistView]);

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

        const newXMin = Math.min(xMinData, xMaxData);
        const newXMax = Math.max(xMinData, xMaxData);
        const newYMin = Math.min(yMinData, yMaxData);
        const newYMax = Math.max(yMinData, yMaxData);
        setXRange([newXMin, newXMax]);
        setYRange([newYMin, newYMax]);

        // Clear the annotation and overwrite pending annotation view updates
        await clearSelection();
        persistView({
            bounds: { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax },
            annotation: undefined,
        });
    }, [lineCanvasRef, clearSelection, setXRange, setYRange, xRange, yRange, persistView]);

    // Reset the zoom to the default range
    const resetZoom = useCallback(async () => {
        await clearSelection();
        setXRange([bounds.xMin, bounds.xMax]);
        setYRange([0, 1]);
        clearView();
    }, [clearSelection, setXRange, setYRange, bounds, clearView]);

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
