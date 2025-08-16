import React, { useCallback, useState, useMemo } from "react";
import { useLineView } from "./LineViewProvider";
import { useLineData } from "./LineDataProvider";
import { lineMargin as margin } from "../theming";
import { useLensWorkspace } from "@/stores/useLensWorkspace";

export const useCrosshair = () => {
    const { selectionCanvasRef } = useLineView();
    const { data, xRange, yRange } = useLineData();
    const { toggleLineHighlight } = useLensWorkspace();

    const [hoverXRaw, setHoverXRaw] = useState<number | null>(null);
    const [hoverYRaw, setHoverYRaw] = useState<number | null>(null);

    const uniqueSortedX = React.useMemo(() => {
        const set = new Set<number>();
        data.lines.forEach(line => {
            line.data.forEach(p => set.add(p.x));
        });
        return Array.from(set).sort((a, b) => a - b);
    }, [data]);

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
        setHoverYRaw(null);
    }, []);

    const handleClick = useCallback((e: React.MouseEvent) => {
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

    const nearestLineIdAtX = useMemo(() => {
        if (hoverSnappedXValue == null) return null;
        const yTarget = hoverYData ?? (yRange[0] + yRange[1]) / 2;
        let bestId: string | null = null;
        let bestDist = Number.POSITIVE_INFINITY;
        for (const line of data.lines) {
            const p = line.data.find(pt => pt.x === hoverSnappedXValue);
            if (!p) continue;
            const dy = Math.abs(p.y - yTarget);
            if (dy < bestDist) {
                bestDist = dy;
                bestId = String(line.id);
            }
        }
        return bestId;
    }, [hoverSnappedXValue, hoverYData, data.lines, yRange]);

    return {
        handleMouseMove,
        handleMouseLeave,
        handleClick,
        hoverSnappedXPx,
        hoverSnappedXValue,
        hoverYData,
        nearestLineIdAtX,
    };
};
