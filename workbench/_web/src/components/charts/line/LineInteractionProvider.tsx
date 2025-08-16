import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useLineView } from "./LineViewProvider";
import { useLineData } from "./LineDataProvider";
import { lineMargin as margin } from "../theming";
import { SelectionBounds } from "@/types/charts";
import { useLensWorkspace } from "@/stores/useLensWorkspace";

interface LineInteractionContextValue {
    activeSelection: SelectionBounds | null;
    zoomIntoActiveSelection: () => Promise<void>;
    clearSelection: () => Promise<void>;
    handleMouseDown: (e: React.MouseEvent) => void;
    handleClick: (e: React.MouseEvent) => void;
    handleMouseMove: (e: React.MouseEvent) => void;
    handleMouseLeave: () => void;
    hoverSnappedXPx: number | null;
    hoverSnappedXValue: number | null;
    hoverYData: number | null;
}

const LineInteractionContext = createContext<LineInteractionContextValue | null>(null);

export const useLineInteraction = () => {
    const ctx = useContext(LineInteractionContext);
    if (!ctx) throw new Error("useLineInteraction must be used within a LineInteractionProvider");
    return ctx;
};

export const LineInteractionProvider = ({ children }: { children: ReactNode }) => {
    const { selectionCanvasRef, crosshairCanvasRef, rafRef, drawRectPx, drawVerticalLinePx, clear, clearCrosshair } = useLineView();
    const { bounds, setXRange, setYRange, data, xRange, yRange } = useLineData();
    const { highlightedLineIds, setHighlightedLineIds, toggleLineHighlight } = useLensWorkspace();

    const [activeSelection, setActiveSelection] = useState<SelectionBounds | null>(null);
    const selectionRef = useRef<SelectionBounds | null>(null);
    const windowMouseUpAttachedRef = useRef<boolean>(false);
    const didDragRef = useRef<boolean>(false);
    const [hoverXRaw, setHoverXRaw] = useState<number | null>(null);
    const [hoverYRaw, setHoverYRaw] = useState<number | null>(null);

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
        const xDomainMin = xRange[0];
        const xDomainMax = xRange[1];
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
    }, [xRange, selectionCanvasRef, uniqueSortedX]);

    const nearestXValueFromPx = useCallback((px: number): number | null => {
        const canvas = selectionCanvasRef.current;
        if (!canvas || uniqueSortedX.length === 0) return null;
        const innerWidth = Math.max(1, canvas.clientWidth - margin.left - margin.right);
        const xDomainMin = xRange[0];
        const xDomainMax = xRange[1];
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
        return nearest;
    }, [xRange, selectionCanvasRef, uniqueSortedX]);

    const hoverSnappedXPx = React.useMemo(() => {
        if (hoverXRaw == null) return null;
        return snapPxToNearestX(hoverXRaw);
    }, [hoverXRaw, snapPxToNearestX]);

    const hoverSnappedXValue = React.useMemo(() => {
        if (hoverXRaw == null) return null;
        return nearestXValueFromPx(hoverXRaw);
    }, [hoverXRaw, nearestXValueFromPx]);

    const hoverYData = React.useMemo(() => {
        const canvas = selectionCanvasRef.current;
        if (!canvas || hoverYRaw == null) return null;
        const innerHeight = Math.max(1, canvas.clientHeight - margin.top - margin.bottom);
        const curY = yRange as readonly [number, number];
        const y = curY[0] + (1 - (hoverYRaw - margin.top) / innerHeight) * (curY[1] - curY[0]);
        return y;
    }, [hoverYRaw, selectionCanvasRef, yRange]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        const rect = selectionCanvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const startXRaw = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        const startX = snapPxToNearestX(startXRaw);
        const start = { xMin: startX, yMin: startY, xMax: startX, yMax: startY };
        selectionRef.current = start;
        setActiveSelection(start);
        didDragRef.current = false;

        let lastXRaw = startXRaw;
        let lastY = startY;

        const onMove = (ev: MouseEvent) => {
            const r = selectionCanvasRef.current?.getBoundingClientRect();
            if (!r) return;
            const mxRaw = ev.clientX - r.left;
            const my = ev.clientY - r.top;
            const mx = snapPxToNearestX(mxRaw);
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
    }, [selectionCanvasRef, snapPxToNearestX]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const rect = selectionCanvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const xRaw = e.clientX - rect.left;
        const yRaw = e.clientY - rect.top;
        setHoverXRaw(xRaw);
        setHoverYRaw(yRaw);
    }, [selectionCanvasRef]);

    const handleMouseLeave = useCallback(() => {
        setHoverXRaw(null);
        if (!activeSelection) {
            clear();
        }
    }, [activeSelection, clear]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (didDragRef.current) {
            didDragRef.current = false;
            return;
        }
        const rect = selectionCanvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const xRaw = e.clientX - rect.left;
        const yRaw = e.clientY - rect.top;
        const snappedXVal = nearestXValueFromPx(xRaw);
        const canvas = selectionCanvasRef.current;
        if (!canvas || snappedXVal == null) return;
        const innerHeight = Math.max(1, canvas.clientHeight - margin.top - margin.bottom);
        const curY = yRange as readonly [number, number];
        const mouseYData = curY[0] + (1 - (yRaw - margin.top) / innerHeight) * (curY[1] - curY[0]);
        let bestId: string | null = null;
        let bestDist = Number.POSITIVE_INFINITY;
        for (const line of data.lines) {
            const p = line.data.find(pt => pt.x === snappedXVal);
            if (!p) continue;
            const dy = Math.abs(p.y - mouseYData);
            if (dy < bestDist) {
                bestDist = dy;
                bestId = String(line.id);
            }
        }
        if (bestId) toggleLineHighlight(bestId);
    }, [selectionCanvasRef, nearestXValueFromPx, yRange, data.lines, toggleLineHighlight]);

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

        const curX = xRange as readonly [number, number];
        const curY = yRange as readonly [number, number];
        const xMinData = curX[0] + ((minX - margin.left) / innerWidth) * (curX[1] - curX[0]);
        const xMaxData = curX[0] + ((maxX - margin.left) / innerWidth) * (curX[1] - curX[0]);
        const yMinData = curY[0] + (1 - (maxY - margin.top) / innerHeight) * (curY[1] - curY[0]);
        const yMaxData = curY[0] + (1 - (minY - margin.top) / innerHeight) * (curY[1] - curY[0]);

        await clearSelection();
        const newXMin = Math.min(xMinData, xMaxData);
        const newXMax = Math.max(xMinData, xMaxData);
        const newYMin = Math.min(yMinData, yMaxData);
        const newYMax = Math.max(yMinData, yMaxData);
        setXRange([newXMin, newXMax]);
        setYRange([newYMin, newYMax]);

        // If there is no existing highlight set, highlight visible lines within the new ranges
        if (!highlightedLineIds || highlightedLineIds.size === 0) {
            const visibleIds = new Set<string>();
            for (const line of data.lines) {
                const hasVisiblePoint = line.data.some(p => p.x >= newXMin && p.x <= newXMax && p.y >= newYMin && p.y <= newYMax);
                if (hasVisiblePoint) visibleIds.add(String(line.id));
            }
            setHighlightedLineIds(visibleIds);
        }
    }, [activeSelection, selectionCanvasRef, clearSelection, setXRange, setYRange, xRange, yRange, data.lines, highlightedLineIds, setHighlightedLineIds]);

    useEffect(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            if (activeSelection) {
                drawRectPx(activeSelection.xMin, activeSelection.yMin, activeSelection.xMax, activeSelection.yMax);
                // keep crosshair as-is during selection
                if (hoverSnappedXPx != null) drawVerticalLinePx(hoverSnappedXPx);
                else clearCrosshair();
            } else if (hoverSnappedXPx != null) {
                drawVerticalLinePx(hoverSnappedXPx);
                clear();
            } else {
                clear();
                clearCrosshair();
            }
        });
    }, [activeSelection, hoverSnappedXPx, drawRectPx, drawVerticalLinePx, clear, clearCrosshair, rafRef]);

    const value: LineInteractionContextValue = {
        activeSelection,
        zoomIntoActiveSelection,
        clearSelection,
        handleMouseDown,
        handleClick,
        handleMouseMove,
        handleMouseLeave,
        hoverSnappedXPx,
        hoverSnappedXValue,
        hoverYData,
    };

    return (
        <LineInteractionContext.Provider value={value}>
            {children}
        </LineInteractionContext.Provider>
    );
};