import React, { createContext, useCallback, useContext, useRef, ReactNode, useState } from "react";
import { lineMargin as margin } from "../theming";
import { useDpr } from "../useDpr";
import { SelectionBounds } from "@/types/charts";
import { useLineData } from "./LineDataProvider";

interface LineViewContextValue {
    selectionCanvasRef: React.RefObject<HTMLCanvasElement>;
    crosshairCanvasRef: React.RefObject<HTMLCanvasElement>;
    rafRef: React.MutableRefObject<number | null>;
    activeSelection: SelectionBounds | null;
    setActiveSelection: (selection: SelectionBounds | null) => void;
    getNearestX: (px: number, returnPixelValue?: boolean) => number;
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

    const { xRange, uniqueSortedX } = useLineData();

    const getNearestX = useCallback((px: number, returnPixelValue: boolean = false): number => {
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

        if (!returnPixelValue) return nearest;
        const snappedPx = margin.left + ((nearest - xDomainMin) / domainSpan) * innerWidth;
        return snappedPx;
    }, [xRange, selectionCanvasRef, uniqueSortedX]);

    const contextValue: LineViewContextValue = {
        selectionCanvasRef,
        crosshairCanvasRef,
        rafRef, 
        activeSelection,
        setActiveSelection,
        getNearestX,
    };

    return (

        <LineViewContext.Provider value={contextValue}>
            {children}
        </LineViewContext.Provider>
    );
};
