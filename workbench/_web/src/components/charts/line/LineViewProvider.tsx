import React, { createContext, useCallback, useContext, useRef, ReactNode, useState } from "react";
import { lineMargin as margin } from "../theming";
import { useDpr } from "../useDpr";

interface LineViewContextValue {
    selectionCanvasRef: React.RefObject<HTMLCanvasElement>;
    rafRef: React.MutableRefObject<number | null>;
    drawRectPx: (x0: number, y0: number, x1: number, y1: number) => void;
    clear: () => void;
    highlightedLines: Set<string>;
    toggleLineHighlight: (lineId: string) => void;
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
    const rafRef = useRef<number | null>(null);
    const [highlightedLines, setHighlightedLines] = useState<Set<string>>(new Set());

    // DPR + resize handling
    useDpr(selectionCanvasRef);

    const toggleLineHighlight = useCallback((lineId: string) => {
        setHighlightedLines(prev => {
            const newSet = new Set(prev);
            if (newSet.has(lineId)) newSet.delete(lineId); else newSet.add(lineId);
            return newSet;
        });
    }, []);

    // Drawing helpers
    const clear = useCallback(() => {
        const canvas = selectionCanvasRef.current;
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

    const contextValue: LineViewContextValue = {
        selectionCanvasRef,
        rafRef,
        drawRectPx,
        clear,
        highlightedLines,
        toggleLineHighlight,
    };

    return (

        <LineViewContext.Provider value={contextValue}>
            {children}
        </LineViewContext.Provider>
    );
};
