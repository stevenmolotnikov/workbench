import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useLineView } from "./LineViewProvider";
import { useLineData } from "./LineDataProvider";
import { lineMargin as margin } from "../theming";
import { SelectionBounds } from "@/types/charts";

interface LineInteractionContextValue {
    activeSelection: SelectionBounds | null;
    zoomIntoActiveSelection: () => Promise<void>;
    clearSelection: () => Promise<void>;
    handleMouseDown: (e: MouseEvent) => void;
}

const LineInteractionContext = createContext<LineInteractionContextValue | null>(null);

export const useLineInteraction = () => {
    const ctx = useContext(LineInteractionContext);
    if (!ctx) throw new Error("useLineInteraction must be used within a LineInteractionProvider");
    return ctx;
};

export const LineInteractionProvider = ({ children }: { children: ReactNode }) => {
    const { selectionCanvasRef, rafRef, drawRectPx, clear } = useLineView();
    const { bounds, setXRange, setYRange } = useLineData();

    const [activeSelection, setActiveSelection] = useState<SelectionBounds | null>(null);
    const selectionRef = useRef<SelectionBounds | null>(null);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        const rect = selectionCanvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;

        const start = { xMin: startX, yMin: startY, xMax: startX, yMax: startY };
        selectionRef.current = start;
        setActiveSelection(start);

        const onMove = (ev: MouseEvent) => {
            const r = selectionCanvasRef.current?.getBoundingClientRect();
            if (!r) return;
            const mx = ev.clientX - r.left;
            const my = ev.clientY - r.top;
            const next = { xMin: startX, yMin: startY, xMax: mx, yMax: my };
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

        const minX = Math.max(margin.left, Math.min(activeSelection.xMin, activeSelection.xMax));
        const maxX = Math.min(canvas.clientWidth - margin.right, Math.max(activeSelection.xMin, activeSelection.xMax));
        const minY = Math.max(margin.top, Math.min(activeSelection.yMin, activeSelection.yMax));
        const maxY = Math.min(canvas.clientHeight - margin.bottom, Math.max(activeSelection.yMin, activeSelection.yMax));

        const innerWidth = Math.max(1, canvas.clientWidth - margin.left - margin.right);
        const innerHeight = Math.max(1, canvas.clientHeight - margin.top - margin.bottom);

        const curX = [bounds.xMin, bounds.xMax];
        const curY = [bounds.yMin, bounds.yMax];
        const xMinData = curX[0] + ((minX - margin.left) / innerWidth) * (curX[1] - curX[0]);
        const xMaxData = curX[0] + ((maxX - margin.left) / innerWidth) * (curX[1] - curX[0]);
        const yMinData = curY[0] + (1 - (maxY - margin.top) / innerHeight) * (curY[1] - curY[0]);
        const yMaxData = curY[0] + (1 - (minY - margin.top) / innerHeight) * (curY[1] - curY[0]);

        await clearSelection();
        setXRange([Math.min(xMinData, xMaxData), Math.max(xMinData, xMaxData)]);
        setYRange([Math.min(yMinData, yMaxData), Math.max(yMinData, yMaxData)]);

        // Here you can persist chart view if desired
        // await updateChartView(...)
    }, [activeSelection, selectionCanvasRef, clearSelection, setXRange, setYRange, bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax]);

    // draw selection
    useEffect(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            if (activeSelection) {
                drawRectPx(activeSelection.xMin, activeSelection.yMin, activeSelection.xMax, activeSelection.yMax);
            } else {
                clear();
            }
        });
    }, [activeSelection, drawRectPx, clear, rafRef]);

    const value: LineInteractionContextValue = {
        activeSelection,
        zoomIntoActiveSelection,
        clearSelection,
        handleMouseDown,
    };

    return (
        <LineInteractionContext.Provider value={value}>
            {children}
        </LineInteractionContext.Provider>
    );
};


