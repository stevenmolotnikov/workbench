import React, { useEffect, ReactNode } from "react";
import { useLineView } from "./LineViewProvider";
import { useLensWorkspace } from "@/stores/useLensWorkspace";
import { TooltipAtX } from "./Tooltip";
import { Button } from "@/components/ui/button";
import { Crop, RotateCcw } from "lucide-react";
import { useSelection } from "./useSelection";
import { useCrosshair } from "./useCrosshair";

export const InteractionLayer = ({ children }: { children: ReactNode }) => {
    const { rafRef, drawRectPx, drawVerticalLinePx, clear, clearCrosshair, activeSelection, crosshairCanvasRef, selectionCanvasRef } = useLineView();
    const { clearHighlightedLineIds } = useLensWorkspace();

    const {
        handleMouseDown,
        zoomIntoActiveSelection,
        resetZoom,
        didDragRef,
    } = useSelection();

    const {
        handleMouseMove,
        handleMouseLeave,
        handleClick,
        hoverSnappedXPx,
        hoverSnappedXValue,
        nearestLineIdAtX,
    } = useCrosshair();

    const combinedHandleMouseLeave = () => {
        handleMouseLeave();
        if (!activeSelection) {
            clear();
        }
    };

    const combinedHandleClick = (e: React.MouseEvent) => {
        if (didDragRef.current) {
            didDragRef.current = false;
            return;
        }
        handleClick(e);
    };

    const handleReset = async () => {
        await resetZoom();
        clearHighlightedLineIds();
    };

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

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex h-[10%] gap-2 items-center p-4 lg:p-8 justify-between">
                {/* <ChartTitle chart={chart} /> */}
                <div className="flex items-center gap-2">
                    <Button
                        variant={activeSelection ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8"
                        onClick={() => { void zoomIntoActiveSelection(activeSelection) }}
                        disabled={!activeSelection}
                        title={activeSelection ? "Zoom into selection and clear selection" : "Draw a selection on the chart first"}
                    >
                        <Crop className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8" onClick={() => { void handleReset() }} title="Reset zoom and clear selection">
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            <div className="flex h-[90%] w-full">
                <div
                    className="size-full relative cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={combinedHandleMouseLeave}
                    onClick={combinedHandleClick}
                >
                    <canvas
                        ref={crosshairCanvasRef}
                        className="absolute inset-0 top-[5%] h-[95%] w-full z-10 pointer-events-none"
                    />
                    <canvas
                        ref={selectionCanvasRef}
                        className="absolute inset-0 top-[5%] h-[95%]  w-full z-20 cursor-crosshair"
                    />
                    {hoverSnappedXValue != null && hoverSnappedXPx != null && (
                        <TooltipAtX xValue={hoverSnappedXValue} xPx={hoverSnappedXPx} nearestLineId={nearestLineIdAtX} />
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
};