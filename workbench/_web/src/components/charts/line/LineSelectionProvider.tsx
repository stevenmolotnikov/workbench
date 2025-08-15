import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useCanvas } from "./CanvasProvider";
import { useLineData } from "./LineDataProvider";
import { lineMargin as margin } from "../theming";
import { Range } from "@/types/charts";

interface LineSelectionContextValue {
    activeSelection: { x0: number; y0: number; x1: number; y1: number } | null;
    zoomIntoActiveSelection: () => Promise<void>;
    clearSelection: () => Promise<void>;
}

const LineSelectionContext = createContext<LineSelectionContextValue | null>(null);

export const useLineSelection = () => {
    const ctx = useContext(LineSelectionContext);
    if (!ctx) throw new Error("useLineSelection must be used within a LineSelectionProvider");
    return ctx;
};

export const LineSelectionProvider = ({ children }: { children: ReactNode }) => {
    const { selectionCanvasRef, rafRef, drawRectPx, clear } = useCanvas();
        const { bounds, xRange, yRange, setXRange, setYRange } = useLineData();

    const [activeSelection, setActiveSelection] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
    const selectionRef = useRef<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

    const getCurrentRanges = useCallback((): { x: Range; y: Range } => {
        const x = xRange ?? [bounds.xMin, bounds.xMax];
        const y = yRange ?? [bounds.yMin, bounds.yMax];
        return { x, y };
    }, [bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax, xRange, yRange]);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        const rect = selectionCanvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;

        const start = { x0: startX, y0: startY, x1: startX, y1: startY };
        selectionRef.current = start;
        setActiveSelection(start);

        const onMove = (ev: MouseEvent) => {
            const r = selectionCanvasRef.current?.getBoundingClientRect();
            if (!r) return;
            const mx = ev.clientX - r.left;
            const my = ev.clientY - r.top;
            const next = { x0: startX, y0: startY, x1: mx, y1: my };
            selectionRef.current = next;
            setActiveSelection(next);
        };

        const onUp = () => {
            const final = selectionRef.current;
            if (final) {
                setActiveSelection(final);
            }
            selectionRef.current = null;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, [selectionCanvasRef]);

    useEffect(() => {
        const canvas = selectionCanvasRef.current;
        if (!canvas) return;
        canvas.addEventListener('mousedown', handleMouseDown);
        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
        };
    }, [handleMouseDown, selectionCanvasRef]);

    const clearSelection = useCallback(async () => {
        setActiveSelection(null);
        clear();
        // Here you can delete persisted annotation for line chart if desired
        // await deleteAnnotation(...)
    }, [clear]);

    const zoomIntoActiveSelection = useCallback(async () => {
        if (!activeSelection) return;
        const canvas = selectionCanvasRef.current;
        if (!canvas) return;

        const minX = Math.max(margin.left, Math.min(activeSelection.x0, activeSelection.x1));
        const maxX = Math.min(canvas.clientWidth - margin.right, Math.max(activeSelection.x0, activeSelection.x1));
        const minY = Math.max(margin.top, Math.min(activeSelection.y0, activeSelection.y1));
        const maxY = Math.min(canvas.clientHeight - margin.bottom, Math.max(activeSelection.y0, activeSelection.y1));

        const innerWidth = Math.max(1, canvas.clientWidth - margin.left - margin.right);
        const innerHeight = Math.max(1, canvas.clientHeight - margin.top - margin.bottom);

        const { x: curX, y: curY } = getCurrentRanges();
        const xMinData = curX[0] + ((minX - margin.left) / innerWidth) * (curX[1] - curX[0]);
        const xMaxData = curX[0] + ((maxX - margin.left) / innerWidth) * (curX[1] - curX[0]);
        const yMinData = curY[0] + (1 - (maxY - margin.top) / innerHeight) * (curY[1] - curY[0]);
        const yMaxData = curY[0] + (1 - (minY - margin.top) / innerHeight) * (curY[1] - curY[0]);

        await clearSelection();
        setXRange([Math.min(xMinData, xMaxData), Math.max(xMinData, xMaxData)]);
        setYRange([Math.min(yMinData, yMaxData), Math.max(yMinData, yMaxData)]);

        // Here you can persist chart view if desired
        // await updateChartView(...)
    }, [activeSelection, selectionCanvasRef, getCurrentRanges, clearSelection, setXRange, setYRange]);

    // draw selection
    useEffect(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            if (activeSelection) {
                drawRectPx(activeSelection.x0, activeSelection.y0, activeSelection.x1, activeSelection.y1);
            } else {
                clear();
            }
        });
    }, [activeSelection, drawRectPx, clear, rafRef]);

    const value: LineSelectionContextValue = {
        activeSelection,
        zoomIntoActiveSelection,
        clearSelection,
    };

    return (
        <LineSelectionContext.Provider value={value}>
            {children}
        </LineSelectionContext.Provider>
    );
};


