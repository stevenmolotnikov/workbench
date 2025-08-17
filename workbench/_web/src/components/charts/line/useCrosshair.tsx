import React, { useCallback, useState, useMemo, useEffect } from "react";
import { useLineView } from "./LineViewProvider";
import { useLineData } from "./LineDataProvider";
import { lineMargin as margin } from "../theming";
import { drawVerticalLinePx, clearCrosshair } from "./draw";


interface UseCrosshairProps {
    rafRef: React.MutableRefObject<number | null>;
}

export const useCrosshair = ({ rafRef}: UseCrosshairProps) => {
    const { crosshairCanvasRef, getNearestX } = useLineView();
    const { selectionCanvasRef } = useLineView();
    const { data, yRange } = useLineData();

    const [hoverXRaw, setHoverXRaw] = useState<number | null>(null);
    const [hoverYRaw, setHoverYRaw] = useState<number | null>(null);

    const hoverSnappedXPx = React.useMemo(() => {
        if (hoverXRaw == null) return null;
        return getNearestX(hoverXRaw, true);
    }, [hoverXRaw, getNearestX]);

    const hoverSnappedXValue = React.useMemo(() => {
        if (hoverXRaw == null) return null;
        return getNearestX(hoverXRaw, false);
    }, [hoverXRaw, getNearestX]);

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

    useEffect(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            if (hoverSnappedXPx != null) {
                drawVerticalLinePx(crosshairCanvasRef, hoverSnappedXPx);
            } else {
                clearCrosshair(crosshairCanvasRef);
            }
        });
    }, [hoverSnappedXPx, drawVerticalLinePx, clearCrosshair, rafRef]);

    return {
        handleMouseMove,
        handleMouseLeave,
        hoverSnappedXPx,
        hoverSnappedXValue,
        hoverYData,
        hoverXRaw,
        nearestLineIdAtX,
    };
};
