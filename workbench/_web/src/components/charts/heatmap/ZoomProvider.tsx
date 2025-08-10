import React, { createContext, useContext, useState, ReactNode } from "react";
import { useAnnotations } from "@/stores/useAnnotations";
import { useHeatmap } from "./HeatmapProvider";

type Range = [number, number];

export interface ZoomBounds {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
}

interface ZoomContextValue {
    // Zoom State
    isZoomSelecting: boolean;
    setIsZoomSelecting: (selecting: boolean) => void;
    
    // Actions
    handleZoomComplete: (bounds: ZoomBounds) => void;
    toggleZoomSelecting: (next?: boolean) => void;
}

const ZoomContext = createContext<ZoomContextValue | null>(null);

export const useZoom = () => {
    const context = useContext(ZoomContext);
    if (!context) {
        throw new Error("useZoom must be used within a ZoomProvider");
    }
    return context;
};

interface ZoomProviderProps {
    children: ReactNode;
}

export const ZoomProvider: React.FC<ZoomProviderProps> = ({ children }) => {
    const { bounds, xRanges, yRanges, setXRanges, setYRanges } = useHeatmap();
    
    // Zoom State
    const [isZoomSelecting, setIsZoomSelecting] = useState(false);
    
    // External stores
    const { setPendingAnnotation } = useAnnotations();

    const computeNewRanges = (zoomBounds: ZoomBounds) => {
        const hasX = xRanges.length > 0;
        const hasY = yRanges.length > 0;

        const xOffset = 0;
        const yOffset = hasY ? Math.floor(yRanges[0].range[0]) : 0;

        const absMinCol = Math.max(bounds.xMin, Math.min(bounds.xMax, xOffset + zoomBounds.minCol));
        const absMaxCol = Math.max(bounds.xMin, Math.min(bounds.xMax, xOffset + zoomBounds.maxCol));
        const absMinRow = Math.max(bounds.yMin, Math.min(bounds.yMax, yOffset + zoomBounds.minRow));
        const absMaxRow = Math.max(bounds.yMin, Math.min(bounds.yMax, yOffset + zoomBounds.maxRow));

        const currentX = hasX ? xRanges[0].range : [bounds.xMin, bounds.xMax] as Range;
        const currentY = hasY ? yRanges[0].range : [bounds.yMin, bounds.yMax] as Range;

        const newX: Range = [
            Math.max(currentX[0], Math.min(absMinCol, absMaxCol)),
            Math.min(currentX[1], Math.max(absMinCol, absMaxCol))
        ];
        const newY: Range = [
            Math.max(currentY[0], Math.min(absMinRow, absMaxRow)),
            Math.min(currentY[1], Math.max(absMinRow, absMaxRow))
        ];

        return {
            newX,
            newY
        }
    }

    // Handle zoom completion
    const handleZoomComplete = (zoomBounds: ZoomBounds) => {
        const { newX, newY } = computeNewRanges(zoomBounds);

        setXRanges([{ id: `x-zoom-${Date.now()}`, range: newX }]);
        setYRanges([{ id: `y-zoom-${Date.now()}`, range: newY }]);
        
        setIsZoomSelecting(false);
    };

    const toggleZoomSelecting = (next?: boolean) => {
        const value = typeof next === "boolean" ? next : !isZoomSelecting;
        setIsZoomSelecting(value);
        if (value) {
            // Disable annotation creation while zooming
            setPendingAnnotation(null);
        }
    };

    const contextValue: ZoomContextValue = {    
        // Zoom State
        isZoomSelecting,
        setIsZoomSelecting,
        
        // Actions
        handleZoomComplete,
        toggleZoomSelecting,
    };

    return (
        <ZoomContext.Provider value={contextValue}>
            {children}
        </ZoomContext.Provider>
    );
};
