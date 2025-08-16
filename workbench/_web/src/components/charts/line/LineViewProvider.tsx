import React, { createContext, useCallback, useContext, useRef, ReactNode, useState } from "react";
import { lineMargin as margin } from "../theming";
import { useDpr } from "../useDpr";
import { SelectionBounds } from "@/types/charts";

interface LineViewContextValue {
    selectionCanvasRef: React.RefObject<HTMLCanvasElement>;
    crosshairCanvasRef: React.RefObject<HTMLCanvasElement>;
    rafRef: React.MutableRefObject<number | null>;
    drawRectPx: (x0: number, y0: number, x1: number, y1: number) => void;
    drawVerticalLinePx: (xPx: number) => void;
    clear: () => void;
    clearCrosshair: () => void;
    activeSelection: SelectionBounds | null;
    setActiveSelection: (selection: SelectionBounds | null) => void;
}

const LineViewContext = createContext<LineViewContextValue | null>(null);

export const useLineView = () => {
    const context = useContext(LineViewContext);
    if (!context) {
        throw new Error("useLineView must be used within a LineViewProvider");
    }
    return context;
};

interface LineViewProviderProps {
    children: ReactNode;
}

export const LineViewProvider: React.FC<LineViewProviderProps> = ({ children }) => {
    const selectionCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const crosshairCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);

    const [activeSelection, setActiveSelection] = useState<SelectionBounds | null>(null);

    // DPR + resize handling
    useDpr(selectionCanvasRef);
    useDpr(crosshairCanvasRef);

    // Drawing helpers
    const clear = useCallback(() => {
        const canvas = selectionCanvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }, []);

    const clearCrosshair = useCallback(() => {
        const canvas = crosshairCanvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }, []);

    const drawRectPx = useCallback((x0: number, y0: number, x1: number, y1: number) => {
        const canvas = selectionCanvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        // clamp to inner plotting area defined by margins
        const innerMinX = margin.left;
        const innerMaxX = canvas.clientWidth - margin.right;
        const innerMinY = margin.top;
        const innerMaxY = canvas.clientHeight - margin.bottom;
        const minX = Math.max(innerMinX, Math.min(x0, x1));
        const maxX = Math.min(innerMaxX, Math.max(x0, x1));
        const minY = Math.max(innerMinY, Math.min(y0, y1));
        const maxY = Math.min(innerMaxY, Math.max(y0, y1));
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        ctx.fillStyle = "rgba(239,68,68,0.25)"; // red-500 at 25%
        ctx.strokeStyle = "#ef4444"; // red-500
        ctx.lineWidth = 1;
        ctx.fillRect(minX, minY, Math.max(0, maxX - minX), Math.max(0, maxY - minY));
        ctx.strokeRect(minX + 0.5, minY + 0.5, Math.max(0, maxX - minX - 1), Math.max(0, maxY - minY - 1));
    }, []);

    const drawVerticalLinePx = useCallback((xPx: number) => {
        const canvas = crosshairCanvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        ctx.save();
        ctx.strokeStyle = "#9ca3af"; // gray-400
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        const y0 = margin.top;
        const y1 = canvas.clientHeight - margin.bottom;
        ctx.beginPath();
        ctx.moveTo(xPx + 0.5, y0);
        ctx.lineTo(xPx + 0.5, y1);
        ctx.stroke();
        ctx.restore();
    }, []);

    const contextValue: LineViewContextValue = {
        selectionCanvasRef,
        crosshairCanvasRef,
        rafRef,
        drawRectPx,
        drawVerticalLinePx,
        clear,
        clearCrosshair,
        activeSelection,
        setActiveSelection,
    };

    return (

        <LineViewContext.Provider value={contextValue}>
            {children}
        </LineViewContext.Provider>
    );
};
