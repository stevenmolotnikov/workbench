import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useLineView } from "./LineViewProvider";
import { useLineData } from "./LineDataProvider";
import { lineMargin as margin } from "../theming";
import { SelectionBounds } from "@/types/charts";
import type { PointOrSliceMouseHandler } from '@nivo/line'
import type { Line as ChartLine } from '@/types/charts'

interface LineInteractionContextValue {
    activeSelection: SelectionBounds | null;
    zoomIntoActiveSelection: () => Promise<void>;
    clearSelection: () => Promise<void>;
    handleMouseDown: PointOrSliceMouseHandler<ChartLine>;
    handleMouseMove: PointOrSliceMouseHandler<ChartLine>;
    handleMouseUp: PointOrSliceMouseHandler<ChartLine>;
    handleMouseLeave: PointOrSliceMouseHandler<ChartLine>;
}

const LineInteractionContext = createContext<LineInteractionContextValue | null>(null);

export const useLineInteraction = () => {
    const ctx = useContext(LineInteractionContext);
    if (!ctx) throw new Error("useLineInteraction must be used within a LineInteractionProvider");
    return ctx;
};

export const LineInteractionProvider = ({ children }: { children: ReactNode }) => {
    const { selectionCanvasRef, rafRef, drawRectPx, clear } = useLineView();
    const { bounds, setXRange, setYRange, data } = useLineData();

    const [activeSelection, setActiveSelection] = useState<SelectionBounds | null>(null);
    const selectionRef = useRef<SelectionBounds | null>(null);
    const windowMouseUpAttachedRef = useRef<boolean>(false);

    const uniqueSortedX = React.useMemo(() => {
        const set = new Set<number>();
        data.lines.forEach(line => {
            line.data.forEach(p => set.add(p.x));
        });
        return Array.from(set).sort((a, b) => a - b);
    }, [data]);

    const snapPxToNearestX = useCallback((px: number): number => {
        const canvas = selectionCanvasRef.current;
        if (!canvas || uniqueSortedX.length === 0) return px;
        const innerWidth = Math.max(1, canvas.clientWidth - margin.left - margin.right);
        const xDomainMin = bounds.xMin;
        const xDomainMax = bounds.xMax;
        const domainSpan = Math.max(1e-9, xDomainMax - xDomainMin);
        const xVal = xDomainMin + ((px - margin.left) / innerWidth) * domainSpan;
        
        let nearest = uniqueSortedX[0];
        let bestDist = Math.abs(xVal - nearest);
        for (let i = 1; i < uniqueSortedX.length; i++) {
            const v = uniqueSortedX[i];
            const d = Math.abs(xVal - v);
            if (d < bestDist) {
                nearest = v;
                bestDist = d;
            }
        }
        
        const snappedPx = margin.left + ((nearest - xDomainMin) / domainSpan) * innerWidth;
        return snappedPx;
    }, [bounds.xMin, bounds.xMax, selectionCanvasRef, uniqueSortedX]);

    const finalizeSelection = useCallback(() => {
        if (selectionRef.current) {
            setActiveSelection(selectionRef.current);
        }
        selectionRef.current = null;
        windowMouseUpAttachedRef.current = false;
    }, []);

    const handleMouseDown: PointOrSliceMouseHandler<ChartLine> = useCallback((_datum, event) => {
        const rect = selectionCanvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const startXRaw = event.clientX - rect.left;
        const startY = event.clientY - rect.top;
        const startX = snapPxToNearestX(startXRaw);
        const start = { xMin: startX, yMin: startY, xMax: startX, yMax: startY };
        selectionRef.current = start;
        setActiveSelection(start);

        if (!windowMouseUpAttachedRef.current) {
            window.addEventListener('mouseup', finalizeSelection, { once: true });
            windowMouseUpAttachedRef.current = true;
        }
    }, [selectionCanvasRef, finalizeSelection, snapPxToNearestX]);

    const handleMouseMove: PointOrSliceMouseHandler<ChartLine> = useCallback((_datum, event) => {
        if (!selectionRef.current) return;
        const rect = selectionCanvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mxRaw = event.clientX - rect.left;
        const my = event.clientY - rect.top;
        const mx = snapPxToNearestX(mxRaw);
        const next = { xMin: selectionRef.current.xMin, yMin: selectionRef.current.yMin, xMax: mx, yMax: my };
        selectionRef.current = next;
        setActiveSelection(next);
    }, [selectionCanvasRef, snapPxToNearestX]);

    const handleMouseUp: PointOrSliceMouseHandler<ChartLine> = useCallback((_datum, _event) => {
        finalizeSelection();
    }, [finalizeSelection]);

    const handleMouseLeave: PointOrSliceMouseHandler<ChartLine> = useCallback((_datum, _event) => {
        if (selectionRef.current && !windowMouseUpAttachedRef.current) {
            window.addEventListener('mouseup', finalizeSelection, { once: true });
            windowMouseUpAttachedRef.current = true;
        }
    }, [finalizeSelection]);

    const clearSelection = useCallback(async () => {
        setActiveSelection(null);
        clear();
        selectionRef.current = null;
        windowMouseUpAttachedRef.current = false;
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
    }, [activeSelection, selectionCanvasRef, clearSelection, setXRange, setYRange, bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax]);

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
        handleMouseMove,
        handleMouseUp,
        handleMouseLeave,
    };

    return (
        <LineInteractionContext.Provider value={value}>
            {children}
        </LineInteractionContext.Provider>
    );
};


